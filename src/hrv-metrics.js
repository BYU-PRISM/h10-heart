// Extended HRV statistics: time-domain extras, frequency-domain (Welch FFT on a
// 4 Hz resampled NN tachogram), and nonlinear (Poincare SD1/SD2, Baevsky stress
// index, triangular index). All inputs are clean NN intervals in milliseconds
// with beat times in seconds from the recording start.

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - avg) ** 2)));
}

function percentile(values, pct) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.min(sorted.length - 1, (sorted.length - 1) * pct));
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  return sorted[lo] * (1 - (index - lo)) + sorted[hi] * (index - lo);
}

// ───────────────────── Time-domain extras ─────────────────────
export function computeTimeDomainExtras(nnValuesMs, windows = []) {
  if (nnValuesMs.length < 3) {
    return { meanNN: 0, medianNN: 0, cvNN: 0, pNN20: 0, sdann: null, sdnnIndex: null };
  }
  const avg = mean(nnValuesMs);
  const sdnn = standardDeviation(nnValuesMs);
  let nn20 = 0;
  let pairs = 0;
  for (let index = 1; index < nnValuesMs.length; index++) {
    if (Math.abs(nnValuesMs[index] - nnValuesMs[index - 1]) > 20) nn20++;
    pairs++;
  }
  const validWindows = windows.filter((window) => window.hrvValid && Number.isFinite(window.meanNN ?? window.sdnn));
  const windowMeans = validWindows.map((window) => window.meanNN).filter(Number.isFinite);
  const windowSdnns = validWindows.map((window) => window.sdnn).filter((value) => Number.isFinite(value) && value > 0);
  return {
    meanNN: avg,
    medianNN: median(nnValuesMs),
    cvNN: avg ? sdnn / avg * 100 : 0,
    pNN20: pairs ? nn20 / pairs * 100 : 0,
    sdann: windowMeans.length >= 3 ? standardDeviation(windowMeans) : null,
    sdnnIndex: windowSdnns.length >= 3 ? mean(windowSdnns) : null
  };
}

// ───────────────────── FFT (iterative radix-2, complex) ─────────────────────
export function fft(real, imag) {
  const n = real.length;
  if (n <= 1) return;
  // bit reversal
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = -2 * Math.PI / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const evenRe = real[i + k];
        const evenIm = imag[i + k];
        const oddRe = real[i + k + len / 2] * curRe - imag[i + k + len / 2] * curIm;
        const oddIm = real[i + k + len / 2] * curIm + imag[i + k + len / 2] * curRe;
        real[i + k] = evenRe + oddRe;
        imag[i + k] = evenIm + oddIm;
        real[i + k + len / 2] = evenRe - oddRe;
        imag[i + k + len / 2] = evenIm - oddIm;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
}

// Welch PSD of an evenly sampled series. Returns { freqs, psd } in units of
// input^2 per Hz.
function welchPsd(series, sampleHz, segmentLength = 256) {
  if (series.length < segmentLength) segmentLength = 1 << Math.floor(Math.log2(Math.max(8, series.length)));
  if (series.length < 16) return null;
  const hop = Math.max(1, Math.floor(segmentLength / 2));
  const window = new Float64Array(segmentLength);
  let windowPower = 0;
  for (let i = 0; i < segmentLength; i++) {
    window[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (segmentLength - 1));
    windowPower += window[i] * window[i];
  }
  const half = segmentLength / 2;
  const psd = new Float64Array(half + 1);
  let segments = 0;
  for (let start = 0; start + segmentLength <= series.length; start += hop) {
    const real = new Float64Array(segmentLength);
    const imag = new Float64Array(segmentLength);
    // detrend (remove segment mean) and window
    let segMean = 0;
    for (let i = 0; i < segmentLength; i++) segMean += series[start + i];
    segMean /= segmentLength;
    for (let i = 0; i < segmentLength; i++) real[i] = (series[start + i] - segMean) * window[i];
    fft(real, imag);
    for (let k = 0; k <= half; k++) {
      const power = (real[k] * real[k] + imag[k] * imag[k]) / (sampleHz * windowPower);
      psd[k] += k === 0 || k === half ? power : 2 * power;
    }
    segments++;
  }
  if (!segments) return null;
  const freqs = new Float64Array(half + 1);
  for (let k = 0; k <= half; k++) {
    psd[k] /= segments;
    freqs[k] = k * sampleHz / segmentLength;
  }
  return { freqs, psd };
}

function bandPower(freqs, psd, lo, hi) {
  let power = 0;
  for (let k = 1; k < freqs.length; k++) {
    const centre = freqs[k];
    if (centre >= lo && centre < hi) power += psd[k] * (freqs[k] - freqs[k - 1]);
  }
  return power;
}

function peakFrequency(freqs, psd, lo, hi) {
  let best = null;
  for (let k = 1; k < freqs.length; k++) {
    if (freqs[k] < lo || freqs[k] >= hi) continue;
    if (!best || psd[k] > best.power) best = { freq: freqs[k], power: psd[k] };
  }
  return best?.freq ?? null;
}

