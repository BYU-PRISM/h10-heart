import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PDFDocument } from "pdf-lib";

import { readExample } from "./examples.mjs";

import { analyzeEcgData, extractWindow } from "../src/ecg-analysis.js";
import { buildIntervalTestMetrics } from "../src/interval-test.js";
import { createHeartReportPdfFile } from "../src/pdf-report.js";
import { buildKeyFindings, buildReportHighlights, normalizeReportForRendering } from "../src/report-compat.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sampleRate = 130;
const baseTimeNs = 1_782_500_000_000_000_000;

function makeBeatTimes(durationSec, hrAt, intervalOverrides = new Map()) {
  const beats = [];
  let timeSec = 0.5;
  let beatIndex = 0;
  while (timeSec < durationSec) {
    beats.push(timeSec);
    const override = intervalOverrides.get(beatIndex);
    const interval = override ?? 60 / Math.max(30, hrAt(timeSec));
    timeSec += interval;
    beatIndex++;
  }
  return beats;
}

function makeCsv({ durationSec, hrAt, omitRanges = [], intervalOverrides = new Map(), startTimeNs = baseTimeNs, signalMutation = null }) {
  const beatTimes = makeBeatTimes(durationSec, hrAt, intervalOverrides);
  const rows = ["time,ecg,hr,rr,marker"];
  let beatIndex = 0;
  for (let sample = 0; sample <= Math.floor(durationSec * sampleRate); sample++) {
    const timeSec = sample / sampleRate;
    if (omitRanges.some(([start, end]) => timeSec >= start && timeSec < end)) continue;
    while (beatIndex + 1 < beatTimes.length && Math.abs(beatTimes[beatIndex + 1] - timeSec) < Math.abs(beatTimes[beatIndex] - timeSec)) beatIndex++;
    const distance = timeSec - beatTimes[beatIndex];
    const qrs = 1.45 * Math.exp(-((distance / 0.016) ** 2));
    const sWave = -0.22 * Math.exp(-(((distance - 0.042) / 0.022) ** 2));
    const baseline = 0.025 * Math.sin(timeSec * Math.PI * 0.7) + 0.008 * Math.sin(timeSec * Math.PI * 3.1);
    const rawEcg = baseline + qrs + sWave;
    const ecg = signalMutation ? signalMutation(timeSec, rawEcg) : rawEcg;
    rows.push(`${Math.round(startTimeNs + timeSec * 1e9)},${ecg.toFixed(6)}`);
  }
  return rows.join("\n");
}

function analyzeCsv(text, profile = { age: 40 }) {
  return analyzeEcgData([{ name: "synthetic.csv", text }], profile);
}

console.log("Verifying deterministic rest recording...");
const restResult = analyzeCsv(makeCsv({ durationSec: 12 * 60, hrAt: () => 60 }));
assert.ok(Math.abs(restResult.report.universal.sampleRate - sampleRate) < 0.5, "Expected median-derived sample rate near 130 Hz.");
assert.equal(restResult.report.universal.gapCount, 0, "Continuous recording should have no gaps.");
assert.ok(restResult.report.universal.rPeakConfidence >= 80, "Clean synthetic ECG should have high R-peak confidence.");
assert.ok(restResult.report.universal.cleanBeatPercentage >= 95, "Clean synthetic ECG should retain most beats.");
assert.ok(Math.abs(restResult.report.rest.hr.median - 60) < 3, "Rest HR should be close to 60 bpm.");
assert.ok(restResult.report.rest.hrv.rmssd < 10, "Constant RR intervals should have low RMSSD.");
assert.equal(restResult.report.classification.inferredMode, "rest", "Short low-HR recording should classify as rest.");
assert.equal(restResult.report.rhythm.reviewPriority, "Low", "Clean regular rest recording should be low priority.");

