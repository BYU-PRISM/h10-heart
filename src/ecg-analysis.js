import { estimateRespiration, summarizeRespiration } from "./respiration.js";
import { parseEcgCsvFiles } from "./ecg-ingestion.js";
import { buildSignalQualityTimeline, qualitySegmentAt } from "./signal-quality.js";
import { buildIntervalTestMetrics } from "./interval-test.js";
import { computeFrequencyDomain, computeNonlinear, computeTimeDomainExtras } from "./hrv-metrics.js";

const FIVE_MINUTES = 300;
const MODE_VALUES = ["auto", "sleep", "rest", "workout", "mixed"];

function clamp(value, lo, hi) {
  return Math.max(lo, Math.min(hi, value));
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(values, pct) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = clamp((sorted.length - 1) * pct, 0, sorted.length - 1);
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  const weight = index - lo;
  return sorted[lo] * (1 - weight) + sorted[hi] * weight;
}

function standardDeviation(values) {
  if (!values.length) return 0;
  const avg = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - avg) ** 2)));
}

function medianAbsoluteDeviation(values) {
  if (!values.length) return 0;
  const center = median(values);
  return median(values.map((value) => Math.abs(value - center)));
}

function downsample(values, target) {
  if (values.length <= target) return values.slice();
  const step = values.length / target;
  return Array.from({ length: target }, (_, index) => values[Math.floor(index * step)]);
}

function computeHistogram(values, preferredBinSize, fallbackLo, fallbackHi) {
  if (!values.length) return {};
  const loValue = percentile(values, 0.01) || fallbackLo;
  const hiValue = percentile(values, 0.99) || fallbackHi;
  const range = Math.max(1, hiValue - loValue);
  let binSize = preferredBinSize;
  if (range <= preferredBinSize * 10) binSize = Math.max(1, preferredBinSize / 2);
  if (range > preferredBinSize * 30) binSize = preferredBinSize * 2;
  const lo = Math.floor(loValue / binSize) * binSize;
  const hi = Math.ceil(hiValue / binSize) * binSize;
  const bins = {};
  for (let value = lo; value <= hi; value += binSize) bins[value] = 0;
  for (const value of values) {
    if (value < lo || value > hi) continue;
    const bin = Math.floor(value / binSize) * binSize;
    if (bins[bin] !== undefined) bins[bin]++;
  }
  return bins;
}

function computeHrv(rrValues) {
  if (rrValues.length < 3) {
    return { sdnn: 0, rmssd: 0, lnRMSSD: 0, pNN50: 0, validPairs: 0 };
  }
  const avg = mean(rrValues);
  const sdnn = Math.sqrt(mean(rrValues.map((value) => (value - avg) ** 2)));
  let squaredDiffs = 0;
  let nn50 = 0;
  let validPairs = 0;
  for (let index = 1; index < rrValues.length; index++) {
    const diff = Math.abs(rrValues[index] - rrValues[index - 1]);
    squaredDiffs += diff ** 2;
    if (diff > 50) nn50++;
    validPairs++;
  }
  const rmssd = validPairs ? Math.sqrt(squaredDiffs / validPairs) : 0;
  return {
    sdnn,
    rmssd,
    lnRMSSD: rmssd > 0 ? Math.log(rmssd) : 0,
    pNN50: validPairs ? (nn50 / validPairs) * 100 : 0,
    validPairs
  };
}

function computeLinearSlope(points) {
  if (points.length < 2) return 0;
  const avgX = mean(points.map((point) => point.timeSec));
  const avgY = mean(points.map((point) => point.value));
  let numerator = 0;
  let denominator = 0;
  for (const point of points) {
    numerator += (point.timeSec - avgX) * (point.value - avgY);
    denominator += (point.timeSec - avgX) ** 2;
  }
  return denominator ? (numerator / denominator) * 3600 : 0;
}

function aggregateTimedValues(items, minTime, durationSec, binSec = 15) {
  const binCount = Math.max(1, Math.ceil(durationSec / binSec));
  const bins = Array.from({ length: binCount }, () => []);
  for (const item of items) {
    const timeSec = (item.time - minTime) / 1e9;
    const index = Math.floor(timeSec / binSec);
    if (index >= 0 && index < bins.length) bins[index].push(item.val);
  }
  return bins.flatMap((values, index) => values.length
    ? [{ timeSec: index * binSec + binSec / 2, value: median(values), count: values.length }]
    : []);
}

function findThresholdEpisodes(points, predicate, minimumDurationSec, binSec = 15) {
  const episodes = [];
  let current = null;
  for (const point of points) {
    if (predicate(point.value)) {
      if (!current || point.timeSec - current.lastTime > binSec * 1.75) {
        if (current && current.lastTime - current.startSec + binSec >= minimumDurationSec) episodes.push(current);
        current = { startSec: point.timeSec - binSec / 2, endSec: point.timeSec + binSec / 2, lastTime: point.timeSec, peak: point.value, low: point.value };
      } else {
        current.endSec = point.timeSec + binSec / 2;
        current.lastTime = point.timeSec;
        current.peak = Math.max(current.peak, point.value);
        current.low = Math.min(current.low, point.value);
      }
    } else if (current) {
      if (current.lastTime - current.startSec + binSec >= minimumDurationSec) episodes.push(current);
      current = null;
    }
  }
  if (current && current.lastTime - current.startSec + binSec >= minimumDurationSec) episodes.push(current);
  return episodes.map(({ lastTime, ...episode }) => episode);
}

function matchPeakDetectors(primary, secondary, sampleRate) {
  if (!primary.length || !secondary.length) return 0;
  const tolerance = Math.max(1, Math.round(sampleRate * 0.1));
  let matches = 0;
  let secondaryIndex = 0;
  for (const peak of primary) {
    while (secondaryIndex < secondary.length && secondary[secondaryIndex] < peak - tolerance) secondaryIndex++;
    if (secondaryIndex < secondary.length && Math.abs(secondary[secondaryIndex] - peak) <= tolerance) matches++;
  }
  return (2 * matches / (primary.length + secondary.length)) * 100;
}

function detectRPeaksSecondary(ecgs, sampleRate) {
  if (ecgs.length < sampleRate * 2) return [];
  const baselineWindow = Math.max(3, Math.floor(sampleRate * 0.6));
  const energy = new Float64Array(ecgs.length);
  let running = 0;
  for (let index = 0; index < ecgs.length; index++) {
    running += ecgs[index];
    if (index >= baselineWindow) running -= ecgs[index - baselineWindow];
    const baseline = running / Math.min(index + 1, baselineWindow);
    const centered = ecgs[index] - baseline;
    energy[index] = centered * centered;
  }
  const sample = [];
  const sampleStep = Math.max(1, Math.floor(energy.length / 5000));
  for (let index = 0; index < energy.length; index += sampleStep) sample.push(energy[index]);
  const threshold = percentile(sample, 0.985) * 0.35;
  const refractory = Math.max(1, Math.floor(sampleRate * 0.24));
  const searchRadius = Math.max(2, Math.floor(sampleRate * 0.08));
  const peaks = [];
  let lastPeak = -refractory;
  for (let index = 1; index < energy.length - 1; index++) {
    if (energy[index] < threshold || energy[index] < energy[index - 1] || energy[index] < energy[index + 1]) continue;
    if (index - lastPeak < refractory) continue;
    let best = index;
    let bestEnergy = energy[index];
    for (let candidate = Math.max(0, index - searchRadius); candidate <= Math.min(energy.length - 1, index + searchRadius); candidate++) {
      if (energy[candidate] > bestEnergy) {
        best = candidate;
        bestEnergy = energy[candidate];
      }
    }
    peaks.push(best);
    lastPeak = best;
  }
  return peaks;
}

// ───────────────────── Signal conditioning for detection ─────────────────────
// Removes baseline wander with a centered moving-average high-pass (~0.66 s)
// and applies a light 3-point binomial smoother, then flips polarity when the
// dominant R deflection is negative (inverted strap wear). The raw signal is
// preserved for display and quality analysis; only detection uses this.
function conditionForDetection(ecgs, sampleRate) {
  const n = ecgs.length;
  const out = new Float64Array(n);
  if (!n) return out;
  const halfWindow = Math.max(2, Math.round(sampleRate * 0.33));
  const prefix = new Float64Array(n + 1);
  for (let index = 0; index < n; index++) prefix[index + 1] = prefix[index] + ecgs[index];
  for (let index = 0; index < n; index++) {
    const lo = Math.max(0, index - halfWindow);
    const hi = Math.min(n - 1, index + halfWindow);
    const baseline = (prefix[hi + 1] - prefix[lo]) / (hi - lo + 1);
    out[index] = ecgs[index] - baseline;
  }
  for (let index = 1; index < n - 1; index++) {
    out[index] = (out[index - 1] + 2 * out[index] + out[index + 1]) / 4;
  }
  // Polarity: compare robust positive vs negative excursions on a sparse sample.
  const stride = Math.max(1, Math.floor(n / 20000));
  const sampled = [];
  for (let index = 0; index < n; index += stride) sampled.push(out[index]);
  const positive = percentile(sampled, 0.999);
  const negative = -percentile(sampled, 0.001);
  if (negative > positive * 1.5) {
    for (let index = 0; index < n; index++) out[index] = -out[index];
  }
  return out;
}

