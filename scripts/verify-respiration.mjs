import assert from "node:assert/strict";
import { normalizeReportForRendering } from "../src/report-compat.js";
import { analyzeEcgData } from "../src/ecg-analysis.js";
import { estimateRespiration, respirationCsv } from "../src/respiration.js";

// Ground truth exists only in these synthetic tests. Both beat times and a
// continuous QRS waveform are generated before sampling at the H10's 130 Hz.
function fixture({ rate = 15, shapeRate = rate, hr = 60, rsa = 0.04, modulation = 0.12, duration = 360, invert = false, flat = false, gap = null, noise = false } = {}) {
  const hz = 130, minTime = 1_780_000_000_000_000_000;
  const beats = [], peaks = [], nn = [];
  let t = 0.4, last = null, seed = 7;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 - 0.5; };
  while (t < duration) {
    const rounded = Math.round(t * hz) / hz;
    beats.push({ t, amplitude: noise ? 1 + random() * 0.35 : 1 + modulation * Math.sin(2 * Math.PI * shapeRate / 60 * t) });
    const peak = Math.round(t * hz);
    if (!(gap && rounded >= gap[0] && rounded < gap[1])) {
      peaks.push(peak);
      if (last !== null) nn.push({ time: minTime + rounded * 1e9, val: (rounded - last) * 1000 });
    }
    last = rounded;
    t += 60 / hr * (1 + (noise ? random() * 0.04 : rsa * Math.sin(2 * Math.PI * rate / 60 * t)));
  }
  const ecgs = [], ecgTimes = [], csv = ["time,ecg"];
  let b = 0;
  for (let i = 0; i <= duration * hz; i++) {
    const sec = i / hz;
    while (b + 1 < beats.length && Math.abs(beats[b + 1].t - sec) < Math.abs(beats[b].t - sec)) b++;
    const d = sec - beats[b].t;
    let value = flat ? 0 : beats[b].amplitude * (1.4 * Math.exp(-((d / 0.016) ** 2)) - 0.2 * Math.exp(-(((d - 0.04) / 0.02) ** 2)));
    if (invert) value *= -1;
    ecgs.push(value); ecgTimes.push(minTime + sec * 1e9);
    csv.push(`${minTime + sec * 1e9},${value}`);
  }
  const qualityTimeline = Array.from({ length: duration / 10 + 1 }, (_, i) => ({ startSec: i * 10, endSec: (i + 1) * 10, morphologyUsable: !flat, hrvUsable: !flat }));
  return { ecgs, ecgTimes, primaryPeaks: peaks, cleanRrs: flat ? [] : nn, minTime, durationSec: duration, sampleRate: hz, qualityTimeline,
    gaps: gap ? [{ timeSec: gap[0], durationSec: gap[1] - gap[0] }] : [], csv: csv.join("\n") };
}

for (const [rate, hr, mode] of [[15, 60, "sleep"], [8, 60, "sleep"], [30, 140, "workout"], [42, 160, "workout"], [66, 180, "workout"]]) {
  const data = fixture({ rate, hr });
  const r = estimateRespiration({ ...data, mode });
  console.log(`${mode} ${rate}/min: median ${r.summary.medianBpm}, coverage ${r.summary.coveragePct.toFixed(0)}%`);
  assert.ok(r.summary.coveragePct > 75, "Known respiratory modulation should have broad support");
  assert.ok(Math.abs(r.summary.medianBpm - rate) < 1.5, "Known rate should be recovered within the window's resolution");
}

const inverted = estimateRespiration({ ...fixture({ invert: true }), mode: "sleep" });
assert.ok(Math.abs(inverted.summary.medianBpm - 15) < 1);
const morphologyOnly = estimateRespiration({ ...fixture({ hr: 150, rate: 36, rsa: 0 }), mode: "workout" });
assert.ok(Math.abs(morphologyOnly.summary.medianBpm - 36) < 1.5, "Morphology should work with weak or absent RSA");
assert.ok(morphologyOnly.windows.some((w) => w.source === "morphology only"));
const flat = estimateRespiration({ ...fixture({ flat: true }), mode: "sleep" });
assert.equal(flat.summary.medianBpm, null, "Unavailable is null, never zero breaths/min");
assert.equal(flat.available, false);
const constant = estimateRespiration({ ...fixture({ rsa: 0, modulation: 0 }), mode: "sleep" });
assert.equal(constant.available, false, "Constant ECG with no respiratory modulation must not invent breaths");
const conflict = estimateRespiration({ ...fixture({ rate: 12, shapeRate: 22, hr: 80 }), mode: "sleep" });
assert.ok(conflict.summary.coveragePct < 20, "Strong discordant physiological families should suppress estimates");
const noise = estimateRespiration({ ...fixture({ noise: true, duration: 900, hr: 150 }), mode: "workout" });
console.log(`Aperiodic beat/shape noise accepted: ${noise.summary.coveragePct.toFixed(1)}%`);
assert.ok(noise.summary.coveragePct < 20, "Uncorrelated noise should usually be rejected");
const withGap = estimateRespiration({ ...fixture({ gap: [130, 150] }), mode: "sleep" });
for (const w of withGap.windows.filter((w) => w.startSec < 150 && w.endSec > 130)) assert.equal(w.bpm, null, "Never estimate across a recording gap");
assert.ok(withGap.windows.some((w) => w.startSec > 150 && Number.isFinite(w.bpm)), "Recover after the gap");
const short = estimateRespiration({ ...fixture({ duration: 20 }), mode: "sleep" });
assert.equal(short.windows.length, 0);
assert.equal(short.summary.medianBpm, null);
assert.ok(!respirationCsv(flat).includes('"0.000","unavailable"'), "Missing respiration must be blank in CSV");
assert.equal(respirationCsv(withGap).split("\n").length, withGap.windows.length + 1);

const full = analyzeEcgData([{ name: "known-breathing.csv", text: fixture({ duration: 360 }).csv }], { recordingType: "sleep" }).report;
assert.ok(Math.abs(full.respiration.summary.medianBpm - 15) < 1.5, "End-to-end CSV ingestion and peak detection must recover known breathing");
assert.equal(full.rest.respirationBpm, full.respiration.summary.medianBpm);
assert.equal(full.rest.hourly[0].respirationBpm, full.respiration.summary.medianBpm);
const legacy = structuredClone(full);
delete legacy.respiration;
normalizeReportForRendering(legacy);
assert.equal(legacy.respiration.available, false);
assert.equal(legacy.rest.respirationBpm, null, "Legacy HF peaks must not masquerade as the new estimate");
assert.equal(legacy.rest.hourly[0].respirationBpm, null);
console.log("Breathing-rate verification passed.");
