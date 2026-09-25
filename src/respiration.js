// Experimental ECG-derived respiration (EDR), independent of the fixed HRV HF band.
// Two physiological families: clean NN timing (RSA) and QRS morphology. QRS
// amplitude and area are correlated checks, never two independent votes.
import { fft } from "./hrv-metrics.js";
import { qualitySegmentAt } from "./signal-quality.js";

const mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
function quantile(xs, q) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), i = (s.length - 1) * q;
  return s[Math.floor(i)] * (1 - i % 1) + s[Math.ceil(i)] * (i % 1);
}
const median = (xs) => quantile(xs, 0.5);

// No extrapolation or interpolation across long holes. Resampling to 4 Hz does
// not increase the information rate of the original beat-sampled features.
function resample(points, key, start, end, maxGap) {
  const xs = points.filter((p) => Number.isFinite(p[key]));
  if (xs.length < 12 || xs[0].timeSec > start || xs.at(-1).timeSec < end - 0.25) return null;
  const values = [];
  let j = 0;
  for (let t = start; t < end; t += 0.25) {
    while (j + 1 < xs.length && xs[j + 1].timeSec < t) j++;
    const a = xs[j], b = xs[j + 1];
    if (!b || b.timeSec - a.timeSec > maxGap) return null;
    values.push(a[key] + (b[key] - a[key]) * (t - a.timeSec) / (b.timeSec - a.timeSec));
  }
  return values;
}

function spectralCandidate(values, minBpm, maxBpm, minVariation) {
  if (!values || values.length < 64) return null;
  const n = values.length, mid = (n - 1) / 2, avg = mean(values);
  let numerator = 0, denominator = 0;
  for (let i = 0; i < n; i++) { numerator += (i - mid) * (values[i] - avg); denominator += (i - mid) ** 2; }
  const detrended = values.map((v, i) => v - avg - numerator / denominator * (i - mid));
  const sd = Math.sqrt(mean(detrended.map((v) => v * v)));
  if (sd < minVariation) return null;
  // Clip isolated feature outliers using a robust scale, then Hann taper.
  const center = median(detrended), mad = median(detrended.map((v) => Math.abs(v - center))) || sd;
  const real = new Float64Array(1024), imag = new Float64Array(1024);
  for (let i = 0; i < n; i++) real[i] = Math.max(-5 * mad, Math.min(5 * mad, detrended[i] - center)) * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)));
  fft(real, imag);
  const power = Array.from(real, (v, i) => v * v + imag[i] * imag[i]);
  return describeSpectrum(power, minBpm, maxBpm, 240 / n);
}

function describeSpectrum(power, minBpm, maxBpm, resolutionBpm) {
  const binBpm = 240 / power.length;
  const lo = Math.ceil(minBpm / binBpm), hi = Math.floor(maxBpm / binBpm);
  if (hi <= lo + 4) return null;
  let peak = lo, total = 0;
  for (let k = lo; k <= hi; k++) { total += power[k]; if (power[k] > power[peak]) peak = k; }
  if (!total) return null;
  let local = 0, competitor = 0;
  for (let k = lo; k <= hi; k++) {
    if (Math.abs(k - peak) * binBpm <= resolutionBpm) local += power[k];
    if (Math.abs(k - peak) * binBpm > resolutionBpm * 1.5) competitor = Math.max(competitor, power[k]);
  }
  const concentration = local / total, prominence = power[peak] / Math.max(competitor, 1e-20);
  const score = Math.round(100 * Math.min(1, concentration) * Math.min(1, prominence / 3));
  const resolved = peak > lo + 1 && peak < hi - 1;
  return { bpm: peak * binBpm, concentration, prominence, score,
    usable: resolved && concentration >= 0.45 && prominence >= 1.7,
    strong: resolved && concentration >= 0.65 && prominence >= 3.5,
    spectrum: power.map((p) => p / total), peak };
}

// A common spectral peak may be secondary in either surrogate. Normalized
// spectral products recover it without treating two morphology features as
// independent physiological evidence. Require substantial power in each family.
function fuseSpectra(timing, shape, minBpm, maxBpm, resolutionBpm) {
  if (!timing || !shape) return null;
  const combined = describeSpectrum(timing.spectrum.map((p, i) => p * shape.spectrum[i]), minBpm, maxBpm, resolutionBpm);
  if (!combined?.usable) return null;
  const k = combined.peak;
  if (timing.spectrum[k] < timing.spectrum[timing.peak] * 0.25 || shape.spectrum[k] < shape.spectrum[shape.peak] * 0.25) return null;
  return combined;
}
const diagnostic = (candidate) => {
  if (!candidate) return null;
  const { spectrum, peak, ...summary } = candidate;
  return summary;
};

