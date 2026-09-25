const HR_BIN_SEC = 5;
const EFFORT_SEC = 60;
const REPETITION_COUNT = 5;
const DEFAULT_FIRST_INTERVAL_START_SEC = 12 * 60;
const DEFAULT_BASELINE_TOLERANCE_BPM = 5;
const DEFAULT_BASELINE_HOLD_SEC = 30;
const DEFAULT_MAXIMUM_RECOVERY_SEC = 10 * 60;
const BASELINE_WINDOW_SEC = 60;
const PRE_INTERVAL_WINDOW_SEC = 30;
const MIN_POINT_QUALITY_PCT = 45;

const STATISTIC_FIELDS = [
  "preHr",
  "hr30",
  "endHr",
  "riseBpm",
  "rampRateBpmPerMin",
  "initialRampRateBpmPerMin",
  "peakHr",
  "timeToPeakSec",
  "hrr30",
  "hrr60",
  "hrr120",
  "hrr240",
  "recoveryRateBpmPerMin",
  "recoveryPercent60",
  "returnToBaselineSec",
  "effortQualityPct",
  "recoveryQualityPct",
  "effortRhythmCandidateCount",
  "recoveryRhythmCandidateCount"
];

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function finiteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function configuredNumber(value, fallback, minimum, maximum) {
  const numeric = finiteNumber(value);
  return numeric === null ? fallback : clamp(numeric, minimum, maximum);
}

function buildProtocol(profileInfo = {}) {
  const recordingType = String(profileInfo.recordingType ?? "").trim().toLowerCase();
  const enabled = recordingType === "interval-test" || profileInfo.protocol?.enabled === true;

  return {
    enabled,
    type: "dynamic-interval",
    effortSec: EFFORT_SEC,
    baselineWindowSec: BASELINE_WINDOW_SEC,
    baselineToleranceBpm: DEFAULT_BASELINE_TOLERANCE_BPM,
    baselineHoldSec: DEFAULT_BASELINE_HOLD_SEC,
    maximumRecoverySec: DEFAULT_MAXIMUM_RECOVERY_SEC,
    hrBinSec: HR_BIN_SEC
  };
}

function normalizeQualityValue(entry) {
  if (entry?.valid === false || entry?.usable === false || entry?.hrUsable === false) return 0;
  const raw = entry?.qualityPct
    ?? entry?.qualityPercentage
    ?? entry?.usablePct
    ?? entry?.cleanCoverage
    ?? entry?.score
    ?? entry?.quality
    ?? entry?.value;

  if (typeof raw === "boolean") return raw ? 100 : 0;
  if (typeof raw === "string") {
    const label = raw.trim().toLowerCase();
    if (["good", "high", "clean", "usable", "green"].includes(label)) return 100;
    if (["fair", "moderate", "yellow"].includes(label)) return 60;
    if (["poor", "low", "bad", "unusable", "gray", "grey", "red"].includes(label)) return 0;
  }
  const numeric = finiteNumber(raw);
  if (numeric === null) return entry?.valid === true || entry?.usable === true ? 100 : 100;
  return clamp(numeric >= 0 && numeric <= 1 ? numeric * 100 : numeric, 0, 100);
}

function absoluteTimeToSec(value, minTime) {
  const numeric = finiteNumber(value);
  if (numeric === null || !Number.isFinite(minTime)) return null;
  return (numeric - minTime) / 1e9;
}

