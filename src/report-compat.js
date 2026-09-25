function finiteOr(...values) {
  return values.find((value) => Number.isFinite(value));
}

function usabilityGrade(value) {
  if (!Number.isFinite(value)) return "Unavailable";
  if (value >= 90) return "High";
  if (value >= 75) return "Good";
  if (value >= 55) return "Limited";
  return "Insufficient";
}

function countRhythmCandidates(rhythm = {}) {
  return [rhythm.ectopicCount, rhythm.pauseCount, rhythm.irregularEpisodeCount]
    .reduce((sum, value) => sum + (Number.isFinite(value) ? Math.max(0, value) : 0), 0);
}

export function normalizeReportForRendering(report) {
  if (!report || typeof report !== "object") throw new Error("The analysis returned an invalid report.");

  const legacyBreathing = !report.respiration;
  report.respiration ??= {
    available: false, windows: [], buckets: [], summary: { medianBpm: null, p10Bpm: null, p90Bpm: null, coveragePct: 0, acceptedWindows: 0, totalWindows: 0, agreementWindows: 0 },
    settings: {}, reasonCounts: {}, method: "ECG-derived respiration",
    caveat: "Reanalyze the original ECG to generate breathing estimates. Older reports contain only a narrow HF-band peak proxy.", timingNote: ""
  };
  report.universal ??= {};
  report.classification ??= {};
  report.workout ??= {};
  report.rest ??= {};
  if (legacyBreathing) {
    report.rest.respirationBpm = null;
    for (const hour of report.rest.hourly ?? []) { hour.respirationBpm = null; hour.respirationCoveragePct = 0; }
  }
  report.rhythm ??= {};
  report.methodology ??= {};
  report.visualizationData ??= {};

  const u = report.universal;
  const rhythm = report.rhythm;
  const cleanBeatFallback = finiteOr(
    u.cleanBeatPercentage,
    Number.isFinite(u.artifactPercentage) ? 100 - u.artifactPercentage : undefined,
    u.qualityScore,
    0
  );
  const morphologyFallback = finiteOr(u.qualityComponents?.morphology, cleanBeatFallback, 0);

  u.hrUsablePercentage = finiteOr(u.hrUsablePercentage, cleanBeatFallback, 0);
  u.hrvUsablePercentage = finiteOr(u.hrvUsablePercentage, Math.min(u.hrUsablePercentage, cleanBeatFallback), 0);
  u.morphologyUsablePercentage = finiteOr(u.morphologyUsablePercentage, morphologyFallback, 0);
  u.qualityGrades = {
    hr: u.qualityGrades?.hr ?? usabilityGrade(u.hrUsablePercentage),
    hrv: u.qualityGrades?.hrv ?? usabilityGrade(u.hrvUsablePercentage),
    morphology: u.qualityGrades?.morphology ?? usabilityGrade(u.morphologyUsablePercentage)
  };
  u.displacementEpisodeCount = finiteOr(u.displacementEpisodeCount, 0);
  u.flatlineDurationSec = finiteOr(u.flatlineDurationSec, 0);
  u.clippedSamplePercentage = finiteOr(u.clippedSamplePercentage, 0);

  rhythm.artifactEpisodes = Array.isArray(rhythm.artifactEpisodes) ? rhythm.artifactEpisodes : [];
  rhythm.artifactExcludedIntervalCount = finiteOr(
    rhythm.artifactExcludedIntervalCount,
    rhythm.qualityExcludedBeatCount,
    0
  );
  rhythm.ectopicCount = finiteOr(rhythm.ectopicCount, 0);
  rhythm.pauseCount = finiteOr(rhythm.pauseCount, 0);
  rhythm.irregularEpisodeCount = finiteOr(rhythm.irregularEpisodeCount, 0);
  const candidateCount = countRhythmCandidates(rhythm);
  const usableBeatCount = finiteOr(report.workout.cleanBeatCount, u.detectedBeats, 0);
  rhythm.candidateBurdenPer1000 = finiteOr(
    rhythm.candidateBurdenPer1000,
    usableBeatCount > 0 ? candidateCount / usableBeatCount * 1000 : 0
  );
  rhythm.reviewPriority ||= candidateCount ? "Moderate" : "Low";

  return report;
}