export function summarizeRespiration(windows) {
  const accepted = windows.filter((w) => Number.isFinite(w.bpm));
  const rates = accepted.map((w) => w.bpm);
  return {
    medianBpm: median(rates), p10Bpm: quantile(rates, 0.1), p90Bpm: quantile(rates, 0.9),
    acceptedWindows: accepted.length, totalWindows: windows.length,
    coveragePct: windows.length ? accepted.length / windows.length * 100 : 0,
    agreementWindows: accepted.filter((w) => w.source === "timing + morphology").length
  };
}

export function respirationCsv(respiration) {
  const columns = ["start_s", "end_s", "center_s", "breaths_per_min", "signal_support", "source", "quality_score", "heart_rate_bpm", "search_ceiling_breaths_per_min", "timing_breaths_per_min", "qrs_amplitude_breaths_per_min", "qrs_area_breaths_per_min", "unavailable_reason"];
  const number = (v) => Number.isFinite(v) ? v.toFixed(3) : "";
  return [columns.join(","), ...(respiration.windows ?? []).map((w) => [w.startSec, w.endSec, w.centerSec, w.bpm].map(number).concat([
    w.support, w.source, number(w.score), number(w.hrBpm), number(w.maxBpm), number(w.channels?.timing?.bpm), number(w.channels?.amplitude?.bpm), number(w.channels?.area?.bpm), w.reason
  ]).map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
}

export function estimateRespiration({ ecgs, ecgTimes, primaryPeaks, cleanRrs, minTime, durationSec, sampleRate, qualityTimeline, gaps = [], mode = "rest" }) {
  const exercise = ["workout", "interval-test", "mixed"].includes(mode);
  const windowSec = exercise ? 32 : 64, stepSec = exercise ? 10 : 30;
  // Exercise band follows the 0.2–1.2 Hz running study (PMC8402314).
  // Slow breathing below 12/min is deliberately outside the exercise model.
  const minBpm = exercise ? 12 : 6;
  const cleanTimes = new Set(cleanRrs.map((rr) => rr.time));
  const features = [];
  for (const peak of primaryPeaks) {
    const timeSec = (ecgTimes[peak] - minTime) / 1e9;
    const quality = qualitySegmentAt(qualityTimeline, timeSec);
    if (!cleanTimes.has(ecgTimes[peak]) || !quality?.morphologyUsable) continue;
    const left = peak - Math.ceil(sampleRate * 0.055), right = peak + Math.ceil(sampleRate * 0.075);
    if (left < 0 || right >= ecgs.length || (ecgTimes[right] - ecgTimes[left]) / 1e9 > 0.17) continue;
    const baseline = (ecgs[left] + ecgs[right]) / 2;
    let low = Infinity, high = -Infinity, area = 0;
    for (let i = left; i <= right; i++) { low = Math.min(low, ecgs[i]); high = Math.max(high, ecgs[i]); area += Math.abs(ecgs[i] - baseline); }
    features.push({ timeSec, amplitude: high - low, area: area / (right - left + 1) });
  }
  const timing = cleanRrs.map((rr) => ({ timeSec: (rr.time - minTime) / 1e9, nnMs: rr.val }));
  const windows = [];
  let ti = 0, fi = 0, gi = 0;
  for (let startSec = 0; startSec + windowSec <= durationSec; startSec += stepSec) {
    const endSec = startSec + windowSec, centerSec = (startSec + endSec) / 2;
    while (ti + 1 < timing.length && timing[ti + 1].timeSec < startSec) ti++;
    while (fi + 1 < features.length && features[fi + 1].timeSec < startSec) fi++;
    while (gi < gaps.length && gaps[gi].timeSec + gaps[gi].durationSec < startSec) gi++;
    let te = ti; while (te < timing.length && timing[te].timeSec < endSec + 2) te++;
    let fe = fi; while (fe < features.length && features[fe].timeSec < endSec + 2) fe++;
    const nn = timing.slice(ti, te), morphology = features.slice(fi, fe);
    const nnInside = nn.filter((p) => p.timeSec >= startSec && p.timeSec < endSec);
    const typicalNn = median(nnInside.map((p) => p.nnMs));
    const hrBpm = typicalNn > 0 ? 60000 / typicalNn : null;
    // Conservative beat-rate ceiling; aliasing above it cannot be ruled out.
    const maxBpm = Math.min(72, (hrBpm || 0) * 0.45);
    const result = { startSec, endSec, centerSec, bpm: null, score: null, support: "unavailable", source: "", reason: "", hrBpm, maxBpm, channels: {} };
    let hasGap = false;
    for (let g = gi; g < gaps.length && gaps[g].timeSec < endSec; g++) if (gaps[g].durationSec > 0.25) hasGap = true;
    const cleanCoverage = nnInside.reduce((sum, p) => sum + p.nnMs / 1000, 0) / windowSec;
    if (hasGap) result.reason = "ECG gap";
    else if (!hrBpm || cleanCoverage < 0.8) result.reason = "Insufficient clean beats";
    else if (maxBpm < minBpm + 4) result.reason = "Insufficient beat sampling rate";
    else {
      const maxGap = Math.min(3, Math.max(1.5, typicalNn / 1000 * 2.5));
      const rsa = spectralCandidate(resample(nn, "nnMs", startSec, endSec, maxGap), minBpm, maxBpm, 4);
      const amplitudeScale = median(morphology.map((p) => p.amplitude)) || 0;
      const areaScale = median(morphology.map((p) => p.area)) || 0;
      const amplitude = spectralCandidate(resample(morphology, "amplitude", startSec, endSec, maxGap), minBpm, maxBpm, amplitudeScale * 0.005 + 1e-12);
      const area = spectralCandidate(resample(morphology, "area", startSec, endSec, maxGap), minBpm, maxBpm, areaScale * 0.005 + 1e-12);
      result.channels = { timing: diagnostic(rsa), amplitude: diagnostic(amplitude), area: diagnostic(area) };
      const tolerance = Math.max(2.5, 60 / windowSec * 1.5);
      const agree = (a, b) => Math.abs(a.bpm - b.bpm) <= tolerance;
      const shapeConflict = amplitude?.usable && area?.usable && !agree(amplitude, area);
      const shape = !shapeConflict ? [amplitude, area].filter((c) => c?.usable).sort((a, b) => b.score - a.score)[0] : null;
      const timingOk = rsa?.usable;
      const shapeSpectrum = amplitude && area
        ? describeSpectrum(area.spectrum.map((p, i) => (p + amplitude.spectrum[i]) / 2), minBpm, maxBpm, 60 / windowSec)
        : area || amplitude;
      const fused = fuseSpectra(rsa, shapeSpectrum, minBpm, maxBpm, 60 / windowSec);
      result.channels.fused = diagnostic(fused);
      if ((shapeConflict && amplitude.strong && area.strong) || (shape?.strong && rsa?.strong && !agree(shape, rsa))) result.reason = "Respiratory surrogates disagree";
      else if (fused || (shape && timingOk && agree(shape, rsa))) {
        result.bpm = fused?.bpm ?? (shape.bpm * shape.score + rsa.bpm * rsa.score) / (shape.score + rsa.score);
        result.source = "timing + morphology"; result.support = "agreement"; result.score = fused?.score ?? Math.round((shape.score + rsa.score) / 2);
      } else if (shape && timingOk && !agree(shape, rsa)) result.reason = "Respiratory surrogates disagree";
      else if (shape?.strong || (timingOk && rsa.strong && rsa.bpm >= 9 && !exercise)) {
        const candidate = shape?.strong ? shape : rsa;
        result.bpm = candidate.bpm; result.source = shape?.strong ? "morphology only" : "timing only";
        result.support = "single family"; result.score = candidate.score;
      } else result.reason = "Weak or interrupted respiratory modulation";
    }
    windows.push(result);
  }
  const summary = summarizeRespiration(windows);
  const bucketSec = durationSec >= 7200 ? 3600 : 300;
  const buckets = [];
  for (let startSec = 0; startSec < durationSec; startSec += bucketSec) {
    const endSec = Math.min(durationSec, startSec + bucketSec);
    buckets.push({ startSec, endSec, ...summarizeRespiration(windows.filter((w) => w.centerSec >= startSec && w.centerSec < endSec)) });
  }
  const reasonCounts = {};
  for (const w of windows) if (w.reason) reasonCounts[w.reason] = (reasonCounts[w.reason] || 0) + 1;
  return {
    version: 1, available: summary.acceptedWindows > 0, mode,
    method: "ECG-derived respiration: clean NN timing and QRS amplitude/area spectral fusion",
    settings: { windowSec, stepSec, minBpm, maxBpm: 72, beatRateCeiling: 0.45, resampleHz: 4, nominalResolutionBpm: 60 / windowSec },
    summary, windows, buckets, reasonCounts,
    caveat: "Experimental ECG-derived estimate; no reference breathing signal in this recording. Movement, cadence and aliasing can mimic breathing. Signal support is heuristic, not a validated confidence or accuracy score. Gaps mean unavailable, not absent breathing. Not an apnea test or a basis for automatic training changes.",
    timingNote: `${windowSec}-second overlapping windows, every ${stepSec} seconds, plotted at their centers. Retrospective analysis; transitions are averaged within each window. Coverage is accepted complete windows / all complete windows; recording edges are not scored.`
  };
}