console.log("Verifying missing-sample and gap accounting...");
const gapResult = analyzeCsv(makeCsv({
  durationSec: 4 * 60,
  hrAt: () => 65,
  omitRanges: [[30, 31.2], [120, 120.5]]
}));
assert.equal(gapResult.report.universal.gapCount, 2, "Expected two timestamp gaps.");
assert.ok(gapResult.report.universal.missingSamples > 200, "Expected missing samples to be estimated from gap duration.");
assert.ok(gapResult.report.visualizationData.gaps.every((gap) => gap.durationSec > 0), "Gap timeline entries require durations.");

console.log("Verifying flexible ECG-only CSV schemas and timestamp units...");
const canonicalAliasSource = makeCsv({ durationSec: 70, hrAt: () => 72 });
const canonicalAliasLines = canonicalAliasSource.split("\n");
const secondsAliasCsv = ["timestamp,ecg_uV", ...canonicalAliasLines.slice(1).map((line) => {
  const [time, ecg] = line.split(",");
  return `${((Number(time) - baseTimeNs) / 1e9).toFixed(9)},${ecg}`;
})].join("\n");
const secondsAliasResult = analyzeCsv(secondsAliasCsv);
assert.ok(Math.abs(secondsAliasResult.report.universal.sampleRate - sampleRate) < 0.5, "Decimal-second timestamp alias should preserve sample rate.");
assert.equal(secondsAliasResult.report.universal.ingestion.units.s, 1, "Timestamp unit should be inferred as seconds.");
const sampleIndexCsv = ["sample_index,ECG_uV", ...canonicalAliasLines.slice(1).map((line, index) => `${index},${line.split(",")[1]}`)].join("\n");
const sampleIndexResult = analyzeCsv(sampleIndexCsv);
assert.ok(Math.abs(sampleIndexResult.report.universal.sampleRate - sampleRate) < 0.5, "sample_index should use the nominal 130 Hz rate.");
assert.equal(sampleIndexResult.report.universal.ingestion.units.sample_index, 1, "sample_index schema should be reported.");

console.log("Verifying contact-displacement consolidation before rhythm screening...");
const displacementResult = analyzeCsv(makeCsv({
  durationSec: 6 * 60,
  hrAt: () => 65,
  signalMutation: (timeSec, ecg) => timeSec >= 150 && timeSec < 170 ? 0.25 : ecg
}));
assert.ok(displacementResult.report.universal.displacementEpisodeCount >= 1, "Flat contact period should create a consolidated displacement episode.");
assert.ok(displacementResult.report.rhythm.artifactEpisodes.length >= 1, "Low-quality contact period should be exposed as one artifact episode.");
assert.equal(displacementResult.report.rhythm.pauseCount, 0, "Contact loss should not become a pause-candidate warning cascade.");

console.log("Verifying interval workout, load, recovery, and drift eligibility...");
const intervalHr = (timeSec) => {
  const phase = timeSec % 240;
  if (phase < 75) return 105;
  if (phase < 165) return 160;
  return 100;
};
const workoutResult = analyzeCsv(makeCsv({ durationSec: 36 * 60, hrAt: intervalHr }), { age: 30 });
assert.equal(workoutResult.report.classification.inferredMode, "workout", "Sustained high-HR recording should classify as workout.");
assert.ok(workoutResult.report.workout.loadScore > 0, "Workout load should be positive.");
assert.ok(workoutResult.report.workout.intervalDetection.applicable, "Repeated high-HR blocks should produce interval detection.");
assert.ok(workoutResult.report.workout.intervalDetection.count >= 2, "Expected multiple intervals.");
assert.equal(workoutResult.report.workout.drift.eligible, false, "Interval-like workouts should not report HR-only drift.");
assert.ok(workoutResult.report.workout.zones.reduce((sum, zone) => sum + zone.seconds, 0) > 30 * 60, "Zone time should cover most clean workout duration.");