function normalizeQualityTimeline(qualityTimeline, minTime) {
  if (!Array.isArray(qualityTimeline)) return [];
  return qualityTimeline.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const pointSec = finiteNumber(entry.timeSec)
      ?? absoluteTimeToSec(entry.time, minTime);
    let startSec = finiteNumber(entry.startSec)
      ?? absoluteTimeToSec(entry.startTime, minTime);
    let endSec = finiteNumber(entry.endSec)
      ?? absoluteTimeToSec(entry.endTime, minTime);
    const durationSec = configuredNumber(entry.durationSec, HR_BIN_SEC, 0, 60 * 60);

    if (startSec === null && pointSec !== null) startSec = pointSec - durationSec / 2;
    if (endSec === null && startSec !== null) endSec = startSec + durationSec;
    if (startSec === null || endSec === null || endSec <= startSec) return [];
    return [{
      startSec,
      endSec,
      qualityPct: normalizeQualityValue(entry)
    }];
  }).sort((a, b) => a.startSec - b.startSec || a.endSec - b.endSec);
}

function qualityForBin(entries, startSec, endSec, cursor) {
  while (cursor.index < entries.length && entries[cursor.index].endSec <= startSec) {
    cursor.index++;
  }
  let weightedQuality = 0;
  let overlapDuration = 0;
  for (let index = cursor.index; index < entries.length; index++) {
    const entry = entries[index];
    if (entry.startSec >= endSec) break;
    const overlap = Math.max(0, Math.min(endSec, entry.endSec) - Math.max(startSec, entry.startSec));
    if (!overlap) continue;
    weightedQuality += entry.qualityPct * overlap;
    overlapDuration += overlap;
  }
  return overlapDuration ? weightedQuality / overlapDuration : 100;
}

function buildFiveSecondHrPoints(cleanRrs, minTime, durationSec, qualityTimeline) {
  const normalizedQuality = normalizeQualityTimeline(qualityTimeline, minTime);
  const samples = (Array.isArray(cleanRrs) ? cleanRrs : []).flatMap((rr) => {
    const rrMs = finiteNumber(rr?.val ?? rr?.rrMs ?? rr?.rr);
    if (rrMs === null || rrMs < 250 || rrMs > 2500) return [];
    const relativeTimeSec = finiteNumber(rr?.timeSec)
      ?? absoluteTimeToSec(rr?.time, minTime);
    if (relativeTimeSec === null || relativeTimeSec < 0 || relativeTimeSec > durationSec) return [];
    return [{ timeSec: relativeTimeSec, hr: 60000 / rrMs }];
  }).sort((a, b) => a.timeSec - b.timeSec);

  const pointCount = Math.max(0, Math.ceil(durationSec / HR_BIN_SEC));
  const points = [];
  const qualityCursor = { index: 0 };
  let sampleIndex = 0;

  for (let index = 0; index < pointCount; index++) {
    const startSec = index * HR_BIN_SEC;
    const endSec = Math.min(durationSec, startSec + HR_BIN_SEC);
    while (sampleIndex < samples.length && samples[sampleIndex].timeSec < startSec) sampleIndex++;
    const values = [];
    let candidateIndex = sampleIndex;
    while (candidateIndex < samples.length && samples[candidateIndex].timeSec < endSec) {
      values.push(samples[candidateIndex].hr);
      candidateIndex++;
    }
    sampleIndex = candidateIndex;
    const hr = median(values);
    const sourceQualityPct = qualityForBin(normalizedQuality, startSec, endSec, qualityCursor);
    points.push({
      startSec,
      endSec,
      timeSec: (startSec + endSec) / 2,
      hr: finiteOrNull(hr),
      qualityPct: hr === null ? 0 : sourceQualityPct,
      beatCount: values.length
    });
  }
  return points;
}

function pointsForRange(points, startSec, endSec, minimumQualityPct = MIN_POINT_QUALITY_PCT) {
  return points.filter((point) =>
    point.timeSec >= startSec
    && point.timeSec < endSec
    && Number.isFinite(point.hr)
    && point.qualityPct >= minimumQualityPct);
}

function medianHrForRange(points, startSec, endSec, minimumCoverage = 0.5) {
  if (!(endSec > startSec)) return null;
  const selected = pointsForRange(points, startSec, endSec);
  const expectedBins = Math.max(1, Math.ceil((endSec - startSec) / HR_BIN_SEC));
  if (selected.length < Math.max(1, Math.ceil(expectedBins * minimumCoverage))) return null;
  return median(selected.map((point) => point.hr));
}

