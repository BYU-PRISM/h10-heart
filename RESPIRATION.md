# Breathing-rate estimation

The Breathing section adds an experimental ECG-derived respiration (EDR) timeline to the existing analysis dashboard. CSV and ZIP recordings are processed locally in the analysis worker. The deployment contains code and assets only; recordings and generated research outputs are not included in `dist/`.

## Using the app

1. Upload the ECG CSV or ZIP as usual. Choose **Sleep** or **Workout** in the recording context before analysis.
2. Open **Breathing** to see estimated breaths/min, heart rate on the same time axis, accepted-window coverage, and hourly or five-minute summaries.
3. Hover over the chart for a window's estimate or rejection reason. Click it to inspect that time in the ECG explorer.
4. Download the complete breathing CSV, including unavailable windows and individual surrogate estimates. The PDF and text export also include breathing summaries and coverage.

The activity interpretation selector changes presentation after analysis. It does not recompute the breathing window or frequency band. Change the upload's recording context and analyze again to change those settings.

## Method

`src/respiration.js` uses the existing R-peak detector, clean NN intervals, and ECG quality masks. NN intervals are successive **heartbeats**, not breaths.

- **Timing:** respiratory sinus arrhythmia in clean NN intervals.
- **Morphology:** peak-to-peak QRS amplitude and absolute QRS area relative to a local baseline. The two shape features count as one physiological family.
- **Windows:** 64 s / 30 s step for rest and sleep; 32 s / 10 s step for workout, interval tests and mixed activity. Centers label retrospective windows. These are not instantaneous or live causal estimates; upstream ECG processing also uses retrospective information.
- **Search band:** 6–72 breaths/min at rest; 12–72 during exercise, following the 0.2–1.2 Hz band used in the running study below. Both bands are capped at 45% of local median HR because features are sampled once per beat. This cap cannot detect or eliminate aliasing from true respiratory frequencies above it. Breathing below 12/min is outside the exercise model.
- **Processing:** linear resampling at 4 Hz only where beat features bracket the window, linear detrending, robust outlier clipping, Hann taper, and zero-padded FFT. Zero-padding interpolates the spectrum; it does not increase independent frequency resolution. Nominal bin spacing is 60/window duration: 0.94 or 1.88 breaths/min.
- **Fusion:** normalized timing and morphology spectra are multiplied to find a common peak. Each family must retain at least 25% of its own maximum spectral power at that peak. Strong conflicting peaks suppress the estimate. Strong single-family estimates can be retained with a separate label; timing alone is not accepted during exercise or below 9/min at rest because nonrespiratory HR fluctuations can dominate.
- **Abstention:** insufficient clean beats, recording gaps over 0.25 s, long interpolation holes, weak/unresolved peaks and conflicting surrogates produce `null`, never zero breathing. QRS features require morphology-usable ECG epochs. The CSV preserves rejection reasons.

Spectral concentration, prominence and agreement are heuristic signal-support measures, **not calibrated confidence, accuracy or physiological validation**. Coherent motion can affect both families. The estimator has no accelerometer/cadence input. It does not identify apnea, tidal volume, minute ventilation, ventilatory thresholds, overtraining, or safe training adjustments.

Coverage means accepted complete windows / all complete windows. Windows overlap; counts do not represent independent breaths or independent accuracy observations. The first/last half-window is outside the plotted centers. Recording edges are not extrapolated. Median and P10/P90 describe accepted estimates, which may not represent the entire session. P10/P90 is a distribution, not an uncertainty interval. Hourly coverage for EDR differs from ECG/HRV usability.

Older HRV output retains `hrv.frequency.respirationBpm` as a **legacy HF peak proxy**, restricted to approximately 9–24/min. It is labeled separately in the UI, PDF and text export. `report.respiration` is the new authoritative breathing output; `rest.respirationBpm` and hourly breathing summaries use it. Older reports require reanalysis and do not silently reuse the HF peak as the new estimate.

## Reproduce the local examples

```sh
npm ci
npm run build
npm run verify
npm run examples:respiration
npm run examples:render
npm start
```

Open `http://127.0.0.1:8765/output/respiration/index.html` for the comparison, or `/` for the full app. The local server binds to loopback only. Example analysis uses the bundled de-identified recordings in `examples/`: Subject A's seven-file overnight sleep and Subject B's workout. Ages are not supplied and are not used by the breathing estimator. Existing age-dependent HR-zone estimates elsewhere in the app are outside this comparison.

Browser QA is in `scripts/verify-respiration-ui.mjs`; it requires Playwright and an installed Chrome, plus the running local server. `PLAYWRIGHT_MODULE` can point to a Playwright module outside this project. It unpacks both bundled example recordings, uploads them to the browser worker, blocks external browser requests, checks chart/table/export/CSV/explorer behavior, downloads a PDF, and captures desktop/mobile output.

## Verification and remaining research

`scripts/verify-respiration.mjs` synthesizes continuous ECG before sampling at 130 Hz. Known breathing rates of 8, 15, 30, 42 and 66/min are recovered within 1.5 breaths/min with over 75% coverage. It also checks inverted ECG, morphology with no RSA, flatline, absent respiratory modulation, conflicting families, missing intervals, short recordings, CSV missing values, legacy reports, and full CSV ingestion/R-peak detection. A deterministic aperiodic-noise stress case still produces about 10% accepted windows, demonstrating that signal support is not proof of respiration. These synthetic checks are engineering verification, not estimates of field accuracy or sensitivity/specificity.

The existing ECG/HRV/interval and PDF tests also pass. Results from the actual example files are feasibility demonstrations without respiratory ground truth. No physiological accuracy claim is justified for either person.

Research assistant follow-up:

- [ ] Collect synchronized reference respiration during sleep, easy running, steady workloads, intervals and recovery; include cadence, posture and motion labels.
- [ ] Compare timing-only, QRS amplitude, QRS area, current fusion and an independent reference estimator at the same coverage and latency.
- [ ] Investigate half/double-rate ambiguity, running cadence contamination, sampling-phase effects at 130 Hz and weak RSA at high effort.
- [ ] Evaluate subject-held-out MAE, bias/limits of agreement, percentile errors, transition delay, accepted duration and false accepted windows. Report missing estimates rather than evaluating accepted windows alone.
- [ ] Calibrate support and abstention thresholds on development participants; reserve both participant and session holdouts for final testing. Do not tune thresholds to make these two examples appear plausible.
- [ ] Test accelerometer-informed rejection and a streaming pipeline with no future samples or full-session quality statistics before considering mid-workout feedback.

## Sources

- [PhysioNet: ECG-Derived Respiration](https://archive.physionet.org/physiotools/edr/) — timing and ECG morphology as respiratory surrogates.
- [Indirect Estimation of Breathing Rate from Heart Rate Monitoring System during Running](https://pmc.ncbi.nlm.nih.gov/articles/PMC8402314/) — running-specific processing, broad respiratory rates, and the 0.2–1.2 Hz exercise band.
- [Spectral fusion-based breathing frequency estimation; experiment on activities of daily living](https://pmc.ncbi.nlm.nih.gov/articles/PMC6062885/) — complementary timing and morphology spectra under ambulatory disturbances.
- [Data Fusion for Improved Respiration Rate Estimation](https://pmc.ncbi.nlm.nih.gov/articles/PMC2929127/) — quality-aware combination of ECG respiratory surrogates and limits of individual methods.

The implementation is a transparent prototype informed by these methods, not a reproduced or clinically validated implementation of a published algorithm.
