# h10-heart

Browser-only analysis of Polar H10 single-lead ECG recordings.

You upload a raw 130 Hz ECG export — one CSV or a ZIP of them — and get back
rhythm screening, heart-rate response and recovery, full HRV statistics, sleep
diagnostics, an experimental breathing estimate, an ECG explorer, and a printable
PDF report. **Nothing is uploaded anywhere.** The page has no upload endpoint; all
parsing and analysis runs in a Web Worker in your own browser, and the deployed
site is static files.

This is research and training software. It is not a medical device and it does
not diagnose anything.

## Quick start

```bash
npm ci
npm run build     # bundles src/ into public/app.js + public/analysis-worker.js
npm start         # http://127.0.0.1:8765 (loopback only)
```

Then upload one of the bundled recordings from `examples/` — gunzip it first, or
drag the whole `subject-a` folder's sleep parts in at once.

## Repository layout

| Path | What it is |
| --- | --- |
| `src/` | All analysis and UI source. This is the code you edit. |
| `public/` | The deployable web root: `index.php`, `styles.css`, the logo, plus the two bundles the build writes here. |
| `dist/` | Build output — a byte copy of `public/`. Never edit; never committed. |
| `scripts/` | Verification suites, the local server, and research-output generators. |
| `examples/` | De-identified example recordings. See [`examples/README.md`](examples/README.md). |
| `tools/` | The de-identification tool used to build `examples/`. |
| `RESPIRATION.md` | Method and validation notes for the breathing estimator. |

### Source modules

| Module | Responsibility |
| --- | --- |
| `src/ecg-analysis.js` | The analysis engine: ingestion, signal conditioning, R-peak detection, rhythm screening, the report object |
| `src/ecg-ingestion.js` | CSV/ZIP parsing, schema sniffing, timestamp units, chunk de-duplication |
| `src/signal-quality.js` | Per-window quality masks and usability grades |
| `src/hrv-metrics.js` | Time-domain, frequency-domain (Welch) and nonlinear (Poincaré) HRV |
| `src/respiration.js` | ECG-derived breathing estimation |
| `src/interval-test.js` | Structured interval-test metrics |
| `src/report-compat.js` | Key findings and highlights, shared by dashboard, PDF and AI export |
| `src/pdf-report.js` | The printable PDF |
| `src/main.js` | Dashboard UI |
| `src/analysis-worker.js` | Worker entry point; keeps analysis off the UI thread |

## Verification

```bash
npm run verify              # analysis engine + PDF + breathing estimator
npm run verify:ui           # browser QA; needs Playwright and a running `npm start`
```

`scripts/verify-samples.mjs` runs synthetic recordings with known properties
alongside the real bundled ones, and checks the report fields the dashboard and
PDF depend on. `scripts/verify-respiration.mjs` recovers known synthetic
breathing rates. Keep both passing.

To regenerate the breathing research outputs under `output/`:

```bash
npm run examples:respiration
npm run examples:render
```

## Data format

The Polar Sensor Logger CSV, at ~129.9 Hz:

```
time,ecg,hr,rr,marker
1625889698322598494,0.179,52,1156
```

`time` is epoch nanoseconds, `ecg` is millivolts, and `hr`/`rr` are the strap's
own values on the rows where it reported them. The analysis derives its own R
peaks and R-R intervals from `ecg`, so an ECG-only file with two columns is
enough. `examples/README.md` has the details.

## Deploying

`npm run build` produces `dist/`. Copy its contents to the web root:

```
index.php  styles.css  irsri.png  app.js  analysis-worker.js
```

`index.php` is PHP only so the host site can inject a shared widget from
`$_SERVER['DOCUMENT_ROOT'] . '/aria/aria.php'`; the include is guarded, so on a
host without it the page works unchanged. If you have no PHP at all, rename it
to `index.html` and delete the `<?php ... ?>` block — everything else is static.

Serve it over HTTPS. There is no server-side component and no database.

## Privacy

Recordings never leave the browser, and no recording of a real person belongs in
this repository except the de-identified examples. `.gitignore` blocks loose
`*.csv` outside `examples/`, and the mapping from subject names to source files
lives in `tools/sources.local.json`, which is not committed.

## License

Not yet licensed for reuse. Add a `LICENSE` file before making the repository
public.