// ───────────────────── Beat template + candidate verification ─────────────────────
function buildBeatTemplate(ecgs, peaks, sampleRate) {
  const half = Math.max(4, Math.round(sampleRate * 0.22));
  const length = half * 2 + 1;
  const step = Math.max(1, Math.floor(peaks.length / 240));
  const usable = [];
  for (let index = 0; index < peaks.length; index += step) {
    const peak = peaks[index];
    if (peak - half < 0 || peak + half >= ecgs.length) continue;
    usable.push(peak);
  }
  if (usable.length < 8) return null;
  const template = new Float64Array(length);
  const column = new Array(usable.length);
  for (let offset = 0; offset < length; offset++) {
    for (let beat = 0; beat < usable.length; beat++) column[beat] = ecgs[usable[beat] - half + offset];
    template[offset] = median(column);
  }
  return { template, half };
}

function correlateBeat(ecgs, peakIndex, beatTemplate) {
  if (!beatTemplate) return null;
  const { template, half } = beatTemplate;
  if (peakIndex - half < 0 || peakIndex + half >= ecgs.length) return null;
  const length = half * 2 + 1;
  let sumX = 0;
  let sumY = 0;
  for (let offset = 0; offset < length; offset++) {
    sumX += ecgs[peakIndex - half + offset];
    sumY += template[offset];
  }
  const meanX = sumX / length;
  const meanY = sumY / length;
  let covariance = 0;
  let varX = 0;
  let varY = 0;
  for (let offset = 0; offset < length; offset++) {
    const dx = ecgs[peakIndex - half + offset] - meanX;
    const dy = template[offset] - meanY;
    covariance += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  const denominator = Math.sqrt(varX * varY);
  return denominator > 0 ? covariance / denominator : null;
}

function nearestPeakIndex(peakTimes, targetNs) {
  let lo = 0;
  let hi = peakTimes.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (peakTimes[mid] < targetNs) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(peakTimes[lo - 1] - targetNs) < Math.abs(peakTimes[lo] - targetNs)) return lo - 1;
  return lo;
}

// Verifies each ectopic / pause candidate against the median beat template so
// motion artifact is separated from likely true beat-timing findings. A
// candidate is only "verified" when the neighboring beats look like clean
// normal beats (good template correlation); otherwise the local signal is the
// more likely explanation and the candidate is downgraded to artifact.
function verifyRhythmCandidates({ conditioned, ecgTimes, primaryPeaks, sampleRate, ectopicEvents, pauseEvents, minTime }) {
  const beatTemplate = buildBeatTemplate(conditioned, primaryPeaks, sampleRate);
  const peakTimes = primaryPeaks.map((peak) => ecgTimes[peak]);
  const NEIGHBOR_MIN = 0.6;
  const DISTINCT_MAX = 0.7;

  const classify = (event, isPause) => {
    if (!beatTemplate || !peakTimes.length) {
      event.classification = "unverified";
      event.morphology = "unknown";
      return event;
    }
    const targetNs = minTime + event.timeSec * 1e9;
    const at = nearestPeakIndex(peakTimes, targetNs);
    const beatCorr = correlateBeat(conditioned, primaryPeaks[at], beatTemplate);
    const prevCorr = at > 0 ? correlateBeat(conditioned, primaryPeaks[at - 1], beatTemplate) : null;
    const nextCorr = at + 1 < primaryPeaks.length ? correlateBeat(conditioned, primaryPeaks[at + 1], beatTemplate) : null;
    const neighborCorrs = [prevCorr, nextCorr].filter(Number.isFinite);
    const neighborsClean = neighborCorrs.length > 0 && neighborCorrs.every((value) => value >= NEIGHBOR_MIN);
    event.templateCorrelation = Number.isFinite(beatCorr) ? beatCorr : null;
    event.neighborCorrelation = neighborCorrs.length ? Math.min(...neighborCorrs) : null;
    if (!neighborsClean) {
      event.classification = "artifact-suspected";
      event.morphology = "unknown";
      event.confidencePct = Math.round(clamp((event.neighborCorrelation ?? 0) * 100, 0, 100));
      return event;
    }
    event.classification = "verified";
    event.confidencePct = Math.round(clamp(Math.min(...neighborCorrs) * 100, 0, 100));
    if (isPause) {
      event.morphology = "flanked-by-normal-beats";
    } else {
      event.morphology = Number.isFinite(beatCorr) && beatCorr < DISTINCT_MAX ? "distinct-qrs" : "narrow-similar";
    }
    return event;
  };

  for (const event of ectopicEvents) classify(event, false);
  for (const event of pauseEvents) classify(event, true);
  return {
    verifiedEctopicCount: ectopicEvents.filter((event) => event.classification !== "artifact-suspected").length,
    artifactEctopicCount: ectopicEvents.filter((event) => event.classification === "artifact-suspected").length,
    verifiedPauseCount: pauseEvents.filter((event) => event.classification !== "artifact-suspected").length,
    artifactPauseCount: pauseEvents.filter((event) => event.classification === "artifact-suspected").length,
    distinctQrsCount: ectopicEvents.filter((event) => event.morphology === "distinct-qrs").length,
    templateAvailable: Boolean(beatTemplate)
  };
}

function analyzeRhythm(rrs, minTime, qualityTimeline = []) {
  const cleanRrs = [];
  const ectopicEvents = [];
  const pauseEvents = [];
  const irregularBins = new Map();
  let sensorIssueCount = 0;
  let qualityExcludedBeatCount = 0;
  let suppressedCandidateCount = 0;

  for (let index = 0; index < rrs.length; index++) {
    const rr = rrs[index];
    const timeSec = (rr.time - minTime) / 1e9;
    const quality = qualitySegmentAt(qualityTimeline, timeSec);
    if (rr.signalGap || (quality && !quality.hrUsable)) {
      sensorIssueCount++;
      qualityExcludedBeatCount++;
      suppressedCandidateCount++;
      continue;
    }
    const local = rrs
      .slice(Math.max(0, index - 10), Math.min(rrs.length, index + 11))
      .filter((entry) => {
        if (entry.signalGap) return false;
        const entryQuality = qualitySegmentAt(qualityTimeline, (entry.time - minTime) / 1e9);
        return !entryQuality || entryQuality.hrUsable;
      })
      .map((entry) => entry.val)
      .filter((value) => value >= 300 && value <= 2000);
    const localMedian = median(local) || rr.val;
    const nextEntry = rrs[index + 1];
    const nextQuality = nextEntry ? qualitySegmentAt(qualityTimeline, (nextEntry.time - minTime) / 1e9) : null;
    const next = nextEntry && !nextEntry.signalGap && (!nextQuality || nextQuality.hrUsable) ? nextEntry.val : null;
    const premature = rr.val < localMedian * 0.8;
    const compensatory = Number.isFinite(next)
      && next > localMedian * 1.2
      && Math.abs((rr.val + next) - 2 * localMedian) / (2 * localMedian) <= 0.25;
    const pause = rr.val >= 2000 && rr.val >= localMedian * 1.5;
    const physiologic = rr.val >= 300 && rr.val <= 2000;
    const localDeviation = Math.abs(rr.val - localMedian) / localMedian;

    if (premature && compensatory) {
      ectopicEvents.push({ type: "ectopic", timeSec, rrMs: rr.val });
      continue;
    }
    if (pause) {
      pauseEvents.push({ type: "pause", timeSec, rrMs: rr.val });
      continue;
    }
    if (!physiologic) {
      sensorIssueCount++;
      continue;
    }
    if (localDeviation <= 0.25) cleanRrs.push(rr);
    const binStart = Math.floor(timeSec / 30) * 30;
    const bin = irregularBins.get(binStart) ?? { total: 0, irregular: 0 };
    bin.total++;
    if (localDeviation > 0.2) bin.irregular++;
    irregularBins.set(binStart, bin);
  }

  const irregularEpisodes = [];
  let run = null;
  for (const [startSec, bin] of [...irregularBins.entries()].sort((a, b) => a[0] - b[0])) {
    const irregular = bin.total >= 20 && bin.irregular / bin.total >= 0.2;
    if (irregular) {
      if (!run || startSec - run.endSec > 35) run = { type: "irregular", startSec, endSec: startSec + 30, maxIrregularFraction: bin.irregular / bin.total };
      else {
        run.endSec = startSec + 30;
        run.maxIrregularFraction = Math.max(run.maxIrregularFraction, bin.irregular / bin.total);
      }
    } else if (run) {
      irregularEpisodes.push(run);
      run = null;
    }
  }
  if (run) irregularEpisodes.push(run);

  return {
    cleanRrs,
    ectopicEvents,
    pauseEvents,
    irregularEpisodes,
    sensorIssueCount,
    qualityExcludedBeatCount,
    suppressedCandidateCount
  };
}