function qualityPercentForRange(points, startSec, endSec) {
  if (!(endSec > startSec)) return null;
  let weightedQuality = 0;
  for (const point of points) {
    const overlap = Math.max(0, Math.min(endSec, point.endSec) - Math.max(startSec, point.startSec));
    if (!overlap) continue;
    weightedQuality += (Number.isFinite(point.hr) ? point.qualityPct : 0) * overlap;
  }
  return clamp(weightedQuality / (endSec - startSec), 0, 100);
}

function peakForRange(points, startSec, endSec) {
  const selected = pointsForRange(points, startSec, endSec);
  if (!selected.length) return { peakHr: null, timeToPeakSec: null };
  const peak = selected.reduce((best, point) => point.hr > best.hr ? point : best, selected[0]);
  return {
    peakHr: peak.hr,
    timeToPeakSec: peak.timeSec - startSec
  };
}

function findBaselineReturn(points, effortEndSec, durationSec, baselineHr, protocol) {
  if (!Number.isFinite(baselineHr)) return null;
  const limitSec = Math.min(durationSec, effortEndSec + protocol.maximumRecoverySec);
  let runStartSec = null;
  let previousEndSec = null;

  for (const point of points) {
    if (point.startSec + 1e-6 < effortEndSec) continue;
    if (point.endSec > limitSec + 1e-6) break;
    const consecutive = previousEndSec === null || Math.abs(point.startSec - previousEndSec) < 1e-6;
    const withinBaseline = Number.isFinite(point.hr)
      && point.qualityPct >= MIN_POINT_QUALITY_PCT
      && Math.abs(point.hr - baselineHr) <= protocol.baselineToleranceBpm;

    if (!withinBaseline || !consecutive) {
      runStartSec = withinBaseline ? point.startSec : null;
    } else if (runStartSec === null) {
      runStartSec = point.startSec;
    }
    previousEndSec = withinBaseline ? point.endSec : null;

    if (withinBaseline && point.endSec - runStartSec >= protocol.baselineHoldSec - 1e-6) {
      return {
        returnStartSec: runStartSec,
        confirmedAtSec: point.endSec,
        returnToBaselineSec: Math.max(0, runStartSec - effortEndSec)
      };
    }
  }
  return null;
}

function normalizedEventRange(event, minTime) {
  const startSec = finiteNumber(event?.timeSec)
    ?? finiteNumber(event?.startSec)
    ?? absoluteTimeToSec(event?.time, minTime)
    ?? absoluteTimeToSec(event?.startTime, minTime);
  if (startSec === null) return null;
  const endSec = finiteNumber(event?.endSec)
    ?? absoluteTimeToSec(event?.endTime, minTime)
    ?? startSec;
  return { startSec, endSec: Math.max(startSec, endSec) };
}

function isRhythmCandidate(event) {
  const type = String(event?.type ?? "").trim().toLowerCase();
  return !["artifact", "sensor", "sensor-issue", "contact", "contact-loss", "gap", "noise", "quality"].includes(type);
}

function countRhythmCandidates(events, startSec, endSec, minTime) {
  if (!(endSec > startSec)) return 0;
  return (Array.isArray(events) ? events : []).reduce((count, event) => {
    if (!isRhythmCandidate(event)) return count;
    const range = normalizedEventRange(event, minTime);
    if (!range) return count;
    const overlaps = range.endSec === range.startSec
      ? range.startSec >= startSec && range.startSec < endSec
      : range.endSec > startSec && range.startSec < endSec;
    return count + (overlaps ? 1 : 0);
  }, 0);
}