// Resample an NN tachogram (beat times in seconds, NN in ms) onto an even 4 Hz
// grid using linear interpolation. Gaps longer than maxGapSec break the series.
function resampleTachogram(beats, startSec, endSec, sampleHz = 4, maxGapSec = 5) {
  const inRange = beats.filter((beat) => beat.timeSec >= startSec && beat.timeSec <= endSec);
  if (inRange.length < 8) return null;
  const count = Math.floor((endSec - startSec) * sampleHz);
  if (count < 16) return null;
  const series = new Float64Array(count);
  let beatIndex = 0;
  for (let i = 0; i < count; i++) {
    const t = startSec + i / sampleHz;
    while (beatIndex + 1 < inRange.length && inRange[beatIndex + 1].timeSec <= t) beatIndex++;
    const left = inRange[Math.min(beatIndex, inRange.length - 1)];
    const right = inRange[Math.min(beatIndex + 1, inRange.length - 1)];
    if (t <= left.timeSec) { series[i] = left.nnMs; continue; }
    if (t >= right.timeSec || right === left) { series[i] = right.nnMs; continue; }
    const span = right.timeSec - left.timeSec;
    if (span > maxGapSec) { series[i] = (left.nnMs + right.nnMs) / 2; continue; }
    const weight = (t - left.timeSec) / span;
    series[i] = left.nnMs * (1 - weight) + right.nnMs * weight;
  }
  return series;
}

// ───────────────────── Frequency-domain HRV ─────────────────────
// beats: [{timeSec, nnMs}] clean NN intervals. hrvWindows: [{startSec, endSec, hrvValid}].
// Computes band powers per valid window and a session summary (median across windows).
export function computeFrequencyDomain(beats, hrvWindows) {
  const sampleHz = 4;
  const perWindow = [];
  for (const window of hrvWindows) {
    if (!window.hrvValid) continue;
    const series = resampleTachogram(beats, window.startSec, window.endSec, sampleHz);
    if (!series) continue;
    const spectrum = welchPsd(series, sampleHz, 256);
    if (!spectrum) continue;
    const vlf = bandPower(spectrum.freqs, spectrum.psd, 0.0033, 0.04);
    const lf = bandPower(spectrum.freqs, spectrum.psd, 0.04, 0.15);
    const hf = bandPower(spectrum.freqs, spectrum.psd, 0.15, 0.4);
    const totalPower = vlf + lf + hf;
    const hfPeak = peakFrequency(spectrum.freqs, spectrum.psd, 0.15, 0.4);
    perWindow.push({
      startSec: window.startSec,
      endSec: window.endSec,
      centerSec: (window.startSec + window.endSec) / 2,
      vlf,
      lf,
      hf,
      totalPower,
      lfHfRatio: hf > 0 ? lf / hf : null,
      lfNu: lf + hf > 0 ? lf / (lf + hf) * 100 : null,
      hfNu: lf + hf > 0 ? hf / (lf + hf) * 100 : null,
      hfPeakHz: hfPeak,
      respirationBpm: Number.isFinite(hfPeak) ? hfPeak * 60 : null
    });
  }
  if (!perWindow.length) {
    return { available: false, windows: [], session: null };
  }
  const pick = (key) => perWindow.map((w) => w[key]).filter(Number.isFinite);
  const session = {
    vlf: median(pick("vlf")),
    lf: median(pick("lf")),
    hf: median(pick("hf")),
    totalPower: median(pick("totalPower")),
    lfHfRatio: median(pick("lfHfRatio")),
    lfNu: median(pick("lfNu")),
    hfNu: median(pick("hfNu")),
    respirationBpm: median(pick("respirationBpm")) || null,
    windowCount: perWindow.length
  };
  return { available: true, windows: perWindow, session };
}

// ───────────────────── Nonlinear HRV ─────────────────────
export function computeNonlinear(nnValuesMs) {
  if (nnValuesMs.length < 10) {
    return { available: false, sd1: null, sd2: null, sd1Sd2Ratio: null, stressIndex: null, triangularIndex: null, ellipseAreaMs2: null };
  }
  const diffs = [];
  for (let index = 1; index < nnValuesMs.length; index++) diffs.push(nnValuesMs[index] - nnValuesMs[index - 1]);
  const sdsd = standardDeviation(diffs);
  const sdnn = standardDeviation(nnValuesMs);
  const sd1 = Math.sqrt(Math.max(0, sdsd * sdsd / 2));
  const sd2 = Math.sqrt(Math.max(0, 2 * sdnn * sdnn - sd1 * sd1));

  // Baevsky stress index: bin NN into 50 ms bins.
  const binMs = 50;
  const bins = new Map();
  for (const nn of nnValuesMs) {
    const bin = Math.floor(nn / binMs) * binMs;
    bins.set(bin, (bins.get(bin) ?? 0) + 1);
  }
  let modalBin = null;
  let modalCount = 0;
  for (const [bin, count] of bins) {
    if (count > modalCount) { modalCount = count; modalBin = bin; }
  }
  const moSec = (modalBin + binMs / 2) / 1000;
  const amoPct = modalCount / nnValuesMs.length * 100;
  const mxDMnSec = Math.max(0.05, (percentile(nnValuesMs, 0.98) - percentile(nnValuesMs, 0.02)) / 1000);
  const stressIndex = moSec > 0 ? amoPct / (2 * moSec * mxDMnSec) : null;

  // HRV triangular index with standard 1/128 s (7.8125 ms) bins.
  const htiBinMs = 1000 / 128;
  const htiBins = new Map();
  for (const nn of nnValuesMs) {
    const bin = Math.round(nn / htiBinMs);
    htiBins.set(bin, (htiBins.get(bin) ?? 0) + 1);
  }
  const htiModal = Math.max(...htiBins.values());
  const triangularIndex = htiModal ? nnValuesMs.length / htiModal : null;

  return {
    available: true,
    sd1,
    sd2,
    sd1Sd2Ratio: sd2 > 0 ? sd1 / sd2 : null,
    stressIndex,
    triangularIndex,
    ellipseAreaMs2: Math.PI * sd1 * sd2
  };
}