function computeMetricWindows(cleanRrs, allRrs, minTime, durationSec, qualityTimeline = []) {
  const windows = [];
  for (let startSec = 0; startSec < durationSec; startSec += FIVE_MINUTES) {
    const endSec = Math.min(durationSec, startSec + FIVE_MINUTES);
    const startTime = minTime + startSec * 1e9;
    const endTime = minTime + endSec * 1e9;
    const allWindow = allRrs.filter((rr) => rr.time >= startTime && rr.time < endTime);
    const cleanWindow = cleanRrs.filter((rr) => rr.time >= startTime && rr.time < endTime);
    if (allWindow.length < 5) continue;
    const hrvWindow = cleanWindow.filter((rr) => {
      const quality = qualitySegmentAt(qualityTimeline, (rr.time - minTime) / 1e9);
      return !quality || quality.hrvUsable;
    });
    const rrValues = hrvWindow.map((rr) => rr.val);
    const hrValues = cleanWindow.map((rr) => 60000 / rr.val);
    const coverage = allWindow.length ? cleanWindow.length / allWindow.length * 100 : 0;
    const hrvCoverage = allWindow.length ? hrvWindow.length / allWindow.length * 100 : 0;
    const hrv = computeHrv(rrValues);
    const hrValid = endSec - startSec >= 60 && coverage >= 70 && cleanWindow.length >= 30;
    const hrvValid = endSec - startSec >= 240 && hrvCoverage >= 80 && hrvWindow.length >= 120;
    windows.push({
      startSec,
      endSec,
      centerSec: (startSec + endSec) / 2,
      durationSec: endSec - startSec,
      avgHr: mean(hrValues),
      medianHr: median(hrValues),
      minHr: percentile(hrValues, 0.05),
      maxHr: percentile(hrValues, 0.95),
      hrStd: standardDeviation(hrValues),
      meanNN: rrValues.length ? mean(rrValues) : null,
      cleanCoverage: coverage,
      hrvCoverage,
      hrValid,
      hrvValid,
      valid: hrValid,
      ...hrv
    });
  }
  return windows;
}

function buildBeatOverlay(ecgs, rPeakIndices, sampleRate) {
  const beatSamples = [];
  const step = Math.max(1, Math.floor(rPeakIndices.length / 160));
  const halfWindow = Math.floor(sampleRate * 0.3);
  const beatLength = halfWindow * 2 + 1;
  for (let index = 0; index < rPeakIndices.length; index += step) {
    const peak = rPeakIndices[index];
    if (peak - halfWindow < 0 || peak + halfWindow >= ecgs.length) continue;
    beatSamples.push(ecgs.slice(peak - halfWindow, peak + halfWindow + 1));
  }
  const overlay = { mean: [], upper: [], lower: [], morphologyScore: 0, sampleRate };
  if (!beatSamples.length) return overlay;
  for (let column = 0; column < beatLength; column++) {
    const values = beatSamples.map((beat) => beat[column]);
    const avg = mean(values);
    const sd = standardDeviation(values);
    overlay.mean.push(avg);
    overlay.upper.push(avg + sd);
    overlay.lower.push(avg - sd);
  }
  const meanRange = Math.max(...overlay.mean) - Math.min(...overlay.mean) || 1;
  const normalizedSpread = mean(overlay.upper.map((value, index) => Math.abs(value - overlay.mean[index]))) / meanRange;
  overlay.morphologyScore = clamp(100 - normalizedSpread * 180, 0, 100);
  return overlay;
}

function buildClassification(windows, durationSec, startTimeNs, estimatedMaxHr) {
  const validWindows = windows.filter((window) => window.valid);
  const workoutThreshold = Math.max(100, estimatedMaxHr * 0.55);
  let workoutSeconds = 0;
  let restSeconds = 0;
  for (const window of validWindows) {
    const workoutLike = window.medianHr >= workoutThreshold || window.maxHr - window.minHr >= 30;
    if (workoutLike) workoutSeconds += window.durationSec;
    else restSeconds += window.durationSec;
  }
  const classifiedSeconds = workoutSeconds + restSeconds || durationSec;
  const workoutShare = workoutSeconds / classifiedSeconds;
  const restShare = restSeconds / classifiedSeconds;
  const startHour = Number.isFinite(startTimeNs) ? new Date(startTimeNs / 1e6).getHours() : null;
  const overnightStart = startHour !== null && (startHour >= 20 || startHour <= 6);
  const overallHr = median(validWindows.map((window) => window.medianHr));

  let inferredMode = "rest";
  let confidence = 55;
  let reason = "Heart rate remained predominantly below the workout threshold.";
  if (workoutShare >= 0.2 && restShare >= 0.2) {
    inferredMode = "mixed";
    confidence = clamp(55 + Math.min(workoutShare, restShare) * 100, 55, 90);
    reason = "The recording contains substantial low-activity and workout-like segments.";
  } else if (workoutShare > 0.5) {
    inferredMode = "workout";
    confidence = clamp(60 + workoutShare * 35, 60, 96);
    reason = "Most valid windows show sustained workout-level heart rate or large ramps.";
  } else if (durationSec >= 5400 && overallHr < 90 && overnightStart) {
    inferredMode = "sleep";
    confidence = clamp(58 + restShare * 22, 58, 80);
    reason = "A long overnight recording with sustained low heart rate is sleep-like; ECG alone cannot confirm sleep.";
  } else {
    confidence = clamp(50 + restShare * 25, 50, 75);
  }

  return {
    inferredMode,
    selectedMode: inferredMode,
    override: false,
    confidence: Math.round(confidence),
    reason,
    segmentShares: {
      workout: workoutShare * 100,
      rest: restShare * 100
    },
    availableModes: MODE_VALUES
  };
}