function recoveryDropAt(points, effortEndSec, offsetSec, recoveryMetricEndSec, endHr) {
  if (!Number.isFinite(endHr)) return null;
  const windowEndSec = effortEndSec + offsetSec;
  const windowStartSec = windowEndSec - HR_BIN_SEC * 2;
  if (windowStartSec < effortEndSec || windowEndSec > recoveryMetricEndSec + 1e-6) return null;
  const recoveryHr = medianHrForRange(points, windowStartSec, windowEndSec);
  return Number.isFinite(recoveryHr) ? endHr - recoveryHr : null;
}

function buildRelativeTrace(points, intervalStartSec, traceEndSec) {
  const traceStartSec = intervalStartSec - PRE_INTERVAL_WINDOW_SEC;
  const cappedEndSec = Math.min(traceEndSec, intervalStartSec + 300);
  return points
    .filter((point) => point.timeSec >= traceStartSec && point.timeSec <= cappedEndSec)
    .map((point) => ({
      timeSec: point.timeSec - intervalStartSec,
      hr: finiteOrNull(point.hr),
      quality: Number.isFinite(point.hr) ? point.qualityPct : 0
    }));
}

function summarize(values) {
  const finiteValues = values.filter(Number.isFinite);
  const count = finiteValues.length;
  if (!count) {
    return {
      count: 0,
      mean: null,
      median: null,
      sd: null,
      cv: null,
      min: null,
      max: null,
      first: null,
      last: null,
      firstToLastChange: null,
      firstToLastPercent: null
    };
  }
  const meanValue = finiteValues.reduce((sum, value) => sum + value, 0) / count;
  const sd = count >= 2
    ? Math.sqrt(finiteValues.reduce((sum, value) => sum + (value - meanValue) ** 2, 0) / (count - 1))
    : null;
  const first = finiteValues[0];
  const last = finiteValues[finiteValues.length - 1];
  return {
    count,
    mean: meanValue,
    median: median(finiteValues),
    sd,
    cv: Number.isFinite(sd) && Math.abs(meanValue) > 1e-9 ? sd / Math.abs(meanValue) * 100 : null,
    min: Math.min(...finiteValues),
    max: Math.max(...finiteValues),
    first,
    last,
    firstToLastChange: count >= 2 ? last - first : null,
    firstToLastPercent: count >= 2 && Math.abs(first) > 1e-9
      ? (last - first) / Math.abs(first) * 100
      : null
  };
}

function buildStatistics(repetitions) {
  return Object.fromEntries(STATISTIC_FIELDS.map((field) => [
    field,
    summarize(repetitions.map((repetition) => repetition.valid ? repetition[field] : null))
  ]));
}

function buildFirstToLastDrift(repetitions) {
  return Object.fromEntries(STATISTIC_FIELDS.map((field) => {
    const values = repetitions
      .map((repetition) => repetition.valid ? repetition[field] : null)
      .filter(Number.isFinite);
    if (values.length < 2) return [field, null];
    const first = values[0];
    const last = values[values.length - 1];
    return [field, {
      first,
      last,
      absolute: last - first,
      percent: Math.abs(first) > 1e-9 ? (last - first) / Math.abs(first) * 100 : null
    }];
  }));
}

function disabledResult(protocol) {
  const summary = "Select the interval-test recording type to analyze this standardized protocol.";
  return {
    enabled: false,
    protocol,
    status: "not-enabled",
    stopReason: "The standardized interval test was not selected for this recording.",
    baseline: { hr: null, source: "unavailable", startSec: null, endSec: null, qualityPct: null },
    hrPoints: [],
    repetitions: [],
    statistics: buildStatistics([]),
    firstToLastDrift: buildFirstToLastDrift([]),
    incompleteRecoveryCount: 0,
    summary,
    message: summary,
    summaryDetails: {
      title: "5 x 1-minute interval test",
      text: summary,
      instruction: "Record one continuous ECG file containing all five efforts and every recovery."
    }
  };
}