function fixed(value, digits = 0, fallback = "--") {
  return Number.isFinite(value) ? value.toFixed(digits) : fallback;
}

const SEVERITY_ORDER = { action: 0, watch: 1, good: 2, info: 3 };

// Prioritized, plain-language findings that tell the athlete or reviewer what
// matters most in this recording and what to do about it. Ordered by severity:
// action > watch > good > info. Every finding is descriptive screening
// support, not a diagnosis.
export function buildKeyFindings(report, selectedMode) {
  const normalized = normalizeReportForRendering(report);
  const u = normalized.universal;
  const rest = normalized.rest ?? {};
  const workout = normalized.workout ?? {};
  const rhythm = normalized.rhythm;
  const verification = rhythm.verification ?? {};
  const mode = selectedMode === "auto" || !selectedMode
    ? normalized.classification.inferredMode
    : selectedMode;
  const workoutMode = mode === "workout" || mode === "mixed";
  const restMode = mode === "sleep" || mode === "rest" || mode === "mixed";
  const findings = [];
  const add = (severity, title, detail, timeSec = null) => findings.push({ severity, title, detail, timeSec });

  // ── Rhythm review ──
  if (rhythm.reviewPriority === "High") {
    add("action", "Rhythm screening priority: High",
      `${rhythm.pauseCount} verified pause and ${rhythm.ectopicCount} premature-beat candidates in clean signal (${fixed(rhythm.ectopicBurdenPct, 2)}% burden). Share this report and the PDF with a clinician for waveform review.`);
  } else if (rhythm.reviewPriority === "Moderate") {
    add("watch", "Rhythm screening priority: Moderate",
      `${rhythm.ectopicCount} premature-beat, ${rhythm.pauseCount} pause, and ${rhythm.irregularEpisodeCount} irregular-sequence candidates survived artifact screening. Inspect each event in the ECG explorer before drawing conclusions.`);
  }
  if (rhythm.pauseCount >= 1 && rhythm.reviewPriority !== "High") {
    const firstPause = (rhythm.events ?? []).find((event) => event.type === "pause" && event.classification !== "artifact-suspected");
    add("watch", `${rhythm.pauseCount} verified long-pause candidate${rhythm.pauseCount === 1 ? "" : "s"}`,
      "A long RR interval with clean normal beats on both sides can reflect a dropped or blocked beat. Review the waveform at the flagged time.",
      firstPause?.timeSec ?? null);
  }
  if (rhythm.ectopicCount > 0 && rhythm.ectopicBurdenPct < 1 && rhythm.reviewPriority === "Low") {
    add("info", `${rhythm.ectopicCount} isolated premature-beat candidate${rhythm.ectopicCount === 1 ? "" : "s"}`,
      `Low burden (${fixed(rhythm.ectopicBurdenPct, 2)}% of beats). Occasional premature beats are common, including in athletes; they warrant attention mainly when frequent, increasing, or symptomatic.`);
  }
  const artifactRejected = (verification.artifactEctopicCount ?? 0) + (verification.artifactPauseCount ?? 0);
  if (artifactRejected > 0) {
    add("info", `${artifactRejected} candidate${artifactRejected === 1 ? "" : "s"} attributed to sensor artifact`,
      "Beat-shape template matching found distorted neighboring beats at these events, so they were excluded from rhythm counts rather than reported as arrhythmia.");
  }

  // ── Signal quality ──
  if (u.hrUsablePercentage < 70) {
    add("watch", `Only ${fixed(u.hrUsablePercentage, 0)}% of the recording is analyzable`,
      "Motion or strap contact limited this session. Moisten the electrodes, snug the strap one notch, and position the sensor just below the chest muscles before the next recording.");
  } else if (u.hrUsablePercentage >= 90 && u.qualityScore >= 85) {
    add("good", `Strong signal quality (${u.qualityScore}/100)`,
      `${fixed(u.hrUsablePercentage, 1)}% of the recording supports heart-rate analysis and ${fixed(u.hrvUsablePercentage, 1)}% meets the stricter HRV standard.`);
  }

  // ── Sleep / rest ──
  if (restMode) {
    if (rest.elevatedRestingHrFlag) {
      add("watch", "Sustained elevated resting heart rate",
        "Stable HR ran at least 10 bpm above this recording's own resting reference for 15+ minutes. Common causes include late training, heat, illness, stress, or alcohol; compare against upcoming nights.");
    }
    if (rest.suppressedHrvFlag) {
      add("watch", "HRV suppressed versus this session's baseline",
        "Consecutive windows sat well below the session's median lnRMSSD. If this repeats across nights alongside elevated HR, treat it as a recovery warning.");
    }
    const dip = rest.nocturnalDip;
    if (dip?.available && Number.isFinite(dip.dipPct)) {
      if (dip.dipPct >= 8) {
        add("good", `Healthy overnight HR dip (${fixed(dip.dipPct, 0)}%)`,
          `Heart rate settled from ${fixed(dip.referenceHr, 0)} bpm in the first hour to a stable low of ${fixed(dip.lowestStableHr, 0)} bpm.`);
      } else {
        add("watch", `Blunted overnight HR dip (${fixed(dip.dipPct, 0)}%)`,
          "Heart rate stayed close to its first-hour level. One flat night is usually situational (late meal, alcohol, heat, stress); a repeating pattern is worth tracking.");
      }
    }
    if (Number.isFinite(rest.restingHr) && rest.restingHr > 0 && rest.restingHr <= 60 && !rest.elevatedRestingHrFlag) {
      add("good", `Resting HR ${fixed(rest.restingHr, 0)} bpm`,
        `Lowest stable 5-minute average ${fixed(rest.lowest5MinHr, 0)} bpm. Low resting rates are typical of endurance-trained athletes.`);
    }
    if ((rest.bradycardiaEpisodes?.length ?? 0) > 0) {
      add("info", `${rest.bradycardiaEpisodes.length} episode${rest.bradycardiaEpisodes.length === 1 ? "" : "s"} below 40 bpm`,
        "Sleeping heart rates under 40 bpm are common in trained athletes. They deserve review mainly with daytime symptoms (dizziness, fainting, unusual fatigue).",
        rest.bradycardiaEpisodes[0]?.startSec ?? null);
    }
  }

  // ── Workout ──
  if (workoutMode) {
    const hrr60 = workout.recovery?.values?.[60];
    if (hrr60?.available && Number.isFinite(hrr60.drop)) {
      if (hrr60.drop >= 12) {
        add("good", `Fast HR recovery: -${fixed(hrr60.drop, 0)} bpm in 60 s`,
          `Drop from the ${fixed(workout.recovery.peakHr, 0)} bpm peak${Number.isFinite(workout.recovery.tauSec) ? `; recovery time-constant ~${fixed(workout.recovery.tauSec, 0)} s` : ""}. Recovery above 12 bpm in the first minute is the commonly cited favorable threshold.`);
      } else {
        add("watch", `Slow HR recovery: -${fixed(hrr60.drop, 0)} bpm in 60 s`,
          "Below the commonly cited 12 bpm first-minute threshold. Verify the peak was a true effort end, then repeat under similar conditions; persistently slow recovery merits professional attention.");
      }
    }
    if ((workout.spikeDropFlags?.length ?? 0) > 0) {
      add("watch", `${workout.spikeDropFlags.length} unexplained HR jump${workout.spikeDropFlags.length === 1 ? "" : "s"}`,
        "Changes of 20+ bpm in ~30 s outside detected intervals. Inspect these times in the ECG explorer: sudden jumps can be sensor movement, but abrupt sustained shifts deserve review.",
        workout.spikeDropFlags[0]?.timeSec ?? null);
    }
    if (Number.isFinite(workout.trimp?.score) && workout.trimp.score > 0) {
      add("info", `Training load: TRIMP ${fixed(workout.trimp.score, 0)}, Edwards ${fixed(workout.loadScore, 0)}`,
        `Internal load from ${fixed(workout.hr?.avg, 0)} bpm average and time in zones. Compare against your own recent sessions rather than another athlete's numbers.`);
    }
  }

  findings.sort((left, right) => (SEVERITY_ORDER[left.severity] ?? 4) - (SEVERITY_ORDER[right.severity] ?? 4));
  return findings.slice(0, 8);
}