function buildWorkoutMetrics(cleanRrs, hrPoints, windows, durationSec, estimatedMaxHr, minTime) {
  const hrValues = cleanRrs.map((rr) => 60000 / rr.val);
  const cleanHrPoints = cleanRrs.map((rr) => ({ timeSec: (rr.time - minTime) / 1e9, value: 60000 / rr.val }));
  const stats = {
    avg: mean(hrValues),
    median: median(hrValues),
    min: percentile(hrValues, 0.01),
    max: percentile(hrValues, 0.99),
    percentiles: {
      p5: percentile(hrValues, 0.05),
      p25: percentile(hrValues, 0.25),
      p50: percentile(hrValues, 0.5),
      p75: percentile(hrValues, 0.75),
      p95: percentile(hrValues, 0.95)
    }
  };
  const trendBpmPerHour = computeLinearSlope(hrPoints);
  let rampBpmPerMinute = 0;
  for (let index = 0; index < hrPoints.length; index++) {
    let later = index + 1;
    while (later < hrPoints.length && hrPoints[later].timeSec - hrPoints[index].timeSec < 60) later++;
    if (later < hrPoints.length) {
      const elapsed = hrPoints[later].timeSec - hrPoints[index].timeSec;
      const ramp = (hrPoints[later].value - hrPoints[index].value) / elapsed * 60;
      rampBpmPerMinute = Math.max(rampBpmPerMinute, ramp);
    }
  }

  const zoneTimes = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };
  for (const rr of cleanRrs) {
    const hr = 60000 / rr.val;
    const ratio = hr / estimatedMaxHr;
    const duration = rr.val / 1000;
    if (ratio < 0.6) zoneTimes.z1 += duration;
    else if (ratio < 0.7) zoneTimes.z2 += duration;
    else if (ratio < 0.8) zoneTimes.z3 += duration;
    else if (ratio < 0.9) zoneTimes.z4 += duration;
    else zoneTimes.z5 += duration;
  }
  const zoneArray = Object.entries(zoneTimes).map(([key, seconds], index) => ({
    key,
    label: `Zone ${index + 1}`,
    seconds,
    minutes: seconds / 60,
    weight: index + 1
  }));
  const loadScore = zoneArray.reduce((sum, zone) => sum + zone.minutes * zone.weight, 0);

  const peakPoint = hrPoints.reduce((best, point) => !best || point.value > best.value ? point : best, null);
  const recovery = { peakHr: peakPoint?.value ?? 0, peakTimeSec: peakPoint?.timeSec ?? 0, values: {}, available: false, tauSec: null };
  if (peakPoint) {
    for (const seconds of [30, 60, 120]) {
      const candidates = hrPoints.filter((point) => Math.abs(point.timeSec - (peakPoint.timeSec + seconds)) <= 15);
      const target = candidates.length ? mean(candidates.map((point) => point.value)) : null;
      recovery.values[seconds] = Number.isFinite(target) ? {
        hr: target,
        drop: peakPoint.value - target,
        available: peakPoint.timeSec + seconds <= durationSec
      } : { hr: null, drop: null, available: false };
    }
    recovery.available = Object.values(recovery.values).some((value) => value.available);

    // Mono-exponential recovery time constant from the 5 minutes after the peak.
    const tail = hrPoints.filter((point) => point.timeSec >= peakPoint.timeSec && point.timeSec <= peakPoint.timeSec + 300);
    if (tail.length >= 6) {
      const plateau = Math.min(...tail.map((point) => point.value)) - 1;
      const fitPoints = tail
        .map((point) => ({ x: point.timeSec - peakPoint.timeSec, y: point.value - plateau }))
        .filter((point) => point.y > 0.5);
      if (fitPoints.length >= 6 && peakPoint.value - plateau >= 10) {
        const xs = fitPoints.map((point) => point.x);
        const ys = fitPoints.map((point) => Math.log(point.y));
        const meanX = mean(xs);
        const meanY = mean(ys);
        let numerator = 0;
        let denominator = 0;
        for (let index = 0; index < xs.length; index++) {
          numerator += (xs[index] - meanX) * (ys[index] - meanY);
          denominator += (xs[index] - meanX) ** 2;
        }
        const slope = denominator ? numerator / denominator : 0;
        if (slope < -1e-4) recovery.tauSec = clamp(-1 / slope, 10, 600);
      }
    }
  }

  // Banister TRIMP (internal training impulse) from clean beats. The resting
  // reference is this session's robust low heart rate, capped at 80 bpm.
  const restHrReference = Math.min(80, percentile(hrValues, 0.05) || 60);
  const heartRateReserve = Math.max(1, estimatedMaxHr - restHrReference);
  let trimpScore = 0;
  for (const rr of cleanRrs) {
    const hr = 60000 / rr.val;
    const fraction = clamp((hr - restHrReference) / heartRateReserve, 0, 1);
    trimpScore += (rr.val / 60000) * fraction * 0.64 * Math.exp(1.92 * fraction);
  }

  const effortThreshold = Math.max(estimatedMaxHr * 0.75, percentile(hrPoints.map((point) => point.value), 0.7));
  const rawEfforts = findThresholdEpisodes(hrPoints, (value) => value >= effortThreshold, 60, 15);
  const intervals = rawEfforts.map((effort, index) => {
    const effortPoints = hrPoints.filter((point) => point.timeSec >= effort.startSec && point.timeSec <= effort.endSec);
    const nextStart = rawEfforts[index + 1]?.startSec ?? Math.min(durationSec, effort.endSec + 120);
    const recoveryPoints = hrPoints.filter((point) => point.timeSec > effort.endSec && point.timeSec <= nextStart);
    const peakHr = Math.max(...effortPoints.map((point) => point.value), 0);
    const recoveryLow = recoveryPoints.length ? Math.min(...recoveryPoints.map((point) => point.value)) : null;
    return {
      index: index + 1,
      startSec: effort.startSec,
      endSec: effort.endSec,
      durationSec: effort.endSec - effort.startSec,
      peakHr,
      recoveryDrop: Number.isFinite(recoveryLow) ? peakHr - recoveryLow : null
    };
  });
  const intervalApplicable = intervals.length >= 2;

  const driftEligible = durationSec >= 1800 && !intervalApplicable && hrPoints.length >= 12;
  let driftValuePct = null;
  if (driftEligible) {
    const analysisPoints = hrPoints.filter((point) => point.timeSec >= Math.min(600, durationSec * 0.15));
    const third = Math.max(1, Math.floor(analysisPoints.length / 3));
    const early = mean(analysisPoints.slice(0, third).map((point) => point.value));
    const late = mean(analysisPoints.slice(-third).map((point) => point.value));
    driftValuePct = early ? (late - early) / early * 100 : null;
  }

  const spikeDropFlags = [];
  for (let index = 0; index < hrPoints.length; index++) {
    const later = hrPoints.find((point) => point.timeSec >= hrPoints[index].timeSec + 30);
    if (!later || later.timeSec - hrPoints[index].timeSec > 45) continue;
    const change = later.value - hrPoints[index].value;
    const intervalTransition = intervals.some((interval) =>
      Math.abs(interval.startSec - hrPoints[index].timeSec) <= 45 || Math.abs(interval.endSec - hrPoints[index].timeSec) <= 45);
    if (Math.abs(change) >= 20 && !intervalTransition) {
      spikeDropFlags.push({
        type: change > 0 ? "spike" : "drop",
        timeSec: hrPoints[index].timeSec,
        changeBpm: change
      });
    }
  }

  return {
    hr: stats,
    trendBpmPerHour,
    rampBpmPerMinute,
    peakTiming: peakPoint ? { timeSec: peakPoint.timeSec, percentIntoRecording: peakPoint.timeSec / durationSec * 100, hr: peakPoint.value } : null,
    zoneTimes,
    zones: zoneArray,
    loadScore,
    trimp: {
      score: trimpScore,
      restHrReference,
      maxHrReference: estimatedMaxHr,
      note: "Banister TRIMP using this session's robust low HR as the resting reference."
    },
    recovery,
    intervals: intervalApplicable ? intervals : [],
    intervalDetection: {
      applicable: intervalApplicable,
      count: intervalApplicable ? intervals.length : 0,
      reason: intervalApplicable ? "Repeated sustained high-HR efforts were detected." : "Fewer than two confident effort/recovery blocks were detected."
    },
    drift: {
      eligible: driftEligible,
      valuePct: driftValuePct,
      reason: driftEligible
        ? "HR-only early-to-late comparison; constant external workload cannot be confirmed."
        : durationSec < 1800
          ? "Requires at least 30 minutes."
          : "Interval-like structure makes an HR-only drift proxy misleading."
    },
    spikeDropFlags: spikeDropFlags.slice(0, 20),
    cleanBeatCount: cleanHrPoints.length
  };
}

function buildRestMetrics(cleanRrs, hrPoints, windows, durationSec, cleanBeatPercentage, qualityTimeline = [], minTime = 0) {
  const validWindows = windows.filter((window) => window.hrValid);
  const hrvWindows = windows.filter((window) => window.hrvValid);
  const stableWindows = validWindows.filter((window) => window.hrStd <= 5 && window.cleanCoverage >= 90);
  const stableSource = stableWindows.length ? stableWindows : validWindows;
  const stableHrValues = stableSource.map((window) => window.avgHr);
  const sortedStable = [...stableHrValues].sort((a, b) => a - b);
  const lowerQuartile = sortedStable.slice(0, Math.max(1, Math.ceil(sortedStable.length / 4)));
  const restingHr = median(lowerQuartile);
  const lowest5MinHr = sortedStable.length ? sortedStable[0] : percentile(hrPoints.map((point) => point.value), 0.05);
  let lowest10MinHr = null;
  for (let index = 1; index < stableSource.length; index++) {
    const previous = stableSource[index - 1];
    const current = stableSource[index];
    if (current.startSec - previous.endSec > 5) continue;
    const combined = (previous.avgHr * previous.durationSec + current.avgHr * current.durationSec) / (previous.durationSec + current.durationSec);
    lowest10MinHr = lowest10MinHr === null ? combined : Math.min(lowest10MinHr, combined);
  }
  const baselineHr = lowest10MinHr ?? lowest5MinHr;
  const validLnRmssd = hrvWindows.map((window) => window.lnRMSSD).filter((value) => value > 0);
  const baselineLnRmssd = median(validLnRmssd);
  const lnMad = medianAbsoluteDeviation(validLnRmssd) || 0.15;
  const hrvEligibleRrs = cleanRrs.filter((rr) => {
    const quality = qualitySegmentAt(qualityTimeline, (rr.time - minTime) / 1e9);
    return !quality || quality.hrvUsable;
  });
  const hrv = computeHrv(hrvEligibleRrs.map((rr) => rr.val));
  const hrvValidDurationSec = hrvWindows.reduce((sum, window) => sum + window.durationSec, 0);
  const overallHr = mean(hrPoints.map((point) => point.value));
  const hrComponent = clamp(100 - Math.max(0, overallHr - baselineHr - 3) / 17 * 100, 0, 100);
  const hrvComponent = baselineLnRmssd
    ? clamp(70 + (hrv.lnRMSSD - baselineLnRmssd) / 0.7 * 30, 0, 100)
    : 50;
  const recoveryScore = Math.round(hrComponent * 0.45 + hrvComponent * 0.35 + cleanBeatPercentage * 0.2);
  const hrCv = overallHr ? standardDeviation(hrPoints.map((point) => point.value)) / overallHr : 1;
  const stabilityScore = Math.round(clamp(100 - hrCv * 320 - Math.abs(computeLinearSlope(hrPoints)) * 0.15, 0, 100));

  const suppressedHrvEpisodes = [];
  let suppressedStart = null;
  for (const window of hrvWindows) {
    const suppressed = window.lnRMSSD > 0 && window.lnRMSSD < baselineLnRmssd - lnMad;
    if (suppressed && suppressedStart === null) suppressedStart = window.startSec;
    if (!suppressed && suppressedStart !== null) {
      if (window.startSec - suppressedStart >= 600) suppressedHrvEpisodes.push({ startSec: suppressedStart, endSec: window.startSec });
      suppressedStart = null;
    }
  }
  if (suppressedStart !== null && durationSec - suppressedStart >= 600) suppressedHrvEpisodes.push({ startSec: suppressedStart, endSec: durationSec });

  const elevatedRestingEpisodes = findThresholdEpisodes(
    hrPoints,
    (value) => Number.isFinite(baselineHr) && value >= baselineHr + 10,
    15 * 60,
    15
  );
  const highSleepingThreshold = Math.max(100, (baselineHr || 80) + 20);
  const highSleepingEpisodes = findThresholdEpisodes(hrPoints, (value) => value >= highSleepingThreshold, 300, 15);
  const bradycardiaEpisodes = findThresholdEpisodes(hrPoints, (value) => value < 40, 30, 15);

  return {
    hr: {
      avg: mean(hrPoints.map((point) => point.value)),
      median: median(hrPoints.map((point) => point.value)),
      min: percentile(hrPoints.map((point) => point.value), 0.01),
      max: percentile(hrPoints.map((point) => point.value), 0.99)
    },
    restingHr,
    lowest5MinHr,
    lowest10MinHr,
    hrv,
    hrvValidDurationSec,
    stabilityScore,
    recoveryScore,
    baseline: {
      type: "within-recording",
      hr: baselineHr,
      lnRMSSD: baselineLnRmssd,
      note: "Derived from stable clean windows in this upload; not a cross-night baseline."
    },
    suppressedHrvEpisodes,
    suppressedHrvFlag: suppressedHrvEpisodes.length > 0,
    elevatedRestingEpisodes,
    elevatedRestingHrFlag: elevatedRestingEpisodes.length > 0,
    highSleepingEpisodes,
    highSleepingThreshold,
    bradycardiaEpisodes,
    windows: validWindows
  };
}

