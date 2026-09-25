const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function percentile(values, fraction) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = clamp((sorted.length - 1) * fraction, 0, sorted.length - 1);
  const low = Math.floor(position);
  const high = Math.ceil(position);
  const weight = position - low;
  return sorted[low] * (1 - weight) + sorted[high] * weight;
}

function lowerBound(values, target) {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (values[middle] < target) low = middle + 1;
    else high = middle;
  }
  return low;
}

function countPeaks(peaks, startIndex, endIndex) {
  return Math.max(0, lowerBound(peaks, endIndex) - lowerBound(peaks, startIndex));
}

function detectorAgreementInRange(primary, secondary, startIndex, endIndex, toleranceSamples) {
  const first = primary.slice(lowerBound(primary, startIndex), lowerBound(primary, endIndex));
  const second = secondary.slice(lowerBound(secondary, startIndex), lowerBound(secondary, endIndex));
  if (!first.length && !second.length) return 0;
  let matches = 0;
  let secondIndex = 0;
  for (const peak of first) {
    while (secondIndex < second.length && second[secondIndex] < peak - toleranceSamples) secondIndex++;
    if (secondIndex < second.length && Math.abs(second[secondIndex] - peak) <= toleranceSamples) matches++;
  }
  return (2 * matches / Math.max(1, first.length + second.length)) * 100;
}

function mergeExcludedSegments(segments) {
  const excluded = [];
  let current = null;
  for (const segment of segments) {
    if (segment.hrUsable) {
      if (current) excluded.push(current);
      current = null;
      continue;
    }
    if (!current || segment.startSec - current.endSec > 0.25) {
      if (current) excluded.push(current);
      current = {
        startSec: segment.startSec,
        endSec: segment.endSec,
        reason: segment.reason,
        minimumScore: segment.score
      };
    } else {
      current.endSec = segment.endSec;
      current.minimumScore = Math.min(current.minimumScore, segment.score);
      if (!current.reason.includes(segment.reason)) current.reason += `; ${segment.reason}`;
    }
  }
  if (current) excluded.push(current);
  return excluded;
}

function gradeUsability(percentage) {
  if (percentage >= 90) return "High";
  if (percentage >= 75) return "Good";
  if (percentage >= 55) return "Limited";
  return "Insufficient";
}

export function qualitySegmentAt(segments, timeSec) {
  if (!segments?.length || !Number.isFinite(timeSec)) return null;
  const index = Math.min(segments.length - 1, Math.max(0, Math.floor(timeSec / (segments[0].durationSec || 10))));
  const direct = segments[index];
  if (direct && timeSec >= direct.startSec && timeSec < direct.endSec) return direct;
  return segments.find((segment) => timeSec >= segment.startSec && timeSec < segment.endSec) ?? null;
}