console.log("Verifying five one-minute baseline-gated repeats and aggregate rates...");
const protocolFirstStart = 120;
const protocolHrAt = (timeSec) => {
  if (timeSec < protocolFirstStart) return 60;
  const phase = (timeSec - protocolFirstStart) % 120;
  if (phase < 60) return 60 + phase;
  if (phase < 90) return 110;
  return 60;
};
const protocolBeats = makeBeatTimes(13 * 60, protocolHrAt).map((timeSec) => ({
  time: baseTimeNs + timeSec * 1e9,
  val: 60000 / protocolHrAt(timeSec)
}));
const protocolResult = buildIntervalTestMetrics({
  cleanRrs: protocolBeats,
  minTime: baseTimeNs,
  durationSec: 13 * 60,
  profileInfo: {
    recordingType: "interval-test",
    protocol: {
      enabled: true,
      firstIntervalStartSec: protocolFirstStart,
      baselineToleranceBpm: 5,
      baselineHoldSec: 30,
      maximumRecoverySec: 120
    }
  }
});
assert.equal(protocolResult.status, "complete", "All baseline-gated efforts should complete.");
assert.ok(protocolResult.repetitions.length >= 3, "Protocol must produce at least three one-minute repetitions.");
assert.ok(protocolResult.repetitions.every((repetition) => repetition.durationSec === 60), "Every protocol effort must be exactly one minute.");
assert.equal(protocolResult.statistics.rampRateBpmPerMin.count, protocolResult.repetitions.length, "Ramp statistics should include all quality-valid repeats.");
assert.ok(protocolResult.statistics.recoveryRateBpmPerMin.count >= 3, "Recovery-rate statistics should include at least three repeats.");
assert.ok(protocolResult.statistics.rampRateBpmPerMin.mean > 40, "Synthetic efforts should produce a strong positive one-minute ramp.");
assert.ok(protocolResult.statistics.recoveryRateBpmPerMin.mean > 35, "Synthetic recoveries should produce a positive first-minute recovery rate.");

const incompleteProtocol = buildIntervalTestMetrics({
  cleanRrs: makeBeatTimes(6 * 60, (timeSec) => timeSec < 120 ? 60 : 120).map((timeSec) => ({
    time: baseTimeNs + timeSec * 1e9,
    val: 60000 / (timeSec < 120 ? 60 : 120)
  })),
  minTime: baseTimeNs,
  durationSec: 6 * 60,
  profileInfo: {
    recordingType: "interval-test",
    protocol: { enabled: true, firstIntervalStartSec: 120, maximumRecoverySec: 120 }
  }
});
assert.ok(incompleteProtocol.repetitions.length < 3, "Not enough dynamic peaks detected.");
assert.equal(incompleteProtocol.status, "insufficient-recording", "Missing peaks should result in insufficient-recording.");

console.log("Verifying steady long-file HR drift proxy...");
const driftResult = analyzeCsv(makeCsv({
  durationSec: 32 * 60,
  hrAt: (timeSec) => 120 + 12 * timeSec / (32 * 60)
}), { age: 35 });
assert.equal(driftResult.report.workout.drift.eligible, true, "Steady 30+ minute file should be drift-eligible.");
assert.ok(driftResult.report.workout.drift.valuePct > 2, "Rising synthetic HR should create positive drift.");

console.log("Verifying candidate pause and ectopic patterns...");
const eventOverrides = new Map([
  [120, 0.6],
  [121, 1.4],
  [240, 2.2]
]);
const eventResult = analyzeCsv(makeCsv({ durationSec: 6 * 60, hrAt: () => 60, intervalOverrides: eventOverrides }));
assert.ok(eventResult.report.rhythm.ectopicCount >= 1, "Premature/compensatory pair should create an ectopic candidate.");
assert.ok(eventResult.report.rhythm.pauseCount >= 1, "Long RR interval should create a pause candidate.");
assert.ok(eventResult.report.rhythm.regularityScore < 100, "Candidate events should reduce rhythm regularity.");