// ───────────────────── Sleep-specific diagnostics ─────────────────────
function buildHourlySummary(windows, durationSec, freqWindows = [], respirationWindows = []) {
  const hours = [];
  for (let hour = 0; hour * 3600 < durationSec; hour++) {
    const startSec = hour * 3600;
    const endSec = Math.min(durationSec, startSec + 3600);
    const hourWindows = windows.filter((window) => window.centerSec >= startSec && window.centerSec < endSec);
    const validWindows = hourWindows.filter((window) => window.hrValid);
    const hrvWindows = hourWindows.filter((window) => window.hrvValid && window.rmssd > 0);
    const freqHere = freqWindows.filter((window) => window.centerSec >= startSec && window.centerSec < endSec);
    const breathing = summarizeRespiration(respirationWindows.filter((w) => w.centerSec >= startSec && w.centerSec < endSec));
    hours.push({
      hour: hour + 1,
      startSec,
      endSec,
      avgHr: validWindows.length ? mean(validWindows.map((window) => window.avgHr)) : null,
      minHr: validWindows.length ? Math.min(...validWindows.map((window) => window.avgHr)) : null,
      rmssd: hrvWindows.length ? median(hrvWindows.map((window) => window.rmssd)) : null,
      lfHfRatio: freqHere.length ? median(freqHere.map((window) => window.lfHfRatio).filter(Number.isFinite)) : null,
      respirationBpm: breathing.medianBpm,
      respirationCoveragePct: breathing.coveragePct,
      cleanCoveragePct: hourWindows.length ? mean(hourWindows.map((window) => window.cleanCoverage)) : 0,
      usableWindowCount: validWindows.length,
      windowCount: hourWindows.length
    });
  }
  return hours;
}

// A cardiac-autonomic sleep-stage proxy from HR and HRV per five-minute
// window. This is not polysomnography: it groups windows into deep-like
// (low, stable HR with high vagal tone), REM-like (elevated or variable HR
// with lower HRV), light-like, and wake-like/unscored bands.
function buildSleepStageProxy(windows, restingHr, durationSec) {
  const hrvValid = windows.filter((window) => window.hrvValid && window.rmssd > 0);
  const rmssdReference = median(hrvValid.map((window) => window.rmssd)) || 0;
  const stages = windows.map((window) => {
    let stage = "unscored";
    if (window.hrValid && Number.isFinite(restingHr)) {
      const hrDelta = window.avgHr - restingHr;
      if (hrDelta >= 12 || window.cleanCoverage < 70) stage = "wake-like";
      else if (window.hrvValid && window.rmssd >= rmssdReference && hrDelta <= 3 && window.hrStd <= 3.5) stage = "deep-like";
      else if (hrDelta >= 5 || window.hrStd >= 6) stage = "rem-like";
      else stage = "light-like";
    }
    return { startSec: window.startSec, endSec: window.endSec, stage, avgHr: window.avgHr, rmssd: window.rmssd };
  });
  const minutesFor = (stage) => stages
    .filter((entry) => entry.stage === stage)
    .reduce((sum, entry) => sum + (entry.endSec - entry.startSec) / 60, 0);
  const scoredMinutes = minutesFor("deep-like") + minutesFor("light-like") + minutesFor("rem-like");
  return {
    available: durationSec >= 3600 && scoredMinutes >= 60,
    stages,
    minutes: {
      deep: minutesFor("deep-like"),
      light: minutesFor("light-like"),
      rem: minutesFor("rem-like"),
      wake: minutesFor("wake-like"),
      unscored: minutesFor("unscored")
    },
    caveat: "HR/HRV-based stage proxy from single-lead ECG; it is not polysomnography and does not measure brain activity."
  };
}

function buildNocturnalDip(windows, lowestStableHr, durationSec) {
  const firstHourWindows = windows.filter((window) => window.hrValid && window.centerSec <= 3600);
  const referenceHr = firstHourWindows.length ? median(firstHourWindows.map((window) => window.avgHr)) : null;
  if (!Number.isFinite(referenceHr) || !Number.isFinite(lowestStableHr) || durationSec < 2 * 3600) {
    return { available: false, dipPct: null, referenceHr: null, lowestStableHr: null };
  }
  return {
    available: true,
    referenceHr,
    lowestStableHr,
    dipPct: referenceHr > 0 ? (referenceHr - lowestStableHr) / referenceHr * 100 : null,
    note: "First-hour median HR versus the lowest stable HR later in the same recording."
  };
}