export function buildSignalQualityTimeline({
  ecgs,
  ecgTimes,
  sampleRate,
  minTime,
  durationSec,
  primaryPeaks = [],
  secondaryPeaks = [],
  segmentDurationSec = 10
}) {
  const segmentCount = Math.max(1, Math.ceil(durationSec / segmentDurationSec));
  const rawSegments = [];
  const toleranceSamples = Math.max(1, Math.round(sampleRate * 0.1));
  let sampleIndex = 0;

  for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
    const startSec = segmentIndex * segmentDurationSec;
    const endSec = Math.min(durationSec, startSec + segmentDurationSec);
    const startTime = minTime + startSec * 1e9;
    const endTime = minTime + endSec * 1e9;
    while (sampleIndex < ecgTimes.length && ecgTimes[sampleIndex] < startTime) sampleIndex++;
    const startIndex = sampleIndex;
    while (sampleIndex < ecgTimes.length && ecgTimes[sampleIndex] < endTime) sampleIndex++;
    const endIndex = sampleIndex;
    const count = endIndex - startIndex;
    const expected = Math.max(1, (endSec - startSec) * sampleRate);
    const coverage = clamp(count / expected * 100, 0, 100);
    const stride = Math.max(1, Math.floor(count / 500));
    const sample = [];
    const differences = [];
    let equalDifferences = 0;
    let repeatedExtrema = 0;
    let previous = null;
    let localMin = Infinity;
    let localMax = -Infinity;

    for (let index = startIndex; index < endIndex; index += stride) {
      const value = ecgs[index];
      if (!Number.isFinite(value)) continue;
      sample.push(value);
      localMin = Math.min(localMin, value);
      localMax = Math.max(localMax, value);
      if (previous !== null) differences.push(Math.abs(value - previous));
      previous = value;
    }
    const p05 = percentile(sample, 0.05);
    const p95 = percentile(sample, 0.95);
    const amplitude = Math.max(Number.EPSILON, p95 - p05);
    const flatThreshold = Math.max(Number.EPSILON, amplitude * 0.0005);
    for (const difference of differences) if (difference <= flatThreshold) equalDifferences++;
    for (const value of sample) {
      if (value === localMin || value === localMax) repeatedExtrema++;
    }
    const flatlinePct = differences.length ? equalDifferences / differences.length * 100 : 100;
    const clippedPct = sample.length ? Math.max(0, repeatedExtrema - 2) / sample.length * 100 : 100;
    const noiseRatio = amplitude ? median(differences) / amplitude : 1;
    const baseline = median(sample);
    const detectorAgreement = detectorAgreementInRange(primaryPeaks, secondaryPeaks, startIndex, endIndex, toleranceSamples);
    const detectedBeats = countPeaks(primaryPeaks, startIndex, endIndex);
    rawSegments.push({
      startSec,
      endSec,
      durationSec: endSec - startSec,
      startIndex,
      endIndex,
      sampleCount: count,
      expectedSamples: expected,
      coverage,
      amplitude,
      baseline,
      noiseRatio,
      flatlinePct,
      clippedPct,
      detectorAgreement,
      detectedBeats
    });
  }

  const referenceAmplitude = median(rawSegments.map((segment) => segment.amplitude).filter((value) => value > Number.EPSILON)) || 1;
  const referenceNoise = median(rawSegments.map((segment) => segment.noiseRatio).filter(Number.isFinite)) || 0.02;
  const baselineStepReference = median(rawSegments.slice(1).map((segment, index) => Math.abs(segment.baseline - rawSegments[index].baseline))) || referenceAmplitude * 0.05;

  const segments = rawSegments.map((segment, index) => {
    const amplitudeRatio = segment.amplitude / referenceAmplitude;
    const noiseMultiple = segment.noiseRatio / Math.max(0.002, referenceNoise);
    const baselineStep = index ? Math.abs(segment.baseline - rawSegments[index - 1].baseline) : 0;
    const baselineStepMultiple = baselineStep / Math.max(referenceAmplitude * 0.05, baselineStepReference);
    let score = 100;
    const reasons = [];

    if (segment.coverage < 80) { score -= 55; reasons.push("large timestamp gap"); }
    else if (segment.coverage < 95) { score -= 20; reasons.push("missing samples"); }

    if (amplitudeRatio < 0.08) { score -= 60; reasons.push("near-flat contact"); }
    else if (amplitudeRatio < 0.25) { score -= 30; reasons.push("low signal amplitude"); }
    else if (amplitudeRatio > 8) { score -= 55; reasons.push("large contact shift"); }
    else if (amplitudeRatio > 4) { score -= 25; reasons.push("unstable amplitude"); }

    if (segment.flatlinePct > 20) { score -= 55; reasons.push("flatline"); }
    else if (segment.flatlinePct > 5) { score -= 20; reasons.push("repeated samples"); }
    if (segment.clippedPct > 8) { score -= 35; reasons.push("clipping"); }
    else if (segment.clippedPct > 2) { score -= 15; reasons.push("possible clipping"); }

    if (noiseMultiple > 8 && segment.noiseRatio > 0.18) { score -= 40; reasons.push("high-frequency noise"); }
    else if (noiseMultiple > 4 && segment.noiseRatio > 0.1) { score -= 18; reasons.push("elevated noise"); }

    if (baselineStepMultiple > 10 && baselineStep > referenceAmplitude) { score -= 45; reasons.push("electrode displacement"); }
    else if (baselineStepMultiple > 5 && baselineStep > referenceAmplitude * 0.4) { score -= 20; reasons.push("baseline step"); }

    if (segment.detectedBeats >= 3) {
      if (segment.detectorAgreement < 45) { score -= 35; reasons.push("peak detectors disagree"); }
      else if (segment.detectorAgreement < 70) { score -= 15; reasons.push("limited peak agreement"); }
    }

    score = Math.round(clamp(score, 0, 100));
    const displacement = reasons.some((reason) => ["near-flat contact", "large contact shift", "electrode displacement", "flatline"].includes(reason));
    const hrUsable = score >= 45 && segment.coverage >= 75 && amplitudeRatio >= 0.06;
    const hrvUsable = score >= 72 && segment.detectorAgreement >= 70 && !displacement;
    const morphologyUsable = score >= 78 && noiseMultiple <= 5 && amplitudeRatio >= 0.25 && amplitudeRatio <= 4;
    return {
      ...segment,
      score,
      amplitudeRatio,
      noiseMultiple,
      baselineStep,
      baselineStepMultiple,
      displacement,
      hrUsable,
      hrvUsable,
      morphologyUsable,
      reason: reasons.join(", ") || "clean signal"
    };
  });

  const totalSeconds = segments.reduce((sum, segment) => sum + segment.durationSec, 0) || durationSec || 1;
  const percentFor = (key) => segments.reduce((sum, segment) => sum + (segment[key] ? segment.durationSec : 0), 0) / totalSeconds * 100;
  const hrUsablePercentage = percentFor("hrUsable");
  const hrvUsablePercentage = percentFor("hrvUsable");
  const morphologyUsablePercentage = percentFor("morphologyUsable");
  const excludedEpisodes = mergeExcludedSegments(segments);
  const flatlineDurationSec = segments.reduce((sum, segment) => sum + (segment.flatlinePct > 20 ? segment.durationSec : 0), 0);
  const clippedSamplePercentage = segments.reduce((sum, segment) => sum + segment.clippedPct * segment.sampleCount, 0)
    / Math.max(1, segments.reduce((sum, segment) => sum + segment.sampleCount, 0));

  return {
    segmentDurationSec,
    segments,
    excludedEpisodes,
    hrUsablePercentage,
    hrvUsablePercentage,
    morphologyUsablePercentage,
    grades: {
      hr: gradeUsability(hrUsablePercentage),
      hrv: gradeUsability(hrvUsablePercentage),
      morphology: gradeUsability(morphologyUsablePercentage)
    },
    flatlineDurationSec,
    clippedSamplePercentage,
    baselineWanderIndex: median(segments.map((segment) => segment.baselineStep / Math.max(referenceAmplitude, Number.EPSILON))),
    highFrequencyNoiseIndex: median(segments.map((segment) => segment.noiseRatio)),
    displacementEpisodeCount: excludedEpisodes.filter((episode) => episode.reason.includes("contact") || episode.reason.includes("displacement") || episode.reason.includes("flatline")).length
  };
}