function summaryText(status, repetitions, validCount, protocol) {
  if (status === "insufficient-baseline") {
    return "A clean pre-test baseline was unavailable, so baseline-gated repetitions could not be completed.";
  }
  if (status === "insufficient-recording") {
    return `${repetitions.length} of ${protocol.repetitions} complete one-minute effort windows were available in the recording.`;
  }
  if (status === "incomplete-recovery") {
    return `${repetitions.length} effort window(s) were analyzed; segmentation stopped when heart rate did not remain within the baseline tolerance during the allowed recovery.`;
  }
  if (status === "complete-with-limited-data") {
    return `All ${protocol.repetitions} effort windows were segmented, with ${validCount} containing enough clean ECG-derived HR data for the core response metrics.`;
  }
  return `All ${protocol.repetitions} one-minute effort windows and their baseline-gated recoveries were analyzed.`;
}

/**
 * Analyze a standardized five-by-one-minute ECG-only interval test.
 * The upload is analyzed after the exercise, so the baseline gate validates the
 * recorded protocol; it cannot tell the athlete when to start in real time.
 */
function detectIntervals(points) {
  const validPeaks = [];
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (!Number.isFinite(point.hr)) continue;
    
    let isPeak = true;
    for (let j = Math.max(0, i - 12); j <= Math.min(points.length - 1, i + 12); j++) {
      if (i !== j && Number.isFinite(points[j].hr) && points[j].hr > point.hr) {
        isPeak = false;
        break;
      }
    }
    
    if (isPeak) {
      if (validPeaks.length === 0 || point.timeSec - validPeaks[validPeaks.length - 1].timeSec > 90) {
         validPeaks.push(point);
      } else if (point.hr > validPeaks[validPeaks.length - 1].hr) {
         validPeaks[validPeaks.length - 1] = point;
      }
    }
  }
  
  const intervals = [];
  for (const peak of validPeaks) {
     const prePeakPoints = points.filter(p => p.timeSec >= peak.timeSec - 90 && p.timeSec < peak.timeSec);
     const minHr = prePeakPoints.length ? Math.min(...prePeakPoints.map(p => p.hr).filter(Number.isFinite)) : peak.hr;
     
     if (peak.hr - minHr >= 15) { 
       intervals.push({ startSec: Math.max(0, peak.timeSec - 60), endSec: peak.timeSec });
     }
  }
  return intervals;
}