export function analyzeEcgData(csvFiles, profileInfo = {}, progressCallback) {
  const parsed = parseEcgCsvFiles(csvFiles, profileInfo, progressCallback);
  const ecgTimes = parsed.ecgTimes;
  const ecgs = parsed.ecgs;
  const ingestionDiagnostics = parsed.diagnostics;
  let ecgMax = -Infinity;
  let ecgMin = Infinity;
  for (const ecg of ecgs) {
    ecgMax = Math.max(ecgMax, ecg);
    ecgMin = Math.min(ecgMin, ecg);
  }

  const minTime = ecgTimes[0];
  const maxTime = ecgTimes[ecgTimes.length - 1];
  const durationSec = (maxTime - minTime) / 1e9;
  if (!Number.isFinite(durationSec) || durationSec <= 0) throw new Error("The ECG timestamps do not span a valid recording duration.");

  const deltaSample = [];
  const deltaStep = Math.max(1, Math.floor((ecgTimes.length - 1) / 20000));
  for (let index = deltaStep; index < ecgTimes.length; index += deltaStep) {
    const delta = (ecgTimes[index] - ecgTimes[index - deltaStep]) / 1e9 / deltaStep;
    if (delta > 0 && delta < 0.1) deltaSample.push(delta);
  }
  const medianSampleIntervalSec = median(deltaSample) || durationSec / Math.max(1, ecgs.length - 1);
  const sampleRate = 1 / medianSampleIntervalSec;
  const gapThreshold = medianSampleIntervalSec * 2.5;
  const gaps = [];
  let missingSamples = 0;
  let gapDurationSec = 0;
  for (let index = 1; index < ecgTimes.length; index++) {
    const delta = (ecgTimes[index] - ecgTimes[index - 1]) / 1e9;
    if (delta <= gapThreshold) continue;
    const missing = Math.max(0, Math.round(delta / medianSampleIntervalSec) - 1);
    missingSamples += missing;
    gapDurationSec += Math.max(0, delta - medianSampleIntervalSec);
    gaps.push({
      timeSec: (ecgTimes[index - 1] - minTime) / 1e9,
      durationSec: delta,
      missingSamples: missing
    });
  }

  const amplitude = ecgMax - ecgMin;
  const conditioned = conditionForDetection(ecgs, sampleRate);
  const primaryPeaks = detectRPeaks(conditioned, sampleRate);
  const secondaryPeaks = detectRPeaksSecondary(conditioned, sampleRate);
  const rPeakConfidence = matchPeakDetectors(primaryPeaks, secondaryPeaks, sampleRate);
  const signalQuality = buildSignalQualityTimeline({
    ecgs,
    ecgTimes,
    sampleRate,
    minTime,
    durationSec,
    primaryPeaks,
    secondaryPeaks
  });
  const rrs = [];
  let gapIndex = 0;
  for (let index = 1; index < primaryPeaks.length; index++) {
    const previous = primaryPeaks[index - 1];
    const current = primaryPeaks[index];
    const rrMs = (ecgTimes[current] - ecgTimes[previous]) / 1e6;
    const previousSec = (ecgTimes[previous] - minTime) / 1e9;
    const currentSec = (ecgTimes[current] - minTime) / 1e9;
    while (gapIndex < gaps.length && gaps[gapIndex].timeSec < previousSec) gapIndex++;
    const signalGap = gapIndex < gaps.length && gaps[gapIndex].timeSec >= previousSec && gaps[gapIndex].timeSec < currentSec;
    if (rrMs > 150 && rrMs < 5000) rrs.push({ time: ecgTimes[current], val: rrMs, signalGap });
  }

  const rhythmAnalysis = analyzeRhythm(rrs, minTime, signalQuality.segments);
  const candidateVerification = verifyRhythmCandidates({
    conditioned,
    ecgTimes,
    primaryPeaks,
    sampleRate,
    ectopicEvents: rhythmAnalysis.ectopicEvents,
    pauseEvents: rhythmAnalysis.pauseEvents,
    minTime
  });
  const cleanRrs = rhythmAnalysis.cleanRrs;
  const hrs = cleanRrs.map((rr) => ({ time: rr.time, val: 60000 / rr.val }));
  const hrValues = hrs.map((hr) => hr.val);
  const rrValues = cleanRrs.map((rr) => rr.val);
  const cleanBeatPercentage = rrs.length ? cleanRrs.length / rrs.length * 100 : 0;
  const artifactPercentage = 100 - cleanBeatPercentage;
  const windows = computeMetricWindows(cleanRrs, rrs, minTime, durationSec, signalQuality.segments);
  const hrPoints = aggregateTimedValues(hrs, minTime, durationSec, 15);
  const rrPoints = downsample(cleanRrs.map((rr) => ({ timeSec: (rr.time - minTime) / 1e9, value: rr.val })), 1000);
  const morphologyPeaks = primaryPeaks.filter((peak) => {
    const quality = qualitySegmentAt(signalQuality.segments, (ecgTimes[peak] - minTime) / 1e9);
    return !quality || quality.morphologyUsable;
  });
  const beatOverlay = buildBeatOverlay(ecgs, morphologyPeaks, sampleRate);
  const suppliedMaxHr = Number(profileInfo.knownMaxHr);
  const estimatedMaxHr = Number.isFinite(suppliedMaxHr) && suppliedMaxHr >= 100
    ? suppliedMaxHr
    : 220 - (profileInfo.age || 30);
  const providedStartMs = Date.parse(profileInfo.recordingDateTime || "");
  const hasAbsoluteTimeline = ingestionDiagnostics.files?.some((file) => file.absoluteTimeline);
  const classificationStartNs = Number.isFinite(providedStartMs)
    ? providedStartMs * 1e6
    : hasAbsoluteTimeline ? minTime : Number.NaN;
  const classification = buildClassification(windows, durationSec, classificationStartNs, estimatedMaxHr);
  const workout = buildWorkoutMetrics(cleanRrs, hrPoints, windows, durationSec, estimatedMaxHr, minTime);
  const rest = buildRestMetrics(cleanRrs, hrPoints, windows, durationSec, cleanBeatPercentage, signalQuality.segments, minTime);

  // Extended HRV statistics (frequency-domain, nonlinear, time-domain extras)
  // and sleep-specific diagnostics computed from clean beats only.
  const nnBeats = cleanRrs.map((rr) => ({ timeSec: (rr.time - minTime) / 1e9, nnMs: rr.val }));
  const freqDomain = computeFrequencyDomain(nnBeats, windows);
  const nonlinear = computeNonlinear(rrValues);
  const timeExtras = computeTimeDomainExtras(rrValues, windows);
  const respiration = estimateRespiration({ ecgs, ecgTimes, primaryPeaks, cleanRrs,
    minTime, durationSec, sampleRate, qualityTimeline: signalQuality.segments, gaps,
    mode: profileInfo.recordingType && profileInfo.recordingType !== "auto"
      ? profileInfo.recordingType : classification.inferredMode });
  rest.hourly = buildHourlySummary(windows, durationSec, freqDomain.windows, respiration.windows);
  rest.stageProxy = buildSleepStageProxy(windows, rest.restingHr, durationSec);
  rest.nocturnalDip = buildNocturnalDip(windows, rest.lowest5MinHr, durationSec);
  rest.respirationBpm = respiration.summary.medianBpm;
  const screeningEvents = [
    ...rhythmAnalysis.ectopicEvents,
    ...rhythmAnalysis.pauseEvents,
    ...rhythmAnalysis.irregularEpisodes
  ];
  workout.intervalTest = buildIntervalTestMetrics({
    cleanRrs,
    minTime,
    durationSec,
    qualityTimeline: signalQuality.segments,
    rhythmEvents: screeningEvents,
    profileInfo
  });
  workout.maxHrReference = {
    value: estimatedMaxHr,
    source: Number.isFinite(suppliedMaxHr) && suppliedMaxHr >= 100 ? "athlete-provided" : "age-estimated"
  };

  const continuityScore = clamp(100 * (1 - missingSamples / Math.max(1, ecgs.length + missingSamples)), 0, 100);
  const detectorScore = clamp(rPeakConfidence, 0, 100);
  const morphologyScore = (beatOverlay.morphologyScore + signalQuality.morphologyUsablePercentage) / 2;
  const cleanBeatScore = clamp(cleanBeatPercentage, 0, 100);
  const qualityScore = Math.round(
    continuityScore * 0.2
    + detectorScore * 0.2
    + morphologyScore * 0.15
    + cleanBeatScore * 0.15
    + signalQuality.hrUsablePercentage * 0.3
  );
  const qualityLevel = qualityScore >= 90 ? "Excellent"
    : qualityScore >= 75 ? "Good"
      : qualityScore >= 55 ? "Fair - review signal quality"
        : "Poor - likely noise or sensor-contact issues";

  const verifiedEctopicEvents = rhythmAnalysis.ectopicEvents.filter((event) => event.classification !== "artifact-suspected");
  const verifiedPauseEvents = rhythmAnalysis.pauseEvents.filter((event) => event.classification !== "artifact-suspected");
  const ectopicBurdenPct = rrs.length ? verifiedEctopicEvents.length / rrs.length * 100 : 0;
  const pauseBurdenPct = rrs.length ? verifiedPauseEvents.length / rrs.length * 100 : 0;
  const regularityScore = Math.round(clamp(
    100 - ectopicBurdenPct * 8 - pauseBurdenPct * 15 - rhythmAnalysis.irregularEpisodes.length * 5,
    0,
    100
  ));
  let reviewPriority = "Low";
  if (verifiedPauseEvents.length >= 3 || rhythmAnalysis.irregularEpisodes.length >= 2 || ectopicBurdenPct >= 2) reviewPriority = "Moderate";
  if (verifiedPauseEvents.length >= 10 || rhythmAnalysis.irregularEpisodes.length >= 5 || ectopicBurdenPct >= 5) reviewPriority = "High";

  const rhythmEvents = [
    ...screeningEvents,
    ...rest.bradycardiaEpisodes.map((episode) => ({ ...episode, type: "bradycardia" })),
    ...rest.highSleepingEpisodes.map((episode) => ({ ...episode, type: "high-hr" }))
  ].sort((a, b) => (a.timeSec ?? a.startSec) - (b.timeSec ?? b.startSec));

  const universal = {
    durationSec,
    sampleRate,
    medianSampleIntervalSec,
    totalSamples: ecgs.length,
    expectedSamples: ecgs.length + missingSamples,
    missingSamples,
    gapCount: gaps.length,
    gapDurationSec,
    amplitude,
    ingestion: ingestionDiagnostics,
    qualityScore,
    qualityLevel,
    qualityComponents: {
      continuity: continuityScore,
      rPeakAgreement: detectorScore,
      morphology: morphologyScore,
      cleanBeats: cleanBeatScore,
      hrUsable: signalQuality.hrUsablePercentage
    },
    qualityGrades: signalQuality.grades,
    hrUsablePercentage: signalQuality.hrUsablePercentage,
    hrvUsablePercentage: signalQuality.hrvUsablePercentage,
    morphologyUsablePercentage: signalQuality.morphologyUsablePercentage,
    flatlineDurationSec: signalQuality.flatlineDurationSec,
    clippedSamplePercentage: signalQuality.clippedSamplePercentage,
    baselineWanderIndex: signalQuality.baselineWanderIndex,
    highFrequencyNoiseIndex: signalQuality.highFrequencyNoiseIndex,
    displacementEpisodeCount: signalQuality.displacementEpisodeCount,
    cleanBeatPercentage,
    artifactPercentage,
    rPeakConfidence,
    detectedBeats: primaryPeaks.length
  };

  const rhythm = {
    ectopicCount: verifiedEctopicEvents.length,
    ectopicCandidateCount: rhythmAnalysis.ectopicEvents.length,
    ectopicBurdenPct,
    pauseCount: verifiedPauseEvents.length,
    pauseCandidateCount: rhythmAnalysis.pauseEvents.length,
    pauseBurdenPct,
    verification: candidateVerification,
    irregularEpisodeCount: rhythmAnalysis.irregularEpisodes.length,
    irregularEpisodes: rhythmAnalysis.irregularEpisodes,
    bradycardiaEpisodeCount: rest.bradycardiaEpisodes.length,
    highSleepingHrEpisodeCount: rest.highSleepingEpisodes.length,
    regularityScore,
    reviewPriority,
    sensorIssueCount: rhythmAnalysis.sensorIssueCount,
    qualityExcludedBeatCount: rhythmAnalysis.qualityExcludedBeatCount,
    artifactExcludedIntervalCount: rhythmAnalysis.qualityExcludedBeatCount,
    suppressedArtifactWarningCount: rhythmAnalysis.suppressedCandidateCount,
    artifactEpisodes: signalQuality.excludedEpisodes,
    candidateBurdenPer1000: cleanRrs.length
      ? rhythmEvents.filter((event) => ["ectopic", "pause", "irregular"].includes(event.type) && event.classification !== "artifact-suspected").length / cleanRrs.length * 1000
      : 0,
    events: rhythmEvents,
    disclaimer: "Screening candidates only. This browser analysis is not a diagnosis and does not replace clinician review."
  };

  const visualizationData = {
    hrPoints: downsample(hrPoints, 1000),
    rrPoints,
    hrHistogram: computeHistogram(hrValues, 5, 30, 220),
    rrHistogram: computeHistogram(rrValues, 50, 250, 2000),
    beatOverlay,
    hrvTrend: {
      times: windows.filter((window) => window.hrvValid).map((window) => window.centerSec),
      rmssd: windows.filter((window) => window.hrvValid).map((window) => window.rmssd),
      sdnn: windows.filter((window) => window.hrvValid).map((window) => window.sdnn),
      hr: windows.filter((window) => window.hrvValid).map((window) => window.avgHr)
    },
    qualityTimeline: signalQuality.segments.map((segment) => ({
      startSec: segment.startSec,
      endSec: segment.endSec,
      score: segment.score,
      hrUsable: segment.hrUsable,
      hrvUsable: segment.hrvUsable,
      morphologyUsable: segment.morphologyUsable,
      displacement: segment.displacement,
      reason: segment.reason
    })),
    poincare: downsample(cleanRrs.slice(1).map((rr, index) => ({
      x: cleanRrs[index].val,
      y: rr.val
    })), 1200),
    qualityComponents: universal.qualityComponents,
    gaps,
    rhythmEvents,
    intervals: workout.intervals,
    recovery: workout.recovery,
    zones: workout.zones,
    restWindows: rest.windows,
    lfhfTrend: freqDomain.windows.map((window) => ({
      timeSec: window.centerSec,
      lf: window.lf,
      hf: window.hf,
      ratio: window.lfHfRatio,
      respirationBpm: window.respirationBpm
    })),
    stageProxy: rest.stageProxy,
    hourly: rest.hourly
  };

  const report = {
    version: 5,
    respiration,
    universal,
    classification,
    workout,
    rest,
    rhythm,
    hrv: {
      time: { ...rest.hrv, ...timeExtras },
      nonlinear,
      frequency: freqDomain.session,
      frequencyAvailable: freqDomain.available,
      frequencyWindowCount: freqDomain.windows.length,
      frequencyNote: "Welch PSD of a 4 Hz resampled clean NN tachogram per valid 5-minute window; session values are medians across windows."
    },
    visualizationData,
    methodology: {
      baselinePolicy: "within-recording",
      hrvStandard: "Clean normal-to-normal intervals; RMSSD, lnRMSSD, SDNN, and pNN50.",
      rPeakConfidence: "Agreement between two independent ECG peak detectors within 100 ms.",
      signalCleansing: "Short quality epochs consolidate gaps, flatline, clipping, abrupt contact shifts, and detector disagreement before rhythm candidates are counted.",
      intervalProtocol: "Five fixed one-minute efforts; each next effort is analyzed only after a sustained return to the original pre-test baseline.",
      activityCaveat: "Sleep versus quiet rest cannot be confirmed from ECG alone.",
      driftCaveat: "HR-only drift proxy cannot confirm constant pace, power, or workload.",
      medicalCaveat: rhythm.disclaimer
    }
  };

  const rawData = {
    ecgs,
    ecgTimes,
    hrs,
    rrs: cleanRrs,
    minTime,
    maxTime,
    durationSec,
    sampleRate,
    qualityTimeline: signalQuality.segments,
    rPeakTimes: primaryPeaks.map((peak) => ecgTimes[peak]),
    ectopicTimes: rhythmAnalysis.ectopicEvents.map((event) => minTime + event.timeSec * 1e9),
    pauseTimes: rhythmAnalysis.pauseEvents.map((event) => minTime + event.timeSec * 1e9),
    ectopicEvents: rhythmAnalysis.ectopicEvents.map((event) => ({
      timeNs: minTime + event.timeSec * 1e9,
      classification: event.classification,
      morphology: event.morphology
    })),
    pauseEventDetails: rhythmAnalysis.pauseEvents.map((event) => ({
      timeNs: minTime + event.timeSec * 1e9,
      classification: event.classification
    }))
  };
  return { report, rawData };
}