console.log("Verifying overlapping CSV chunks and explorer timestamp lookup...");
const overlapA = makeCsv({ durationSec: 90, hrAt: () => 62, startTimeNs: baseTimeNs });
const overlapB = makeCsv({ durationSec: 90, hrAt: () => 62, startTimeNs: baseTimeNs + 60e9 });
const overlapResult = analyzeEcgData([
  { name: "part-2.csv", text: overlapB },
  { name: "part-1.csv", text: overlapA }
], { age: 40 });
assert.ok(overlapResult.report.universal.durationSec > 140, "Overlapping chunks should merge by timestamp.");
const explorerWindow = extractWindow(overlapResult.rawData, 65, 10);
assert.ok(explorerWindow.ecg.median.length > 100, "Explorer should use timestamp-based extraction after overlap de-duplication.");

console.log("Verifying error handling...");
assert.throws(
  () => analyzeEcgData([{ name: "bad.csv", text: "not,a,valid,file\n1,2,3,4" }], { age: 40 }),
  /No usable ECG samples/,
  "Invalid CSV should produce a clear analysis error."
);

console.log("Verifying bundled recordings...");
const bundledShort = analyzeEcgData(await readExample("rest"), { age: 40 });
assert.ok(bundledShort.report.universal.totalSamples > 60_000, "Bundled short ECG should parse.");
assert.ok(bundledShort.report.rest.hr.min > 35 && bundledShort.report.rest.hr.max < 120, "Clean robust extrema should resist isolated implausible beats.");

console.log("Verifying backward-compatible dashboard report fields...");
const legacyReport = structuredClone(bundledShort.report);
delete legacyReport.universal.hrUsablePercentage;
delete legacyReport.universal.hrvUsablePercentage;
delete legacyReport.universal.morphologyUsablePercentage;
delete legacyReport.universal.qualityGrades;
delete legacyReport.rhythm.candidateBurdenPer1000;
delete legacyReport.rhythm.artifactEpisodes;
const compatibleReport = normalizeReportForRendering(legacyReport);
assert.ok(Number.isFinite(compatibleReport.universal.hrUsablePercentage), "Older worker reports need a finite HR-usability fallback.");
assert.ok(Number.isFinite(compatibleReport.universal.hrvUsablePercentage), "Older worker reports need a finite HRV-usability fallback.");
assert.ok(Number.isFinite(compatibleReport.universal.morphologyUsablePercentage), "Older worker reports need a finite morphology-usability fallback.");
assert.equal(typeof compatibleReport.universal.qualityGrades.hr, "string", "Older worker reports need usability-grade fallbacks.");
assert.ok(Number.isFinite(compatibleReport.rhythm.candidateBurdenPer1000), "Older worker reports need a rhythm-burden fallback.");
assert.equal(buildReportHighlights(compatibleReport, "rest").length, 4, "Dashboard and PDF should share four at-a-glance highlights.");

const bundledSleep = analyzeEcgData(await readExample("sleep"), { age: 40 });
assert.ok(bundledSleep.report.universal.durationSec > 5 * 3600, "Bundled sleep archive should span more than five hours.");
assert.equal(bundledSleep.report.classification.inferredMode, "sleep", "Long overnight bundled recording should classify as sleep.");
assert.ok(bundledSleep.report.rest.hrvValidDurationSec > 3 * 3600, "Bundled sleep recording should contain substantial HRV-valid duration.");
assert.ok(bundledSleep.report.rest.hr.min > 25 && bundledSleep.report.rest.hr.max < 200, "Clean sleep extrema should exclude isolated 20/244 bpm artifacts.");