export function buildReportHighlights(report, selectedMode) {
  const normalized = normalizeReportForRendering(report);
  const u = normalized.universal;
  const workout = normalized.workout;
  const rest = normalized.rest;
  const rhythm = normalized.rhythm;
  const mode = selectedMode === "auto" || !selectedMode
    ? normalized.classification.inferredMode
    : selectedMode;
  const workoutMode = mode === "workout" || mode === "mixed";
  const candidateCount = countRhythmCandidates(rhythm);
  const intervalTest = workout.intervalTest;

  let response;
  if (workoutMode && intervalTest?.enabled) {
    const ramp = intervalTest.statistics?.rampRateBpmPerMin?.mean;
    const recovery = intervalTest.statistics?.recoveryRateBpmPerMin?.mean;
    response = {
      label: "Standardized test",
      value: `${intervalTest.repetitions?.length ?? 0}/5 repeats`,
      detail: `Mean ramp ${fixed(ramp, 1)} and recovery ${fixed(recovery, 1)} bpm/min.`
    };
  } else if (workoutMode) {
    const intervalCount = workout.intervalDetection?.count ?? workout.intervals?.length ?? 0;
    const recovery60 = workout.recovery?.values?.[60]?.drop;
    response = {
      label: "Exercise response",
      value: `${fixed(workout.hr?.max)} bpm peak`,
      detail: `${intervalCount} repeated effort block${intervalCount === 1 ? "" : "s"}; ${fixed(recovery60)} bpm drop by 60 seconds after the detected peak.`
    };
  } else {
    response = {
      label: "Rest / sleep",
      value: `${fixed(rest.restingHr)} bpm resting`,
      detail: `${Number.isFinite(rest.hrvValidDurationSec) ? Math.round(rest.hrvValidDurationSec / 60) : "--"} HRV-valid minutes; lnRMSSD ${fixed(rest.hrv?.lnRMSSD, 2)}.`
    };
  }

  return [
    {
      label: "Analysis coverage",
      value: `${fixed(u.hrUsablePercentage, 1)}% HR usable`,
      detail: `${fixed(u.hrvUsablePercentage, 1)}% HRV usable; ${fixed(u.morphologyUsablePercentage, 1)}% morphology usable.`,
      tone: u.hrUsablePercentage >= 75 ? "good" : "warn",
      progress: u.hrUsablePercentage
    },
    response,
    {
      label: "Rhythm review",
      value: `${candidateCount} candidate${candidateCount === 1 ? "" : "s"}`,
      detail: `${fixed(rhythm.candidateBurdenPer1000, 2)} per 1,000 usable beats; ${String(rhythm.reviewPriority).toLowerCase()} review priority.`,
      tone: candidateCount ? "warn" : "good"
    },
    {
      label: "Recording integrity",
      value: `${u.gapCount ?? 0} gap${u.gapCount === 1 ? "" : "s"}`,
      detail: `${Number.isFinite(u.totalSamples) ? u.totalSamples.toLocaleString() : "--"} samples across ${Number.isFinite(u.durationSec) ? Math.round(u.durationSec / 60) : "--"} minutes.`,
      tone: u.gapCount ? "warn" : "good"
    }
  ];
}