// ═══════════════════ R-Peak Detection ═══════════════════
function detectRPeaks(ecgs, sampleRate) {
  const n = ecgs.length;
  if (n < 10) return [];

  // 1. Differentiate
  const diff = new Float64Array(n);
  for (let i = 2; i < n - 2; i++) {
    diff[i] = (-ecgs[i - 2] - ecgs[i - 1] + ecgs[i + 1] + ecgs[i + 2]) / 8;
  }

  // 2. Square
  const sq = new Float64Array(n);
  for (let i = 0; i < n; i++) sq[i] = diff[i] * diff[i];

  // 3. Moving average (window ~150ms)
  const mwLen = Math.max(3, Math.floor(sampleRate * 0.15));
  const ma = new Float64Array(n);
  let runSum = 0;
  for (let i = 0; i < n; i++) {
    runSum += sq[i];
    if (i >= mwLen) runSum -= sq[i - mwLen];
    ma[i] = runSum / Math.min(i + 1, mwLen);
  }

  // 4. Adaptive threshold
  const peaks = [];
  const refractorySamples = Math.floor(sampleRate * 0.2); // 200ms refractory

  // Compute initial threshold from first 2 seconds
  const initLen = Math.min(Math.floor(sampleRate * 2), n);
  let maxInit = 0;
  for (let i = 0; i < initLen; i++) {
    if (ma[i] > maxInit) maxInit = ma[i];
  }
  let threshold = maxInit * 0.3;
  let lastPeak = -refractorySamples;

  for (let i = 1; i < n - 1; i++) {
    if (ma[i] > threshold && ma[i] > ma[i - 1] && ma[i] >= ma[i + 1] && (i - lastPeak) > refractorySamples) {
      // Find true R-peak: max ECG in ±15 samples
      let bestIdx = i;
      let bestVal = ecgs[i];
      const lo = Math.max(0, i - 15);
      const hi = Math.min(n - 1, i + 15);
      for (let j = lo; j <= hi; j++) {
        if (ecgs[j] > bestVal) { bestVal = ecgs[j]; bestIdx = j; }
      }
      peaks.push(bestIdx);
      lastPeak = bestIdx;

      // Update threshold (running average of peak heights)
      threshold = 0.7 * threshold + 0.3 * ma[i] * 0.3;
    }

    // Slowly decay threshold to adapt to signal changes
    if (i % Math.floor(sampleRate) === 0) {
      threshold *= 0.95;
      if (threshold < maxInit * 0.05) threshold = maxInit * 0.05;
    }
  }

  return peaks;
}

// ═══════════════════ Event Classification ═══════════════════
function classifyEvents(rrs, hrs, sampleRate) {
  let ectopicCount = 0;
  let skipCount = 0;
  let bradycardiaEpisodes = 0;
  let sensorIssues = 0;
  let badDataSegments = 0;
  const ectopicTimes = [];
  const skipTimes = [];

  if (rrs.length < 3) return { ectopicCount, skipCount, bradycardiaEpisodes, sensorIssues, badDataSegments, ectopicTimes, skipTimes };

  // Build local median RR for context (rolling window of 10)
  const windowSize = 10;
  let inBradyRun = false;
  let badDataRun = 0;

  for (let i = 1; i < rrs.length; i++) {
    const rr = rrs[i].val;
    const prevRR = rrs[i - 1].val;
    const t = rrs[i].time;

    // Local median from surrounding intervals
    const lo = Math.max(0, i - windowSize);
    const hi = Math.min(rrs.length - 1, i + windowSize);
    const localVals = [];
    for (let j = lo; j <= hi; j++) localVals.push(rrs[j].val);
    localVals.sort((a, b) => a - b);
    const localMedian = localVals[Math.floor(localVals.length / 2)];

    const deviationFromMedian = Math.abs(rr - localMedian) / localMedian;

    // ── Sensor issue: impossible RR (very short or very long) ──
    if (rr < 200 || rr > 2500) {
      sensorIssues++;
      badDataRun++;
      if (badDataRun >= 3) badDataSegments++;
      continue;
    } else {
      badDataRun = 0;
    }

    // ── Ectopic beat: sudden shortening then lengthening ──
    // Classic premature beat: RR drops > 20% from local median then next is > 20% longer
    if (deviationFromMedian > 0.20 && rr < localMedian) {
      ectopicCount++;
      ectopicTimes.push(t);
      continue;
    }

    // ── Skip / compensatory pause: RR > 1.5× local median ──
    if (rr > localMedian * 1.5) {
      skipCount++;
      skipTimes.push(t);
      continue;
    }

    // ── Bradycardia: sustained HR < 40 bpm (RR > 1500 ms) ──
    if (rr > 1500) {
      if (!inBradyRun) { bradycardiaEpisodes++; inBradyRun = true; }
    } else {
      inBradyRun = false;
    }
  }

  return { ectopicCount, skipCount, bradycardiaEpisodes, sensorIssues, badDataSegments, ectopicTimes, skipTimes };
}