export function buildIntervalTestMetrics({
  cleanRrs,
  minTime,
  durationSec,
  qualityTimeline = [],
  rhythmEvents = [],
  profileInfo = {}
} = {}) {
  const protocol = buildProtocol(profileInfo);
  if (!protocol.enabled) return disabledResult(protocol);

  const recordingDurationSec = Math.max(0, finiteNumber(durationSec) ?? 0);
  const hrPoints = buildFiveSecondHrPoints(
    cleanRrs,
    finiteNumber(minTime),
    recordingDurationSec,
    qualityTimeline
  );
  
  const rawIntervals = detectIntervals(hrPoints);
  
  if (rawIntervals.length < 3) {
      return {
          enabled: true,
          protocol,
          status: "insufficient-recording",
          stopReason: "Fewer than 3 efforts detected.",
          message: "Could not detect at least 3 one-minute efforts in the recording.",
          summary: `Only ${rawIntervals.length} efforts detected. The dynamic interval test requires at least 3 efforts.`,
          baselineHr: null,
          repetitions: [],
          statistics: buildStatistics([]),
          firstToLastDrift: buildFirstToLastDrift([]),
          incompleteRecoveryCount: 0,
          summaryDetails: {
              title: "Dynamic Interval Test",
              text: `Detected ${rawIntervals.length} intervals.`,
              instruction: "Dynamic detection requires at least 3 efforts.",
              baselineHr: null,
              segmentedRepetitions: rawIntervals.length,
              validRepetitions: 0,
              requestedRepetitions: 3,
              completeRecoveries: 0,
              incompleteRecoveries: 0,
              missingRepetitions: 3 - rawIntervals.length
          }
      };
  }

  const baselineStartSec = Math.max(0, rawIntervals[0].startSec - protocol.baselineWindowSec);
  const baselineEndSec = rawIntervals[0].startSec;
  const measuredBaselineHr = medianHrForRange(hrPoints, baselineStartSec, baselineEndSec);
  const baselineHr = measuredBaselineHr;
  const baseline = {
    hr: finiteOrNull(baselineHr),
    source: measuredBaselineHr !== null ? "recording-final-60-seconds" : "unavailable",
    startSec: baselineStartSec,
    endSec: baselineEndSec,
    qualityPct: qualityPercentForRange(hrPoints, baselineStartSec, baselineEndSec)
  };

  const repetitions = [];
  let stopReason = null;

  for (let index = 0; index < rawIntervals.length; index++) {
    const effortStartSec = rawIntervals[index].startSec;
    const effortEndSec = rawIntervals[index].endSec;

    const preHr = medianHrForRange(
      hrPoints,
      effortStartSec - PRE_INTERVAL_WINDOW_SEC,
      effortStartSec
    );
    const hr30 = medianHrForRange(hrPoints, effortStartSec + 25, effortStartSec + 35);
    const endHr = medianHrForRange(hrPoints, effortEndSec - 10, effortEndSec);
    const riseBpm = Number.isFinite(preHr) && Number.isFinite(endHr) ? endHr - preHr : null;
    const rampRateBpmPerMin = Number.isFinite(riseBpm)
      ? riseBpm / (protocol.effortSec / 60)
      : null;
    const initialRampRateBpmPerMin = Number.isFinite(preHr) && Number.isFinite(hr30)
      ? (hr30 - preHr) / 0.5
      : null;
    const peak = peakForRange(hrPoints, effortStartSec, effortEndSec);
    const baselineReturn = findBaselineReturn(
      hrPoints,
      effortEndSec,
      recordingDurationSec,
      baselineHr ?? 100, // Safe fallback
      protocol
    );
    const willStartAnotherRepetition = index < rawIntervals.length - 1;
    const recoverySearchEndSec = baselineReturn?.confirmedAtSec
      ?? Math.min(recordingDurationSec, effortEndSec + protocol.maximumRecoverySec);
    const recoveryMetricEndSec = willStartAnotherRepetition
      ? rawIntervals[index+1].startSec
      : Math.min(recordingDurationSec, effortEndSec + protocol.maximumRecoverySec);
      
    const hrr30 = recoveryDropAt(hrPoints, effortEndSec, 30, recoveryMetricEndSec, endHr);
    const hrr60 = recoveryDropAt(hrPoints, effortEndSec, 60, recoveryMetricEndSec, endHr);
    const hrr120 = recoveryDropAt(hrPoints, effortEndSec, 120, recoveryMetricEndSec, endHr);
    const hrr240 = recoveryDropAt(hrPoints, effortEndSec, 240, recoveryMetricEndSec, endHr);
    const recoveryRateBpmPerMin = finiteOrNull(hrr60);
    const recoveryPercent60 = Number.isFinite(hrr60) && Number.isFinite(riseBpm) && riseBpm > 1
      ? hrr60 / riseBpm * 100
      : null;
    const recoveryQualityEndSec = Math.min(recoveryMetricEndSec, effortEndSec + 60);
    const effortQualityPct = qualityPercentForRange(hrPoints, effortStartSec, effortEndSec);
    const recoveryQualityPct = recoveryQualityEndSec > effortEndSec
      ? qualityPercentForRange(hrPoints, effortEndSec, recoveryQualityEndSec)
      : null;
    const effortRhythmCandidateCount = countRhythmCandidates(
      rhythmEvents,
      effortStartSec,
      effortEndSec,
      minTime
    );
    const recoveryRhythmCandidateCount = countRhythmCandidates(
      rhythmEvents,
      effortEndSec,
      recoverySearchEndSec,
      minTime
    );
    const traceEndSec = willStartAnotherRepetition ? rawIntervals[index+1].startSec : Math.min(recordingDurationSec, effortEndSec + protocol.maximumRecoverySec);
    const valid = [preHr, hr30, endHr, riseBpm, rampRateBpmPerMin].every(Number.isFinite)
      && Number.isFinite(effortQualityPct)
      && effortQualityPct >= MIN_POINT_QUALITY_PCT;

    repetitions.push({
      index: index + 1,
      startSec: effortStartSec,
      endSec: effortEndSec,
      valid,
      durationSec: protocol.effortSec,
      traceEndSec,
      preHr: finiteOrNull(preHr),
      hr30: finiteOrNull(hr30),
      endHr: finiteOrNull(endHr),
      riseBpm: finiteOrNull(riseBpm),
      rampRateBpmPerMin: finiteOrNull(rampRateBpmPerMin),
      initialRampRateBpmPerMin: finiteOrNull(initialRampRateBpmPerMin),
      peakHr: finiteOrNull(peak?.peakHr),
      timeToPeakSec: finiteOrNull(peak?.timeToPeakSec),
      hrr30: finiteOrNull(hrr30),
      hrr60: finiteOrNull(hrr60),
      hrr120: finiteOrNull(hrr120),
      hrr240: finiteOrNull(hrr240),
      recoveryRateBpmPerMin: finiteOrNull(recoveryRateBpmPerMin),
      recoveryPercent60: finiteOrNull(recoveryPercent60),
      returnToBaselineSec: finiteOrNull(baselineReturn?.returnToBaselineSec),
      recoveryComplete: Boolean(baselineReturn),
      baselineReturn: {
        returned: baselineReturn !== null,
        returnTimeSec: finiteOrNull(baselineReturn?.returnToBaselineSec),
        confirmedAtSec: finiteOrNull(baselineReturn?.confirmedAtSec)
      },
      effortQualityPct: finiteOrNull(effortQualityPct),
      recoveryQualityPct: finiteOrNull(recoveryQualityPct),
      effortRhythmCandidateCount,
      recoveryRhythmCandidateCount,
      rhythmCandidateCounts: {
        effort: effortRhythmCandidateCount,
        recovery: recoveryRhythmCandidateCount
      },
      trace: buildRelativeTrace(hrPoints, effortStartSec, traceEndSec)
    });
  }

  const incompleteRecoveryCount = repetitions.filter((repetition) => !repetition.recoveryComplete).length;
  const validCount = repetitions.filter((repetition) => repetition.valid).length;
  const status = "complete";
  const summary = `Detected and analyzed ${repetitions.length} one-minute effort windows automatically.`;
  const instruction = `The protocol dynamically inferred ${repetitions.length} efforts.`;

  return {
    enabled: true,
    protocol,
    status,
    stopReason,
    message: summary,
    summary,
    baseline,
    baselineHr: finiteOrNull(baselineHr),
    hrPoints: hrPoints.map((point) => ({
      timeSec: point.timeSec,
      hr: finiteOrNull(point.hr),
      quality: Number.isFinite(point.hr) ? point.qualityPct : 0
    })),
    repetitions,
    statistics: buildStatistics(repetitions),
    firstToLastDrift: buildFirstToLastDrift(repetitions),
    incompleteRecoveryCount,
    summaryDetails: {
      title: "Dynamic Interval Test",
      text: summary,
      instruction,
      baselineHr: finiteOrNull(baselineHr),
      segmentedRepetitions: repetitions.length,
      validRepetitions: validCount,
      requestedRepetitions: repetitions.length,
      completeRecoveries: repetitions.length - incompleteRecoveryCount,
      incompleteRecoveries: incompleteRecoveryCount,
      missingRepetitions: 0
    }
  };
}