console.log("Verifying extended HRV statistics and sleep diagnostics...");
const sleepHrv = bundledSleep.report.hrv;
assert.ok(Number.isFinite(sleepHrv.time.meanNN) && sleepHrv.time.meanNN > 400, "Extended time-domain HRV should report mean NN.");
assert.ok(Number.isFinite(sleepHrv.time.pNN20) && sleepHrv.time.pNN20 >= sleepHrv.time.pNN50, "pNN20 must be at least pNN50.");
assert.ok(sleepHrv.frequencyAvailable && sleepHrv.frequency.lf > 0 && sleepHrv.frequency.hf > 0, "Overnight recording should produce frequency-domain HRV.");
assert.ok(sleepHrv.frequency.respirationBpm > 5 && sleepHrv.frequency.respirationBpm < 30, "Estimated breathing rate should be physiologically plausible.");
assert.ok(sleepHrv.nonlinear.available && sleepHrv.nonlinear.sd1 > 0 && sleepHrv.nonlinear.sd2 > sleepHrv.nonlinear.sd1, "Poincare SD2 should exceed SD1 during sleep.");
assert.ok(bundledSleep.report.rest.hourly.length >= 5, "Overnight recording should produce an hourly summary.");
assert.ok(bundledSleep.report.rest.stageProxy.available, "Overnight recording should produce a sleep-stage proxy.");
assert.ok(bundledSleep.report.rest.nocturnalDip.available, "Overnight recording should compute a nocturnal HR dip.");
assert.ok(bundledSleep.report.rhythm.verification, "Rhythm candidates should carry an artifact-verification summary.");
assert.ok(bundledSleep.report.visualizationData.lfhfTrend.length > 10, "LF/HF trend should exist for the overnight recording.");
const sleepFindings = buildKeyFindings(bundledSleep.report, "sleep");
assert.ok(sleepFindings.length >= 2, "Key findings should be produced for the sleep recording.");
assert.ok(sleepFindings.every((finding) => ["action", "watch", "good", "info"].includes(finding.severity)), "Findings must carry a known severity.");
const beatWindow = extractWindow(bundledSleep.rawData, 120, 10);
assert.ok(beatWindow.beats.length >= 5, "Explorer windows at close zoom should include R-peak beat annotations.");
assert.ok(beatWindow.beats.every((beat) => beat.pos >= 0 && beat.pos <= 1), "Beat annotations must be positioned within the window.");

console.log("Verifying artifact-verification keeps synthetic true events...");
const verifiedEventResult = analyzeCsv(makeCsv({ durationSec: 6 * 60, hrAt: () => 60, intervalOverrides: eventOverrides }));
assert.ok(verifiedEventResult.report.rhythm.ectopicCount >= 1, "Template verification should keep true premature beats with clean morphology.");
assert.ok(verifiedEventResult.report.rhythm.pauseCount >= 1, "Template verification should keep true pauses with clean flanking beats.");

console.log("Verifying PDF structure...");
const logoBytes = new Uint8Array(await readFile(path.join(rootDir, "public", "irsri.png")));
const pdfBytes = await createHeartReportPdfFile(
  compatibleReport,
  { name: "Sample Athlete", age: 40 },
  "rest",
  { startSec: 0, endSec: 30 },
  [
    {
      key: "quality",
      title: "Signal Quality Score",
      canvas: {
        toDataURL: () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
      }
    },
    {
      key: "explorer",
      title: "ECG Explorer - Current Window",
      canvas: {
        toDataURL: () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
      }
    }
  ],
  { logoBytes }
);
const pdf = await PDFDocument.load(pdfBytes);
assert.ok(pdf.getPageCount() >= 3, "Metric report with graphs should create a multi-page PDF.");
assert.ok(pdfBytes.length > 100_000, "Branded PDF should embed the IRSRI logo.");

console.log("Verifying full sleep PDF with statistics tables...");
const sleepPdfBytes = await createHeartReportPdfFile(
  bundledSleep.report,
  { name: "Sleep Athlete", age: 40, recordingType: "sleep" },
  "sleep",
  { startSec: 0, endSec: 30 },
  [],
  { logoBytes }
);
const sleepPdf = await PDFDocument.load(sleepPdfBytes);
assert.ok(sleepPdf.getPageCount() >= 3, "Sleep report with statistics tables should span multiple pages.");

console.log("All ECG dashboard verification checks passed.");