// ═══════════════════ HRV Trend (windowed) ═══════════════════
function computeHrvTrend(rrs, minTime, totalDurSec, windowSec) {
  const trend = { times: [], rmssd: [], sdnn: [], hr: [] };
  if (rrs.length < 5) return trend;

  const stepSec = windowSec; // non-overlapping windows
  for (let startSec = 0; startSec < totalDurSec; startSec += stepSec) {
    const startNs = minTime + startSec * 1e9;
    const endNs = startNs + windowSec * 1e9;

    const windowRRs = [];
    const windowHRs = [];
    for (const r of rrs) {
      if (r.time >= startNs && r.time < endNs && r.val >= 250 && r.val <= 2500) {
        windowRRs.push(r.val);
        windowHRs.push(60000 / r.val);
      }
    }

    if (windowRRs.length < 5) continue;

    // Filter successive differences (skip ectopic-adjacent)
    const cleanDiffs = [];
    let sumRR = 0;
    for (let i = 0; i < windowRRs.length; i++) {
      sumRR += windowRRs[i];
      if (i > 0) {
        const change = Math.abs(windowRRs[i] - windowRRs[i - 1]) / windowRRs[i - 1];
        if (change <= 0.25) {
          cleanDiffs.push(Math.abs(windowRRs[i] - windowRRs[i - 1]));
        }
      }
    }
    const meanRR = sumRR / windowRRs.length;

    let sdnnVar = 0;
    for (const v of windowRRs) sdnnVar += Math.pow(v - meanRR, 2);
    const wSdnn = Math.sqrt(sdnnVar / windowRRs.length);

    let rmssdS = 0;
    for (const d of cleanDiffs) rmssdS += d * d;
    const wRmssd = cleanDiffs.length > 0 ? Math.sqrt(rmssdS / cleanDiffs.length) : 0;

    const avgHR = windowHRs.reduce((a, b) => a + b, 0) / windowHRs.length;

    trend.times.push(startSec + windowSec / 2);
    trend.rmssd.push(wRmssd);
    trend.sdnn.push(wSdnn);
    trend.hr.push(avgHR);
  }

  return trend;
}

// ═══════════════════ ECG Window Extraction ═══════════════════
export function extractWindow(rawData, windowStartSec, windowSizeSec) {
  const { ecgs, ecgTimes, hrs, rrs, durationSec, sampleRate, ectopicTimes, pauseTimes, minTime, rPeakTimes, ectopicEvents, pauseEventDetails } = rawData;

  if (windowSizeSec === undefined || windowSizeSec === null) windowSizeSec = 30;
  if (windowStartSec > durationSec - windowSizeSec) {
    windowStartSec = Math.max(0, durationSec - windowSizeSec);
  }
  if (windowStartSec < 0) windowStartSec = 0;

  const startTimeNs = minTime + (windowStartSec * 1e9);
  const endTimeNs = minTime + ((windowStartSec + windowSizeSec) * 1e9);
  const lowerBound = (values, target) => {
    let lo = 0;
    let hi = values.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (values[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const startIdx = ecgTimes?.length ? lowerBound(ecgTimes, startTimeNs) : Math.floor(windowStartSec * sampleRate);
  let endIdx = ecgTimes?.length ? lowerBound(ecgTimes, endTimeNs) : Math.floor((windowStartSec + windowSizeSec) * sampleRate);
  if (endIdx > ecgs.length) endIdx = ecgs.length;

  const rawSlice = ecgs.slice(startIdx, endIdx);
  
  // 1. Compute mean and standard deviation for outlier rejection
  let sum = 0;
  for (let i = 0; i < rawSlice.length; i++) sum += rawSlice[i];
  const mean = rawSlice.length > 0 ? sum / rawSlice.length : 0;
  
  let varSum = 0;
  for (let i = 0; i < rawSlice.length; i++) varSum += Math.pow(rawSlice[i] - mean, 2);
  const std = rawSlice.length > 0 ? Math.sqrt(varSum / rawSlice.length) : 0;
  
  const minValid = mean - 3 * std;
  const maxValid = mean + 3 * std;

  // 2. Downsample into max ~10000 chunks for ECG envelope rendering
  const maxEcgPoints = 10000;
  const ecgWindow = { min: [], max: [], median: [] };

  if (rawSlice.length > maxEcgPoints) {
    const chunkLen = rawSlice.length / maxEcgPoints;
    for (let i = 0; i < maxEcgPoints; i++) {
      const cStart = Math.floor(i * chunkLen);
      const cEnd = Math.floor((i + 1) * chunkLen);
      let cMin = Infinity;
      let cMax = -Infinity;
      const vals = [];
      for (let j = cStart; j < cEnd; j++) {
        const v = rawSlice[j];
        if (v >= minValid && v <= maxValid) {
          if (v < cMin) cMin = v;
          if (v > cMax) cMax = v;
          vals.push(v);
        }
      }
      if (vals.length === 0) {
        ecgWindow.min.push(mean);
        ecgWindow.max.push(mean);
        ecgWindow.median.push(mean);
      } else {
        ecgWindow.min.push(cMin);
        ecgWindow.max.push(cMax);
        vals.sort((a,b) => a-b);
        ecgWindow.median.push(vals[Math.floor(vals.length / 2)]);
      }
    }
  } else {
    for (let i = 0; i < rawSlice.length; i++) {
      let v = rawSlice[i];
      if (v < minValid) v = minValid;
      if (v > maxValid) v = maxValid;
      ecgWindow.min.push(v);
      ecgWindow.max.push(v);
      ecgWindow.median.push(v);
    }
  }

  // HR and RR for the window
  const hrWindow = hrs.filter(h => h.time >= startTimeNs && h.time <= endTimeNs).map(h => h.val);
  const rrWindow = rrs.filter(r => r.time >= startTimeNs && r.time <= endTimeNs).map(r => r.val);

  // Find irregularity markers that fall in this window (as fractional positions 0..1)
  const markers = [];
  const ectopicSource = ectopicEvents ?? (ectopicTimes ?? []).map((timeNs) => ({ timeNs }));
  for (const event of ectopicSource) {
    if (event.timeNs >= startTimeNs && event.timeNs <= endTimeNs) {
      markers.push({
        type: 'ectopic',
        pos: (event.timeNs - startTimeNs) / (endTimeNs - startTimeNs),
        classification: event.classification ?? 'unverified',
        morphology: event.morphology ?? 'unknown'
      });
    }
  }
  const pauseSource = pauseEventDetails ?? (pauseTimes ?? []).map((timeNs) => ({ timeNs }));
  for (const event of pauseSource) {
    if (event.timeNs >= startTimeNs && event.timeNs <= endTimeNs) {
      markers.push({
        type: 'pause',
        pos: (event.timeNs - startTimeNs) / (endTimeNs - startTimeNs),
        classification: event.classification ?? 'unverified'
      });
    }
  }

  // R-peak beat annotations for short (clinically readable) windows.
  const beats = [];
  if (Array.isArray(rPeakTimes) && rPeakTimes.length && windowSizeSec <= 60) {
    let lo = lowerBound(rPeakTimes, startTimeNs);
    for (let index = lo; index < rPeakTimes.length && rPeakTimes[index] <= endTimeNs; index++) {
      const rrMs = index > 0 ? (rPeakTimes[index] - rPeakTimes[index - 1]) / 1e6 : null;
      beats.push({
        pos: (rPeakTimes[index] - startTimeNs) / (endTimeNs - startTimeNs),
        rrMs: Number.isFinite(rrMs) && rrMs > 150 && rrMs < 5000 ? rrMs : null
      });
      if (beats.length >= 160) break;
    }
  }

  // CWT spectrogram for this window (Uses rawSlice for full 130 Hz data)
  const numTimeBins = 100;
  const numFreqBins = 40;
  const minFreq = 1;
  const maxFreq = 40;

  const spectrogram = [];
  const dt = 1 / sampleRate;
  const chunkLenForCwt = rawSlice.length;

  const timeSteps = [];
  for (let i = 0; i < numTimeBins; i++) {
    timeSteps.push(Math.floor(i * (chunkLenForCwt / numTimeBins)));
  }

  let maxMagGlobal = 0;

  if (chunkLenForCwt > 0) {
    for (let f = 0; f < numFreqBins; f++) {
      const freq = minFreq + (f / numFreqBins) * (maxFreq - minFreq);
      const row = [];

      const w0 = 6;
      const s = w0 / (2 * Math.PI * freq);
      const hw = Math.floor(3 * s * sampleRate);

      for (const tIdx of timeSteps) {
        let real = 0;
        let imag = 0;

        const start = Math.max(0, tIdx - hw);
        const end = Math.min(chunkLenForCwt - 1, tIdx + hw);

        for (let j = start; j <= end; j++) {
          const t = (j - tIdx) * dt;
          const val = rawSlice[j];
          const env = Math.exp(-(t * t) / (2 * s * s)) * Math.pow(Math.PI * s * s, -0.25);
          const phase = w0 * t / s;
          real += val * env * Math.cos(phase);
          imag += val * env * Math.sin(phase);
        }

        const magnitude = Math.sqrt(real * real + imag * imag);
        row.push(magnitude);
        if (magnitude > maxMagGlobal) maxMagGlobal = magnitude;
      }
      spectrogram.push(row);
    }

    if (maxMagGlobal > 0) {
      for (let r = 0; r < spectrogram.length; r++) {
        for (let c = 0; c < spectrogram[r].length; c++) {
          spectrogram[r][c] /= maxMagGlobal;
        }
      }
    }
  }

  return {
    ecg: ecgWindow,
    hr: hrWindow,
    rr: rrWindow,
    markers,
    beats,
    spectrogram,
    windowStartSec,
    windowSizeSec,
    durationSec
  };
}
