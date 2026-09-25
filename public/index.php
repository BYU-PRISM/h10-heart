<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>IRSRI Heart Diagnostics | Sport Research Institute</title>
    <link rel="stylesheet" href="./styles.css?v=20260915-resp1" />
  </head>
  <body>
    <div class="page-shell">
      <header class="hero">
        <div class="hero-copy">
          <div class="hero-brand">
            <a class="hero-logo-link" href="https://irsri.org" target="_blank" rel="noopener">
              <img src="./irsri.png" alt="Sports Research Institute" class="hero-logo" />
            </a>
            <span class="eyebrow">IRSRI · Single-Lead ECG Diagnostics</span>
          </div>
          <h1>Heart Diagnostics Platform</h1>
          <p>
            Upload raw Polar H10 ECG (130 Hz CSV or ZIP) for artifact-screened rhythm review, heart-rate response and recovery, full HRV statistics, and sleep diagnostics. All processing stays in your browser.
          </p>
          <div class="hero-badges">
            <span>Polar H10 · 130 Hz</span>
            <span>Workout &amp; Sleep diagnostics</span>
            <span>Artifact-verified events</span>
            <span>Branded PDF reports</span>
          </div>
        </div>

        <div class="hero-panel">
          <div class="hero-overlay"></div>
          <div class="inventory-card">
            <span class="panel-kicker">Dashboard Inventory</span>
            <div class="inventory-grid">
              <article><strong>Universal Quality</strong><p>Data quality score, gaps, and noise.</p></article>
              <article><strong>Workout Review</strong><p>Heart-rate response, strain, and recovery.</p></article>
              <article><strong>Sleep &amp; Recovery</strong><p>Resting HR, HRV baseline, and sleep quality.</p></article>
              <article><strong>Rhythm Alerts</strong><p>Irregularity flags, pauses, and ectopic burden.</p></article>
            </div>
          </div>
        </div>
      </header>

      <nav class="sticky-nav">
        <div class="nav-content">
          <button id="nav-toggle" class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <ul id="nav-links" class="nav-links">
            <li><a href="#summary-section">Summary</a></li>
            <li><a href="#universal-section">Quality</a></li>
            <li><a href="#duration-section">Report</a></li>
            <li><a href="#respiration-section">Breathing</a></li>
            <li><a href="#stats-section">Statistics</a></li>
            <li><a href="#visuals-section">Visualizations</a></li>
            <li><a href="#explorer-section">ECG Explorer</a></li>
            <li><a href="#alerts-section">Alerts</a></li>
            <li><a href="#export-section">AI Export</a></li>
          </ul>
        </div>
      </nav>

      <section class="control-panel runner-setup-panel">
        <div class="panel-header">
          <span class="panel-kicker">Heart Setup</span>
          <h2>Build your analysis profile</h2>
          <p class="muted">Only ECG data is required. Add recording context when available so the report can separate rest / sleep analysis from workout and standardized interval-test analysis.</p>
        </div>
        <form id="analysis-form" class="upload-form">
          <div id="upload-mode-file">
            <label class="field field-file">
              <span>Raw ECG CSV Data (ZIP allowed)</span>
              <input id="csv-file" type="file" accept=".csv,.zip" multiple />
            </label>
          </div>
          <details class="setup-details" open>
            <summary>Profile details <span class="optional-hint">(age required)</span></summary>
            <div class="field-grid">
              <label class="field"><span>Name <span class="optional-hint">(optional)</span></span><input id="name" type="text" placeholder="John Doe" autocomplete="name" /></label>
              <label class="field"><span>Age <span class="optional-hint">(required)</span></span><input id="age" type="number" min="10" max="90" placeholder="34" required /></label>
            </div>
          </details>
          <details class="setup-details" open>
            <summary>Recording context <span class="optional-hint">(recommended)</span></summary>
            <div class="field-grid recording-context-grid">
              <label class="field">
                <span>Recording type</span>
                <select id="recording-type">
                  <option value="auto">Auto-detect</option>
                  <option value="rest">Rest</option>
                  <option value="sleep">Sleep / overnight</option>
                  <option value="workout">Workout</option>
                  <option value="interval-test">Interval test (3+ repeats)</option>
                </select>
              </label>
              <label class="field field-wide"><span>Symptoms or relevant notes <span class="optional-hint">(optional)</span></span><textarea id="symptoms" rows="3" placeholder="Describe symptoms, illness, medication changes, or anything that may affect interpretation."></textarea></label>
            </div>
          </details>

          <section class="test-guide" aria-labelledby="exercise-test-guide-title">
            <div class="test-guide-header">
              <div>
                <span class="panel-kicker">Standardized Exercise Test</span>
                <h3 id="exercise-test-guide-title">Dynamic one-minute efforts</h3>
              </div>
              <span class="protocol-fixed">1 minute × 3+</span>
            </div>
            <p class="test-guide-intro">Record one continuous ECG file from the start of the warm-up until your heart rate has returned to baseline after the final effort. Keep the effort, terrain, equipment, and recovery posture as consistent as possible between tests.</p>
            <ol class="test-steps">
              <li><strong>Warm up for 10 minutes.</strong> Continue recording and settle into a repeatable starting condition before the first effort.</li>
              <li><strong>Complete one hard but controlled effort for exactly 1 minute.</strong> The test is for comparison, not an all-out finish.</li>
              <li><strong>Recover until heart rate returns to baseline.</strong> Start the next effort only after HR is within the baseline tolerance for the full hold time.</li>
              <li><strong>Repeat until 3 or more efforts are complete.</strong> Continue recording through the final recovery, then upload the CSV or ZIP once.</li>
            </ol>
            <p class="protocol-help">Each effort is fixed at 1 minute and the protocol dynamically infers intervals. Recovery length varies: wait for baseline rather than starting on a fixed countdown.</p>
            <aside class="test-safety-note" role="note" aria-label="Exercise test safety and medical limitation">
              <strong>Safety and scope:</strong> Do not start or continue this exercise test if you feel unwell or develop chest pain, faintness, unusual shortness of breath, or other concerning symptoms. Seek appropriate medical care. This single-lead ECG dashboard is informational, is not a diagnosis, and does not clear an athlete for exercise or competition.
            </aside>
          </section>
          <div class="actions">
            <button type="submit" class="primary-button">Analyze upload</button>
          </div>
          <div id="analysis-progress" class="analysis-progress hidden" aria-live="polite">
            <div class="analysis-progress-header">
              <span id="analysis-progress-label">Preparing upload...</span>
              <strong id="analysis-progress-percent">0%</strong>
            </div>
            <div class="analysis-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
              <span id="analysis-progress-bar"></span>
            </div>
          </div>
          <div id="pdf-report-actions" class="report-actions hidden">
            <button id="download-pdf-report" type="button" class="secondary-button">Download PDF report</button>
          </div>
          <p id="pdf-report-status" class="copy-status" role="status"></p>
        </form>
      </section>

      <main class="dashboard-main">
        <section class="dashboard">
          <div id="empty-state" class="empty-state">
            <span class="panel-kicker">Ready</span>
            <h2>Upload your ECG data</h2>
            <p>Choose a CSV file or ZIP archive containing timestamped ECG samples. RR intervals are derived from the ECG; no second data source is required.</p>
          </div>

          <div id="dashboard-content" class="dashboard-content hidden">

            <!-- SUMMARY -->
            <section id="summary-section" class="summary-strip scroll-mt">
              <div class="summary-copy">
                <span class="panel-kicker">Actionable Summary</span>
                <h2 id="overall-quality-score">Data Quality: --</h2>
                <div id="alert-banner" class="alert-banner-container"></div>
              </div>
              <div class="mode-control">
                <label for="activity-mode-select">Activity interpretation</label>
                <select id="activity-mode-select">
                  <option value="auto">Auto</option>
                  <option value="sleep">Sleep</option>
                  <option value="rest">Rest</option>
                  <option value="workout">Workout</option>
                  <option value="mixed">Mixed</option>
                </select>
                <span id="activity-confidence" class="confidence-badge">Awaiting analysis</span>
                <p id="activity-reason" class="muted"></p>
              </div>
              <div id="actionable-summary" class="actionable-summary" aria-live="polite"></div>
              <div class="key-findings-block">
                <div class="key-findings-header">
                  <span class="panel-kicker">Key Findings</span>
                  <h3>What matters most in this recording</h3>
                </div>
                <div id="key-findings" class="key-findings" aria-live="polite"></div>
              </div>
              <p class="summary-context-note">Use these highlights to orient the review, then inspect the quality, workout or rest, statistics, and rhythm sections below. Values describe this recording and should be compared with sessions collected under similar conditions.</p>
            </section>

            <!-- UNIVERSAL -->
            <section id="universal-section" class="surface-card scroll-mt">
              <div class="section-header">
                <div><span class="panel-kicker">Universal Metrics</span><h2>File Quality and Recording Info</h2></div>
              </div>
              <div id="universal-cards" class="compact-grid"></div>
              <div id="advanced-quality" class="compact-grid" style="margin-top: 10px;"></div>
              <div id="quality-grade-cards" class="quality-grade-cards" aria-label="Analysis usability grades"></div>
              <div class="chart-row">
                <div class="chart-panel chart-panel-light">
                  <canvas id="quality-gauge-chart" role="img" aria-label="Signal quality score and component chart">Signal quality score and component chart. A text summary is provided in the quality cards above.</canvas>
                </div>
                <div class="chart-panel chart-panel-light">
                  <canvas id="integrity-chart" role="img" aria-label="Recording integrity timeline">Recording integrity timeline showing gaps in the uploaded ECG. A text summary is provided in the quality cards above.</canvas>
                </div>
              </div>
              <div class="chart-panel chart-panel-light chart-single quality-timeline-panel">
                <canvas id="quality-timeline-chart" role="img" aria-label="Signal usability over time for heart rate, HRV, and morphology">Signal usability timeline for heart-rate, HRV, and morphology analysis. Equivalent grades and totals are provided in the quality cards above.</canvas>
              </div>
            </section>

            <!-- DURATION REPORT -->
            <section id="duration-section" class="surface-card scroll-mt">
              <div class="section-header">
                <div>
                  <span class="panel-kicker" id="report-type-kicker">Duration Report</span>
                  <h2 id="report-type-title">Report Details</h2>
                </div>
                <p id="report-type-desc" class="muted"></p>
              </div>
              <section id="workout-mode-section" class="mode-section">
                <div class="mode-section-heading">
                  <div><span class="panel-kicker">Workout Mode</span><h3>Effort, intervals, load, and recovery</h3></div>
                  <span id="workout-eligibility" class="confidence-badge"></span>
                </div>
                <div id="workout-cards" class="compact-grid"></div>
                <div id="workout-detail-cards" class="compact-grid compact-grid-secondary"></div>
                <section id="interval-test-panel" class="interval-test-panel" aria-labelledby="interval-test-title">
                  <div class="interval-test-heading">
                    <div>
                      <span class="panel-kicker">Interval Test</span>
                      <h4 id="interval-test-title">One-minute response and baseline-gated recovery</h4>
                    </div>
                    <div id="interval-protocol-summary" class="interval-protocol-summary" role="status">Waiting for interval-test analysis.</div>
                  </div>
                  <div id="interval-stat-cards" class="interval-stat-cards" aria-label="Statistics across five repeats"></div>
                  <div class="interval-table-wrap" tabindex="0" role="region" aria-label="Per-repeat interval statistics table">
                    <table class="interval-repeat-table">
                      <caption>Heart-rate response and recovery for each one-minute effort. Summary statistics are shown after the five repeats when enough clean ECG is available.</caption>
                      <thead>
                        <tr>
                          <th scope="col">Repeat</th>
                          <th scope="col">Pre HR</th>
                          <th scope="col">HR at 30s</th>
                          <th scope="col">End HR</th>
                          <th scope="col">HR rise</th>
                          <th scope="col">Ramp rate</th>
                          <th scope="col">HRR60</th>
                          <th scope="col">Recovery rate</th>
                          <th scope="col">Time to baseline</th>
                          <th scope="col">Quality</th>
                        </tr>
                      </thead>
                      <tbody id="interval-repeat-table-body"></tbody>
                    </table>
                  </div>
                  <div class="chart-row interval-chart-row">
                    <div class="chart-panel chart-panel-light">
                      <canvas id="interval-response-chart" role="img" aria-label="Five aligned one-minute heart-rate response curves">Aligned heart-rate response curves for five one-minute efforts. The per-repeat values are available in the adjacent table.</canvas>
                    </div>
                    <div class="chart-panel chart-panel-light">
                      <canvas id="interval-recovery-chart" role="img" aria-label="Five aligned heart-rate recovery curves to baseline">Aligned recovery curves for five repeats, continuing until baseline return. The per-repeat values are available in the adjacent table.</canvas>
                    </div>
                  </div>
                </section>
                <div class="chart-panel chart-panel-light chart-single">
                  <canvas id="annotated-hr-chart" role="img" aria-label="Heart-rate timeline with workout intervals, peaks, and review events">Heart-rate timeline with workout intervals, peaks, and review events. Key values are provided in the workout cards and interval table.</canvas>
                </div>
                <div class="chart-row">
                  <div class="chart-panel chart-panel-light">
                    <canvas id="zone-chart" role="img" aria-label="Time in estimated heart-rate zones">Time in estimated heart-rate zones. Zone durations are also provided in the workout metric cards.</canvas>
                  </div>
                  <div class="chart-panel chart-panel-light">
                    <canvas id="recovery-chart" role="img" aria-label="Post-peak heart-rate recovery">Post-peak heart-rate recovery. Recovery values are also provided in the workout metric cards.</canvas>
                  </div>
                </div>
                <div class="chart-panel chart-panel-light chart-single">
                  <canvas id="interval-chart" role="img" aria-label="Detected interval peak and recovery comparison">Detected interval peak and recovery comparison. Equivalent values are provided in the workout metric cards.</canvas>
                </div>
              </section>

              <section id="rest-mode-section" class="mode-section">
                <div class="mode-section-heading">
                  <div><span class="panel-kicker">Sleep / Rest Mode</span><h3>Recovery, stability, and HRV</h3></div>
                  <span class="confidence-badge">Within-recording baseline</span>
                </div>
                <div id="rest-cards" class="compact-grid"></div>
                <div id="rest-detail-cards" class="compact-grid compact-grid-secondary"></div>
                <div class="chart-row">
                  <div class="chart-panel chart-panel-light">
                    <canvas id="rest-hr-chart" role="img" aria-label="Rest or sleep heart-rate trend">Rest or sleep heart-rate trend. Key values are provided in the rest metric cards.</canvas>
                  </div>
                  <div class="chart-panel chart-panel-light">
                    <canvas id="rest-hrv-chart" role="img" aria-label="Rest or sleep HRV trend">Rest or sleep HRV trend. Key values are provided in the rest metric cards.</canvas>
                  </div>
                </div>
                <div class="chart-panel chart-panel-light chart-single">
                  <canvas id="poincare-chart" role="img" aria-label="Poincare plot of clean normal-to-normal intervals">Poincare plot of clean normal-to-normal intervals. HRV values are also provided in the rest metric cards.</canvas>
                </div>
                <div id="hypnogram-panel" class="chart-panel chart-panel-light chart-single hidden">
                  <canvas id="hypnogram-chart" role="img" aria-label="Cardiac sleep-stage proxy timeline">Cardiac sleep-stage proxy timeline derived from HR and HRV. This is not polysomnography.</canvas>
                </div>
                <div id="hourly-table-wrap" class="stats-table-wrap hidden" tabindex="0" role="region" aria-label="Hourly sleep summary table"></div>
              </section>
            </section>

            <section id="respiration-section" class="surface-card scroll-mt">
              <div class="section-header">
                <div><span class="panel-kicker">ECG-derived respiration · experimental</span><h2>Breathing Through the Session</h2></div>
                <button id="download-respiration-csv" type="button" class="secondary-button">Download breathing CSV</button>
              </div>
              <div id="respiration-cards" class="metric-grid"></div>
              <p id="respiration-timing" class="muted"></p>
              <div class="respiration-legend"><span class="resp-agreement">● Timing + shape agree</span><span class="resp-single">● Single signal family</span><span>▧ Gray / gaps: unavailable</span></div>
              <div class="chart-panel chart-panel-light chart-single respiration-chart-panel">
                <canvas id="respiration-chart" role="img" aria-label="Estimated breathing rate and heart rate across the recording. Gaps indicate unavailable estimates; values are in the table and CSV.">Estimated breathing rate and heart rate. Use the summary table or download the complete window-level CSV.</canvas>
              </div>
              <p id="respiration-note" class="muted"></p>
              <div id="respiration-table" class="stats-table-wrap" tabindex="0" role="region" aria-label="Breathing rate summary by elapsed time"></div>
              <details class="respiration-details"><summary>Method and unavailable windows</summary><p id="respiration-method" class="muted"></p><p id="respiration-rejections" class="muted"></p><p class="muted">Based on <a href="https://archive.physionet.org/physiotools/edr/" target="_blank" rel="noopener noreferrer">ECG-derived respiration methods</a>. These recordings have no independent breathing reference for accuracy testing.</p></details>
            </section>

            <!-- STATISTICS DASHBOARD -->
            <section id="stats-section" class="surface-card scroll-mt">
              <div class="section-header">
                <div><span class="panel-kicker">Statistics Dashboard</span><h2>Session Statistics</h2></div>
                <p class="muted">Computed from artifact-screened beats only. Reference ranges are published short-term healthy-adult spans and app bands, not clinical thresholds.</p>
              </div>
              <div id="stats-tables" class="stats-tables"></div>
              <div id="lfhf-panel" class="chart-panel chart-panel-light chart-single hidden">
                <canvas id="lfhf-chart" role="img" aria-label="LF and HF spectral power trend across valid five-minute windows">LF and HF spectral power trend across valid five-minute windows. Session medians are provided in the statistics tables.</canvas>
              </div>
            </section>

            <!-- VISUALIZATIONS: Overview + Distributions -->
            <section id="visuals-section" class="surface-card scroll-mt">
              <div class="section-header">
                <div><span class="panel-kicker">Visualizations</span><h2>Overview &amp; Distributions</h2></div>
              </div>

              <!-- Full-duration overview -->
              <div class="chart-row">
                <div class="chart-panel chart-panel-light">
                  <canvas id="hr-overview-chart" role="img" aria-label="Heart-rate trend across the full recording">Heart-rate trend across the full recording. Key values are provided in the mode-specific metric cards.</canvas>
                </div>
                <div class="chart-panel chart-panel-light">
                  <canvas id="rr-overview-chart" role="img" aria-label="RR-interval trend across the full recording">RR-interval trend across the full recording. Rhythm and quality totals are provided in the metric cards.</canvas>
                </div>
              </div>

              <!-- Distributions row -->
              <div class="chart-row">
                <div class="chart-panel chart-panel-light">
                  <canvas id="hr-histogram" role="img" aria-label="Heart-rate distribution">Heart-rate distribution. Summary percentiles are provided in the metric cards.</canvas>
                </div>
                <div class="chart-panel chart-panel-light">
                  <canvas id="rr-histogram" role="img" aria-label="RR-interval distribution">RR-interval distribution. Summary variability values are provided in the metric cards.</canvas>
                </div>
              </div>

              <!-- Beat overlay -->
              <div class="chart-panel chart-panel-light chart-single">
                <canvas id="beat-chart" role="img" aria-label="ECG beat-shape overlay and distribution">ECG beat-shape overlay and distribution. Morphology usability is summarized in the quality grades.</canvas>
              </div>

              <!-- HRV Trend Chart -->
              <div class="chart-panel chart-panel-light chart-single">
                <canvas id="hrv-trend-chart" role="img" aria-label="HRV trend across valid five-minute windows">HRV trend across valid five-minute windows. HRV values and valid duration are provided in the rest metric cards.</canvas>
              </div>
            </section>

            <!-- ECG EXPLORER -->
            <section id="explorer-section" class="surface-card scroll-mt">
              <div class="section-header">
                <div><span class="panel-kicker">ECG Explorer</span><h2>Raw Signal &amp; Spectrogram</h2></div>
              </div>

              <div class="explorer-navigation">
                <div>
                  <span class="navigation-label">Window length</span>
                  <div id="zoom-presets" class="zoom-presets" style="display:none;"></div>
                </div>
                <div class="selection-readout" aria-live="polite">
                  <span id="range-label-window" class="range-label-window">Selected window: 30s</span>
                  <strong><span id="range-label-start">0:00</span> to <span id="range-label-end">0:30</span></strong>
                </div>
              </div>

              <div class="range-slider-wrapper">
                <div id="range-slider" class="range-slider" aria-label="Recording overview">
                  <div class="range-track"></div>
                  <div id="range-bar" class="range-bar" aria-hidden="true"></div>
                  <input id="range-position" class="range-position" type="range" min="0" max="0" value="0" step="0.5" aria-label="Selected window start position" />
                </div>
                <div class="range-labels">
                  <span>Recording start</span>
                  <span id="range-total-label">Recording end</span>
                </div>
              </div>

              <div class="timeline-controls">
                <button id="timeline-start-btn" type="button" class="timeline-button">Start</button>
                <button id="timeline-prev-window-btn" type="button" class="timeline-button">Previous window</button>
                <button id="timeline-back-5-btn" type="button" class="timeline-button">-5s</button>
                <label class="timeline-start-field">
                  <span>Window start</span>
                  <input id="timeline-start-input" type="text" value="0:00" inputmode="numeric" aria-label="Window start time" />
                </label>
                <button id="timeline-forward-5-btn" type="button" class="timeline-button">+5s</button>
                <button id="timeline-next-window-btn" type="button" class="timeline-button">Next window</button>
                <button id="timeline-end-btn" type="button" class="timeline-button">End</button>
                <button id="reset-zoom-btn" type="button" class="timeline-button timeline-reset-button">Reset to first 30s</button>
              </div>
              <p class="timeline-help">Drag or click the overview to reposition the selected window, or drag a region directly on the ECG trace (touch supported) to zoom into it. Use the five-second buttons or enter an exact start time such as 1:23:45. Clicking any timeline chart or an event's Inspect button also jumps here. At 30&nbsp;s or less a clinical grid appears (major 1&nbsp;s / minor 0.2&nbsp;s); at 15&nbsp;s or less each beat is annotated with its RR interval.</p>

              <!-- Raw ECG -->
              <div class="chart-panel chart-panel-light chart-single chart-tall">
                <canvas id="ecg-explorer-chart" role="img" aria-label="Raw ECG signal in the selected time window">Raw ECG signal in the selected time window. Use the timeline controls to change the displayed range.</canvas>
              </div>

              <!-- Spectrogram -->
              <div class="chart-panel chart-panel-light chart-single chart-tall">
                <canvas id="cwt-chart" role="img" aria-label="ECG spectrogram in the selected time window">ECG spectrogram in the selected time window. Use the timeline controls to change the displayed range.</canvas>
              </div>
            </section>

            <!-- ALERTS -->
            <section id="alerts-section" class="surface-card scroll-mt">
              <div class="section-header">
                <div><span class="panel-kicker">Rhythm &amp; Alerts</span><h2>Irregularities and Flags</h2></div>
              </div>
              <div id="alerts-cards" class="compact-grid"></div>
              <div id="artifact-summary" class="artifact-summary" role="status" aria-live="polite"></div>
              <div class="chart-panel chart-panel-light chart-single">
                <canvas id="rhythm-timeline-chart" role="img" aria-label="Timeline of rhythm-screening candidates and artifact exclusions">Timeline of rhythm-screening candidates and artifact exclusions. Counts and review priority are provided in the alert cards.</canvas>
              </div>
              <div class="event-table-header">
                <h3>Event review queue</h3>
                <p class="muted">Every screening candidate with its artifact-verification result. Select <strong>Inspect</strong> to open the raw ECG waveform at that moment.</p>
              </div>
              <div id="event-table-wrap" class="stats-table-wrap" tabindex="0" role="region" aria-label="Rhythm event review table"></div>
              <p class="medical-disclaimer">Screening candidates only. This browser analysis is not a diagnosis and does not replace clinician review.</p>
            </section>

            <section id="export-section" class="surface-card scroll-mt">
              <div class="section-header">
                <div>
                  <span class="panel-kicker">Heart Analysis Export</span>
                  <h2>Full summary for AI synthesis</h2>
                </div>
                <div class="export-actions">
                  <button id="copy-heart-export" type="button" class="secondary-button">Copy full heart export</button>
                  <button id="share-heart-export" type="button" class="secondary-button">Share full export</button>
                  <a
                    class="secondary-link-button"
                    href="https://www.roadrunners.club/training/chat"
                    target="_blank"
                    rel="noopener"
                  >
                    <img src="./irsri.png" alt="" aria-hidden="true" class="button-icon" />
                    <span>AI Coach Chat</span>
                  </a>
                </div>
              </div>
              <textarea id="heart-export-text" class="export-textarea" readonly></textarea>
              <p id="heart-export-status" class="copy-status" role="status"></p>
            </section>
          </div>
        </section>
      </main>

      <footer class="site-footer" aria-label="Additional resources">
        <a class="footer-card-link" href="https://irsri.org" target="_blank" rel="noopener">
          <span class="metric-label">Research partner</span>
          <strong>Sports Research Institute</strong>
          <span>https://irsri.org</span>
        </a>
      </footer>
    </div>
    <?php
      // Optional site-wide widget from the host web root. The app is fully
      // functional without it, so a standalone deployment can just omit it.
      $ariaWidget = $_SERVER['DOCUMENT_ROOT'] . '/aria/aria.php';
      if (is_readable($ariaWidget)) include $ariaWidget;
    ?>
    <script type="module" src="./app.js?v=20260915-resp1"></script>
  </body>
</html>
