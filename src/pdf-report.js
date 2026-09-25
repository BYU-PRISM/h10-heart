import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { buildKeyFindings, buildReportHighlights, normalizeReportForRendering } from "./report-compat.js";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const COLORS = {
  ink: rgb(0.063, 0.141, 0.239),
  muted: rgb(0.376, 0.439, 0.529),
  cyan: rgb(0.055, 0.647, 0.776),
  teal: rgb(0.059, 0.463, 0.431),
  rose: rgb(0.957, 0.247, 0.369),
  violet: rgb(0.545, 0.361, 0.965),
  mint: rgb(0.063, 0.725, 0.506),
  gold: rgb(0.961, 0.62, 0.043),
  border: rgb(0.875, 0.91, 0.933),
  pale: rgb(0.965, 0.98, 0.989),
  white: rgb(1, 1, 1)
};

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "--";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours) return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function safeNumber(value, digits = 1, suffix = "") {
  return Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : "--";
}

function safeCount(value) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)).toLocaleString() : "--";
}

function humanize(value, fallback = "Not provided") {
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  return text
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDateTime(value) {
  if (!value) return "Not provided";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleString() : String(value);
}

function statisticValue(statistic, suffix = "") {
  if (!Number.isFinite(statistic?.mean)) return "--";
  const spread = Number.isFinite(statistic.sd) ? ` +/- ${statistic.sd.toFixed(1)}` : "";
  return `${statistic.mean.toFixed(1)}${spread}${suffix}`;
}

function statisticCount(statistic, requested = 5) {
  const count = statistic?.count ?? statistic?.n;
  return Number.isFinite(count) ? `${count}/${requested} valid` : "Valid count unavailable";
}

function sanitizeFileName(value) {
  return String(value || "Heart_Report")
    .trim()
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/^_+|_+$/g, "") || "Heart_Report";
}

function wrapText(text, font, size, maxWidth) {
  const paragraphs = String(text ?? "").split("\n");
  const lines = [];
  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push("");
      continue;
    }
    const words = paragraph.split(/\s+/);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function dataUrlBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export async function createHeartReportPdfFile(report, profile = {}, selectedMode = "rest", explorerRange = {}, chartEntries = [], assets = {}) {
  report = normalizeReportForRendering(report);
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  let logo = null;
  if (assets.logoBytes?.length) {
    try {
      logo = await pdfDoc.embedPng(assets.logoBytes);
    } catch { /* logo optional */ }
  }
  const pages = [];
  let page;
  let y;

  const addPage = (sectionLabel = "HEART ANALYSIS") => {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: COLORS.white });
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 74, width: PAGE_WIDTH, height: 74, color: COLORS.ink });
    if (logo) {
      const logoHeight = 58;
      const logoWidth = logoHeight * logo.width / logo.height;
      page.drawImage(logo, {
        x: PAGE_WIDTH - MARGIN_X - logoWidth,
        y: PAGE_HEIGHT - 74 + (74 - logoHeight) / 2,
        width: logoWidth,
        height: logoHeight
      });
    }
    page.drawText("IRSRI Heart Diagnostics", { x: MARGIN_X, y: PAGE_HEIGHT - 38, size: 19, font: bold, color: COLORS.white });
    page.drawText("Sport Research Institute  |  irsri.org", { x: MARGIN_X, y: PAGE_HEIGHT - 53, size: 8, font: regular, color: rgb(0.75, 0.82, 0.9) });
    page.drawText(sectionLabel, { x: MARGIN_X, y: PAGE_HEIGHT - 65, size: 8, font: bold, color: rgb(0.61, 0.86, 1) });
    y = PAGE_HEIGHT - 98;
    return page;
  };

  const ensureSpace = (height, sectionLabel) => {
    if (y - height < 44) addPage(sectionLabel);
  };

  const drawHeading = (text, options = {}) => {
    const size = options.size ?? 15;
    const before = options.before ?? 8;
    const after = options.after ?? 10;
    ensureSpace(size + before + after + 8, options.sectionLabel);
    y -= before;
    page.drawText(text, { x: MARGIN_X, y, size, font: bold, color: options.color ?? COLORS.ink });
    y -= size + after;
  };

  const drawParagraph = (text, options = {}) => {
    const size = options.size ?? 9.5;
    const lineHeight = options.lineHeight ?? size * 1.45;
    const lines = wrapText(text, options.font ?? regular, size, options.width ?? CONTENT_WIDTH);
    ensureSpace(lines.length * lineHeight + 4, options.sectionLabel);
    for (const line of lines) {
      page.drawText(line, {
        x: options.x ?? MARGIN_X,
        y,
        size,
        font: options.font ?? regular,
        color: options.color ?? COLORS.muted
      });
      y -= lineHeight;
    }
    y -= options.after ?? 4;
  };

  const drawMetricGrid = (metrics, options = {}) => {
    const columns = options.columns ?? 2;
    const gap = 10;
    const cellWidth = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
    const cellHeight = options.cellHeight ?? 48;
    const rows = Math.ceil(metrics.length / columns);
    ensureSpace(rows * (cellHeight + gap), options.sectionLabel);
    metrics.forEach((metric, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = MARGIN_X + column * (cellWidth + gap);
      const cellY = y - row * (cellHeight + gap) - cellHeight;
      page.drawRectangle({
        x,
        y: cellY,
        width: cellWidth,
        height: cellHeight,
        color: metric.tint ?? COLORS.pale,
        borderColor: COLORS.border,
        borderWidth: 0.6
      });
      page.drawText(metric.label.toUpperCase(), { x: x + 10, y: cellY + cellHeight - 15, size: 6.8, font: bold, color: COLORS.cyan });
      page.drawText(String(metric.value ?? "--"), { x: x + 10, y: cellY + 15, size: 12.5, font: bold, color: metric.color ?? COLORS.ink });
      if (metric.detail) {
        const detail = wrapText(metric.detail, regular, 6.5, cellWidth - 20)[0] ?? "";
        page.drawText(detail, { x: x + 10, y: cellY + 5, size: 6.5, font: regular, color: COLORS.muted });
      }
    });
    y -= rows * (cellHeight + gap);
  };

  const drawCompactTable = (columns, rows, options = {}) => {
    const headerHeight = options.headerHeight ?? 30;
    const rowHeight = options.rowHeight ?? 25;
    const after = options.after ?? 10;
    ensureSpace(headerHeight + rows.length * rowHeight + after, options.sectionLabel);

    let x = MARGIN_X;
    for (const column of columns) {
      const cellY = y - headerHeight;
      page.drawRectangle({
        x,
        y: cellY,
        width: column.width,
        height: headerHeight,
        color: COLORS.ink,
        borderColor: COLORS.white,
        borderWidth: 0.35
      });
      const lines = wrapText(column.label, bold, 6.2, column.width - 6).slice(0, 2);
      lines.forEach((line, lineIndex) => {
        const textWidth = bold.widthOfTextAtSize(line, 6.2);
        page.drawText(line, {
          x: x + Math.max(3, (column.width - textWidth) / 2),
          y: cellY + headerHeight - 10 - lineIndex * 8,
          size: 6.2,
          font: bold,
          color: COLORS.white
        });
      });
      x += column.width;
    }
    y -= headerHeight;

    rows.forEach((row, rowIndex) => {
      x = MARGIN_X;
      const cellY = y - rowHeight;
      const fill = rowIndex % 2 ? COLORS.white : COLORS.pale;
      columns.forEach((column) => {
        page.drawRectangle({
          x,
          y: cellY,
          width: column.width,
          height: rowHeight,
          color: fill,
          borderColor: COLORS.border,
          borderWidth: 0.45
        });
        const value = String(row[column.key] ?? "--");
        const lines = wrapText(value, column.bold ? bold : regular, 6.8, column.width - 6).slice(0, 2);
        lines.forEach((line, lineIndex) => {
          const cellFont = column.bold ? bold : regular;
          const textWidth = cellFont.widthOfTextAtSize(line, 6.8);
          page.drawText(line, {
            x: x + Math.max(3, (column.width - textWidth) / 2),
            y: cellY + rowHeight - 10 - lineIndex * 8,
            size: 6.8,
            font: cellFont,
            color: column.color ?? COLORS.ink
          });
        });
        x += column.width;
      });
      y -= rowHeight;
    });
    y -= after;
  };

  const drawChart = async (entry) => {
    let image;
    try {
      const dataUrl = entry.canvas.toDataURL("image/png");
      image = await pdfDoc.embedPng(dataUrlBytes(dataUrl));
    } catch {
      return;
    }
    const aspect = image.width / Math.max(1, image.height);
    let drawWidth = CONTENT_WIDTH;
    let drawHeight = drawWidth / aspect;
    if (drawHeight > 290) {
      drawHeight = 290;
      drawWidth = drawHeight * aspect;
    }
    const blockHeight = drawHeight + 34;
    ensureSpace(blockHeight, "DASHBOARD GRAPHS");
    page.drawText(entry.title, { x: MARGIN_X, y, size: 12, font: bold, color: COLORS.ink });
    y -= 18;
    const x = MARGIN_X + (CONTENT_WIDTH - drawWidth) / 2;
    page.drawRectangle({ x: x - 3, y: y - drawHeight - 3, width: drawWidth + 6, height: drawHeight + 6, color: COLORS.white, borderColor: COLORS.border, borderWidth: 0.8 });
    page.drawImage(image, { x, y: y - drawHeight, width: drawWidth, height: drawHeight });
    y -= drawHeight + 16;
  };

  const u = report?.universal ?? {};
  const w = report?.workout ?? {};
  const r = report?.rest ?? {};
  const rhythm = report?.rhythm ?? {};
  const classification = report?.classification ?? {};
  const methodology = report?.methodology ?? {};
  const mode = String(selectedMode || classification.selectedMode || classification.inferredMode || "rest").toLowerCase();
  const artifactEpisodes = Array.isArray(rhythm.artifactEpisodes) ? rhythm.artifactEpisodes : null;
  const excludedIntervals = rhythm.artifactExcludedIntervalCount ?? rhythm.qualityExcludedBeatCount;

  addPage("PRIVATE, BROWSER-GENERATED REPORT");
  page.drawText(`${mode.toUpperCase()} ANALYSIS`, { x: MARGIN_X, y, size: 24, font: bold, color: COLORS.ink });
  y -= 28;
  drawParagraph(
    `${profile.name || "Unknown athlete"} | Age ${profile.age ?? "unknown"} | ${formatDuration(u.durationSec)} recording | ${classification.override ? "User-selected" : Number.isFinite(classification.confidence) ? `${classification.confidence}% automatic` : "Recorded"} activity interpretation`,
    { size: 10.5, color: COLORS.teal, after: 10 }
  );
  if (classification.reason) drawParagraph(classification.reason, { after: 12 });

  drawHeading("Recording Context");
  const profileProtocol = profile.protocol && typeof profile.protocol === "object" ? profile.protocol : {};
  const recordingType = profile.recordingType || mode;
  const contextProtocolDetail = recordingType === "interval-test"
    ? `Dynamic 1-minute efforts`
    : "Context supplied with this upload.";
  drawMetricGrid([
    { label: "Athlete", value: profile.name || "Not provided", detail: `Age ${profile.age ?? "not provided"}` },
    { label: "Recording type", value: humanize(recordingType), detail: contextProtocolDetail },
  ]);
  drawParagraph(
    profile.symptoms
      ? `Reported symptoms: ${profile.symptoms}`
      : "Reported symptoms: none supplied with this recording.",
    { size: 8.5, color: profile.symptoms ? COLORS.rose : COLORS.muted, after: 8 }
  );

  drawHeading("At a Glance");
  drawMetricGrid(buildReportHighlights(report, mode).map((highlight) => ({
    label: highlight.label,
    value: highlight.value,
    detail: highlight.detail,
    color: highlight.tone === "warn" ? COLORS.gold : highlight.tone === "good" ? COLORS.mint : COLORS.ink
  })), { cellHeight: 56 });
  drawParagraph(
    "This is a descriptive session summary. Compare repeated recordings collected under similar conditions; rhythm findings remain screening candidates, not diagnoses.",
    { size: 8.5, color: COLORS.teal, after: 8 }
  );

  const keyFindings = buildKeyFindings(report, mode);
  if (keyFindings.length) {
    ensureSpace(120, "KEY FINDINGS");
    drawHeading("Key Findings", { sectionLabel: "KEY FINDINGS" });
    const severityColor = { action: COLORS.rose, watch: COLORS.gold, good: COLORS.mint, info: COLORS.cyan };
    for (const finding of keyFindings) {
      const titleText = `${finding.severity.toUpperCase()}  ${finding.title}`;
      const detailLines = wrapText(finding.detail, regular, 8.5, CONTENT_WIDTH - 16);
      ensureSpace(16 + detailLines.length * 12 + 8, "KEY FINDINGS");
      page.drawCircle({ x: MARGIN_X + 3, y: y + 3, size: 3, color: severityColor[finding.severity] ?? COLORS.cyan });
      page.drawText(titleText, { x: MARGIN_X + 12, y, size: 9.5, font: bold, color: COLORS.ink });
      y -= 13;
      for (const line of detailLines) {
        page.drawText(line, { x: MARGIN_X + 12, y, size: 8.5, font: regular, color: COLORS.muted });
        y -= 12;
      }
      y -= 5;
    }
  }

  drawHeading("Quality Snapshot");
  drawMetricGrid([
    { label: "Signal quality", value: `${u.qualityScore}/100`, detail: u.qualityLevel, color: u.qualityScore >= 75 ? COLORS.mint : COLORS.gold },
    { label: "Review priority", value: rhythm.reviewPriority, detail: "Screening candidates only", color: rhythm.reviewPriority === "Low" ? COLORS.mint : COLORS.gold },
    { label: "Clean beats", value: `${u.cleanBeatPercentage.toFixed(1)}%`, detail: `${u.detectedBeats.toLocaleString()} detected peaks` },
    { label: "R-peak confidence", value: `${u.rPeakConfidence.toFixed(1)}%`, detail: "Dual-detector agreement" }
  ]);

  ensureSpace(165, "ANALYSIS USABILITY");
  drawHeading("Analysis Usability", { sectionLabel: "ANALYSIS USABILITY" });
  drawMetricGrid([
    { label: "Heart-rate usability", value: safeNumber(u.hrUsablePercentage, 1, "%"), detail: u.qualityGrades?.hr ?? "Not available in this report version", color: Number.isFinite(u.hrUsablePercentage) && u.hrUsablePercentage >= 75 ? COLORS.mint : COLORS.gold },
    { label: "HRV usability", value: safeNumber(u.hrvUsablePercentage, 1, "%"), detail: u.qualityGrades?.hrv ?? "Not available in this report version", color: Number.isFinite(u.hrvUsablePercentage) && u.hrvUsablePercentage >= 75 ? COLORS.mint : COLORS.gold },
    { label: "Morphology usability", value: safeNumber(u.morphologyUsablePercentage, 1, "%"), detail: u.qualityGrades?.morphology ?? "Not available in this report version", color: Number.isFinite(u.morphologyUsablePercentage) && u.morphologyUsablePercentage >= 75 ? COLORS.mint : COLORS.gold },
    { label: "Clean beat coverage", value: safeNumber(u.cleanBeatPercentage, 1, "%"), detail: "Used after signal-quality exclusions" }
  ]);

  ensureSpace(220, "SIGNAL QUALITY EXCLUSIONS");
  drawHeading("Artifact and Contact Exclusions", { sectionLabel: "SIGNAL QUALITY EXCLUSIONS" });
  drawMetricGrid([
    { label: "Low-quality episodes", value: artifactEpisodes ? artifactEpisodes.length.toLocaleString() : "--", detail: "Consolidated signal periods" },
    { label: "Beat intervals excluded", value: safeCount(excludedIntervals), detail: "Removed before rhythm screening" },
    { label: "Displacement episodes", value: safeCount(u.displacementEpisodeCount), detail: "Likely contact shifts or flatline" },
    { label: "Candidate burden", value: safeNumber(rhythm.candidateBurdenPer1000, 2, " / 1,000"), detail: "Per usable beat intervals" },
    { label: "Flatline duration", value: formatDuration(u.flatlineDurationSec), detail: "Likely poor or lost contact" },
    { label: "Repeated-extreme samples", value: safeNumber(u.clippedSamplePercentage, 2, "%"), detail: "Clipping / repeated extrema" }
  ]);
  drawParagraph(
    "Low-quality and likely contact-displacement periods are treated as signal exclusions, not automatically as abnormal beats. Usability grades describe what this recording can support; they are not health grades.",
    { size: 8.5, color: COLORS.teal, after: 8 }
  );

  drawHeading("Recording Integrity");
  drawMetricGrid([
    { label: "Duration", value: formatDuration(u.durationSec) },
    { label: "Sample rate", value: `${u.sampleRate.toFixed(2)} Hz` },
    { label: "Total samples", value: u.totalSamples.toLocaleString() },
    { label: "Missing / gaps", value: `${u.missingSamples.toLocaleString()} / ${u.gapCount}` }
  ]);

  drawParagraph(
    "This report summarizes a single-lead ECG recording using browser-based signal processing. Rhythm findings are candidate screening events, not diagnoses.",
    { size: 9, color: COLORS.rose, font: bold, after: 8 }
  );

  if (mode === "workout" || mode === "mixed") {
    ensureSpace(270, "WORKOUT SUMMARY");
    drawHeading("Workout Summary", { sectionLabel: "WORKOUT SUMMARY" });
    drawMetricGrid([
      { label: "Average / median HR", value: `${w.hr.avg.toFixed(0)} / ${w.hr.median.toFixed(0)} bpm` },
      { label: "Clean min / max HR", value: `${w.hr.min.toFixed(0)} / ${w.hr.max.toFixed(0)} bpm` },
      { label: "P5 / P25 / P75 / P95", value: `${w.hr.percentiles.p5.toFixed(0)} / ${w.hr.percentiles.p25.toFixed(0)} / ${w.hr.percentiles.p75.toFixed(0)} / ${w.hr.percentiles.p95.toFixed(0)}` },
      { label: "Trend", value: `${w.trendBpmPerHour >= 0 ? "+" : ""}${w.trendBpmPerHour.toFixed(1)} bpm/hr` },
      { label: "Max ramp", value: `${w.rampBpmPerMinute.toFixed(1)} bpm/min` },
      { label: "Workout load", value: w.loadScore.toFixed(1), detail: "Zone-weighted minutes" },
      { label: "Intervals", value: String(w.intervalDetection.count), detail: w.intervalDetection.applicable ? "Detected" : "Not confidently detected" },
      { label: "HR drift proxy", value: w.drift.eligible ? `${w.drift.valuePct.toFixed(1)}%` : "--", detail: w.drift.reason }
    ]);
    ensureSpace(150, "WORKOUT SUMMARY");
    drawHeading("Recovery and Interval Detail", { size: 12, sectionLabel: "WORKOUT SUMMARY" });
    drawMetricGrid([
      { label: "Recovery 30 sec", value: safeNumber(w.recovery.values[30]?.drop, 1, " bpm") },
      { label: "Recovery 60 sec", value: safeNumber(w.recovery.values[60]?.drop, 1, " bpm") },
      { label: "Recovery 120 sec", value: safeNumber(w.recovery.values[120]?.drop, 1, " bpm") },
      { label: "Spike / drop flags", value: String(w.spikeDropFlags.length) }
    ]);
    drawParagraph(w.drift.reason, { size: 8.5 });

    const intervalTest = w.intervalTest;
    if (intervalTest?.enabled) {
      const protocol = intervalTest.protocol ?? {};
      const baseline = intervalTest.baseline ?? {};
      const repetitions = Array.isArray(intervalTest.repetitions) ? intervalTest.repetitions : [];
      const statistics = intervalTest.statistics ?? {};
      const requestedRepetitions = Number.isFinite(protocol.repetitions) ? protocol.repetitions : 5;
      const baselineHr = intervalTest.baselineHr ?? baseline.hr;
      const baselineDetail = [
        humanize(baseline.source, "Source unavailable"),
        Number.isFinite(baseline.qualityPct) ? `${baseline.qualityPct.toFixed(0)}% signal quality` : null
      ].filter(Boolean).join("; ");
      const protocolSummary = `${requestedRepetitions} x ${formatDuration(protocol.effortSec ?? 60)}`;
      const firstEffortDetail = `Dynamic effort detection`;
      const gateValue = Number.isFinite(protocol.baselineToleranceBpm) ? `+/- ${protocol.baselineToleranceBpm.toFixed(0)} bpm` : "--";
      const gateDetail = `${safeNumber(protocol.baselineHoldSec, 0, " sec sustained")}; max recovery ${formatDuration(protocol.maximumRecoverySec)}`;
      const incompleteCount = intervalTest.incompleteRecoveryCount
        ?? repetitions.filter((repetition) => repetition.recoveryComplete === false).length;

      ensureSpace(175, "FIVE-REPEAT INTERVAL TEST");
      drawHeading("Standardized Five-repeat Test", { sectionLabel: "FIVE-REPEAT INTERVAL TEST" });
      drawMetricGrid([
        { label: "Pre-test baseline", value: safeNumber(baselineHr, 0, " bpm"), detail: baselineDetail },
        { label: "Protocol", value: protocolSummary, detail: firstEffortDetail },
        { label: "Baseline return gate", value: gateValue, detail: gateDetail },
        { label: "Analysis status", value: humanize(intervalTest.status, "Unavailable"), detail: `${repetitions.length}/${requestedRepetitions} segmented; ${incompleteCount} incomplete recovery` }
      ], { sectionLabel: "FIVE-REPEAT INTERVAL TEST", cellHeight: 52 });

      const intervalSummary = typeof intervalTest.summary === "string"
        ? intervalTest.summary
        : intervalTest.summary?.text ?? intervalTest.message;
      if (intervalSummary) drawParagraph(intervalSummary, { size: 8.5, color: COLORS.teal, sectionLabel: "FIVE-REPEAT INTERVAL TEST" });
      if (intervalTest.stopReason) drawParagraph(`Segmentation note: ${intervalTest.stopReason}`, { size: 8.2, color: COLORS.gold, sectionLabel: "FIVE-REPEAT INTERVAL TEST" });

      ensureSpace(205, "FIVE-REPEAT INTERVAL TEST");
      drawHeading("Repeat-by-repeat Response and Recovery", { size: 12, sectionLabel: "FIVE-REPEAT INTERVAL TEST" });
      const repeatRows = Array.from({ length: 5 }, (_, index) => {
        const repetition = repetitions[index];
        if (!repetition) {
          return { rep: String(index + 1), pre: "--", end: "--", rise: "--", ramp: "--", hrr60: "--", recovery: "--", baselineReturn: "Not segmented", quality: "--" };
        }
        const qualities = [repetition.effortQualityPct, repetition.recoveryQualityPct].filter(Number.isFinite);
        const quality = qualities.length
          ? `${qualities.map((value) => value.toFixed(0)).join(" / ")}%`
          : "--";
        const returnTime = repetition.returnToBaselineSec ?? repetition.baselineReturn?.returnTimeSec;
        const returned = repetition.recoveryComplete ?? repetition.baselineReturn?.returned;
        return {
          rep: String(repetition.index ?? index + 1),
          pre: safeNumber(repetition.preHr, 0),
          end: safeNumber(repetition.endHr, 0),
          rise: safeNumber(repetition.riseBpm ?? repetition.hrRise, 1),
          ramp: safeNumber(repetition.rampRateBpmPerMin, 1),
          hrr60: safeNumber(repetition.hrr60, 1),
          recovery: safeNumber(repetition.recoveryRateBpmPerMin, 1),
          baselineReturn: Number.isFinite(returnTime) ? `${returnTime.toFixed(0)} sec` : returned === false ? "Incomplete" : "--",
          quality
        };
      });
      drawCompactTable([
        { key: "rep", label: "Rep", width: 26, bold: true },
        { key: "pre", label: "Pre HR", width: 48 },
        { key: "end", label: "End HR", width: 48 },
        { key: "rise", label: "HR rise", width: 48 },
        { key: "ramp", label: "Ramp bpm/min", width: 65 },
        { key: "hrr60", label: "HRR60", width: 55 },
        { key: "recovery", label: "Recovery bpm/min", width: 68 },
        { key: "baselineReturn", label: "Baseline return", width: 74 },
        { key: "quality", label: "Effort / recovery quality", width: 84 }
      ], repeatRows, { sectionLabel: "FIVE-REPEAT INTERVAL TEST" });

      drawHeading("Five-repeat Statistics", { size: 12, sectionLabel: "FIVE-REPEAT INTERVAL TEST" });
      drawMetricGrid([
        { label: "Ramp rate mean +/- SD", value: statisticValue(statistics.rampRateBpmPerMin, " bpm/min"), detail: statisticCount(statistics.rampRateBpmPerMin, requestedRepetitions) },
        { label: "Recovery rate mean +/- SD", value: statisticValue(statistics.recoveryRateBpmPerMin, " bpm/min"), detail: statisticCount(statistics.recoveryRateBpmPerMin, requestedRepetitions) },
        { label: "HRR60 mean +/- SD", value: statisticValue(statistics.hrr60, " bpm"), detail: statisticCount(statistics.hrr60, requestedRepetitions) }
      ], { columns: 3, cellHeight: 54, sectionLabel: "FIVE-REPEAT INTERVAL TEST" });
      drawParagraph(
        "These ECG-only response and recovery measures describe this recorded protocol. They do not measure pace, power, running economy, diagnose a condition, or clear an athlete for participation.",
        { size: 8.5, color: COLORS.rose, font: bold, sectionLabel: "FIVE-REPEAT INTERVAL TEST" }
      );
    }
  }

  if (mode === "sleep" || mode === "rest" || mode === "mixed") {
    ensureSpace(390, "SLEEP / REST SUMMARY");
    drawHeading("Sleep / Rest Summary", { sectionLabel: "SLEEP / REST SUMMARY" });
    drawMetricGrid([
      { label: "Average / median HR", value: `${r.hr.avg.toFixed(0)} / ${r.hr.median.toFixed(0)} bpm` },
      { label: "Clean min / max HR", value: `${r.hr.min.toFixed(0)} / ${r.hr.max.toFixed(0)} bpm` },
      { label: "Resting HR estimate", value: `${r.restingHr.toFixed(0)} bpm` },
      { label: "Stable 5 / 10 min HR", value: `${r.lowest5MinHr.toFixed(0)} / ${Number.isFinite(r.lowest10MinHr) ? r.lowest10MinHr.toFixed(0) : "--"} bpm` },
      { label: "RMSSD / lnRMSSD", value: `${r.hrv.rmssd.toFixed(1)} / ${r.hrv.lnRMSSD.toFixed(2)}` },
      { label: "SDNN / pNN50", value: `${r.hrv.sdnn.toFixed(1)} ms / ${r.hrv.pNN50.toFixed(1)}%` },
      { label: "HRV-valid duration", value: formatDuration(r.hrvValidDurationSec) },
      { label: "HR stability", value: `${r.stabilityScore}/100` },
      { label: "Recovery vs session", value: `${r.recoveryScore}/100` },
      { label: "Suppressed HRV", value: r.suppressedHrvFlag ? "Flagged" : "Not flagged" },
      { label: "Elevated resting HR", value: r.elevatedRestingHrFlag ? "Flagged" : "Not flagged" },
      { label: "High sleeping HR", value: String(r.highSleepingEpisodes.length) }
    ]);
    drawParagraph(r.baseline.note, { size: 8.5, color: COLORS.teal });
  }

  const breathing = report.respiration;
  ensureSpace(210, "BREATHING ESTIMATE");
  drawHeading("ECG-Derived Breathing Estimate", { sectionLabel: "BREATHING ESTIMATE" });
  drawMetricGrid([
    { label: "Median breathing", value: safeNumber(breathing.summary.medianBpm, 1, " breaths/min") },
    { label: "P10 / P90 (not accuracy)", value: `${safeNumber(breathing.summary.p10Bpm, 1)} / ${safeNumber(breathing.summary.p90Bpm, 1)}` },
    { label: "Accepted windows", value: `${breathing.summary.acceptedWindows}/${breathing.summary.totalWindows} (${breathing.summary.coveragePct.toFixed(0)}%)` },
    { label: "Timing + shape agree", value: String(breathing.summary.agreementWindows) }
  ]);
  drawParagraph(breathing.timingNote, { size: 8.5 });
  drawParagraph(breathing.caveat, { size: 8.5, color: COLORS.teal });
  if (breathing.buckets.length) drawCompactTable([
    { key: "time", label: "Elapsed time", width: 156, bold: true },
    { key: "median", label: "Est. breaths/min", width: 120 },
    { key: "range", label: "P10-P90", width: 120 },
    { key: "coverage", label: "Accepted windows", width: 120 }
  ], breathing.buckets.map((b) => ({
    time: `${formatDuration(b.startSec)}-${formatDuration(b.endSec)}`,
    median: safeNumber(b.medianBpm, 1), range: `${safeNumber(b.p10Bpm, 1)}-${safeNumber(b.p90Bpm, 1)}`,
    coverage: `${b.acceptedWindows}/${b.totalWindows} (${b.coveragePct.toFixed(0)}%)`
  })), { sectionLabel: "BREATHING ESTIMATE", rowHeight: 20 });

  // ── Statistics summary tables ──
  const hrv = report.hrv ?? {};
  const hrvTime = hrv.time ?? r.hrv ?? {};
  const hrvFreq = hrv.frequency;
  const hrvNl = hrv.nonlinear ?? {};
  const statColumns = [
    { key: "metric", label: "Metric", width: 168, bold: true },
    { key: "value", label: "Value", width: 118 },
    { key: "note", label: "Reference / note", width: 230 }
  ];
  const statRow = (metric, value, note = "") => ({ metric, value, note });

  ensureSpace(220, "STATISTICS SUMMARY");
  drawHeading("Statistics Summary", { sectionLabel: "STATISTICS SUMMARY" });
  drawParagraph("Computed from artifact-screened beats only. References are published short-term healthy-adult spans, not clinical thresholds.", { size: 8.5, color: COLORS.teal });

  drawHeading("HRV - Time Domain", { size: 12, sectionLabel: "STATISTICS SUMMARY" });
  drawCompactTable(statColumns, [
    statRow("Mean NN", safeNumber(hrvTime.meanNN, 0, " ms")),
    statRow("SDNN", safeNumber(hrvTime.sdnn, 1, " ms"), "~32-93 ms short-term span"),
    statRow("RMSSD / lnRMSSD", `${safeNumber(hrvTime.rmssd, 1)} ms / ${safeNumber(hrvTime.lnRMSSD, 2)}`, "~19-75 ms short-term span"),
    statRow("pNN50 / pNN20", `${safeNumber(hrvTime.pNN50, 1)}% / ${safeNumber(hrvTime.pNN20, 1)}%`),
    statRow("CVNN", safeNumber(hrvTime.cvNN, 1, "%"), "SDNN as percent of mean NN"),
    statRow("SDANN / SDNN index", `${safeNumber(hrvTime.sdann, 1)} / ${safeNumber(hrvTime.sdnnIndex, 1)} ms`, "Across valid 5-minute windows")
  ], { sectionLabel: "STATISTICS SUMMARY", rowHeight: 20 });

  drawHeading("HRV - Frequency Domain", { size: 12, sectionLabel: "STATISTICS SUMMARY" });
  drawCompactTable(statColumns, hrvFreq ? [
    statRow("Total power", safeNumber(hrvFreq.totalPower, 0, " ms2"), "VLF+LF+HF, median across windows"),
    statRow("VLF / LF / HF", `${safeNumber(hrvFreq.vlf, 0)} / ${safeNumber(hrvFreq.lf, 0)} / ${safeNumber(hrvFreq.hf, 0)} ms2`),
    statRow("LF/HF ratio", safeNumber(hrvFreq.lfHfRatio, 2), "Posture- and breathing-dependent"),
    statRow("LF nu / HF nu", `${safeNumber(hrvFreq.lfNu, 0)} / ${safeNumber(hrvFreq.hfNu, 0)}%`),
    statRow("HF peak (legacy proxy)", safeNumber(hrvFreq.respirationBpm, 1, " /min"), "9-24/min band; see breathing estimate"),
    statRow("Valid windows", String(hrvFreq.windowCount ?? "--"), "Welch PSD of 4 Hz resampled NN series")
  ] : [statRow("Frequency analysis", "Unavailable", "Requires valid 5-minute HRV windows")], { sectionLabel: "STATISTICS SUMMARY", rowHeight: 20 });

  drawHeading("HRV - Nonlinear", { size: 12, sectionLabel: "STATISTICS SUMMARY" });
  drawCompactTable(statColumns, hrvNl.available ? [
    statRow("Poincare SD1 / SD2", `${safeNumber(hrvNl.sd1, 1)} / ${safeNumber(hrvNl.sd2, 1)} ms`, "Short-term vs long-term variability"),
    statRow("SD1/SD2 ratio", safeNumber(hrvNl.sd1Sd2Ratio, 2)),
    statRow("Baevsky stress index", safeNumber(hrvNl.stressIndex, 1), "~50-150 typical at rest; higher under load"),
    statRow("Triangular index", safeNumber(hrvNl.triangularIndex, 1), "24-h references ~15-50")
  ] : [statRow("Nonlinear analysis", "Unavailable", "Requires at least 10 clean NN intervals")], { sectionLabel: "STATISTICS SUMMARY", rowHeight: 20 });

  if ((mode === "sleep" || mode === "rest" || mode === "mixed") && Array.isArray(r.hourly) && r.hourly.filter((hour) => hour.usableWindowCount > 0).length >= 2) {
    ensureSpace(120, "STATISTICS SUMMARY");
    drawHeading("Hour-by-Hour Summary", { size: 12, sectionLabel: "STATISTICS SUMMARY" });
    drawCompactTable([
      { key: "hour", label: "Hour", width: 66, bold: true },
      { key: "avgHr", label: "Avg HR", width: 75 },
      { key: "minHr", label: "Min HR", width: 75 },
      { key: "rmssd", label: "RMSSD ms", width: 75 },
      { key: "lfhf", label: "LF/HF", width: 75 },
      { key: "resp", label: "Est. breaths/min", width: 75 },
      { key: "coverage", label: "Good ECG data", width: 75 }
    ], r.hourly.map((hour) => ({
      hour: `${formatDuration(hour.startSec)}-${formatDuration(hour.endSec)}`,
      avgHr: safeNumber(hour.avgHr, 0),
      minHr: safeNumber(hour.minHr, 0),
      rmssd: safeNumber(hour.rmssd, 0),
      lfhf: safeNumber(hour.lfHfRatio, 1),
      resp: safeNumber(hour.respirationBpm, 0),
      coverage: safeNumber(hour.cleanCoveragePct, 0, "%")
    })), { sectionLabel: "STATISTICS SUMMARY", rowHeight: 18 });
    if (r.stageProxy?.available) {
      drawParagraph(
        `Cardiac sleep-stage proxy: deep-like ${r.stageProxy.minutes.deep.toFixed(0)} min, light-like ${r.stageProxy.minutes.light.toFixed(0)} min, REM-like ${r.stageProxy.minutes.rem.toFixed(0)} min, wake-like ${r.stageProxy.minutes.wake.toFixed(0)} min. ${r.stageProxy.caveat}`,
        { size: 8.5, color: COLORS.teal, sectionLabel: "STATISTICS SUMMARY" }
      );
    }
    if (r.nocturnalDip?.available) {
      drawParagraph(
        `Overnight HR dip: ${safeNumber(r.nocturnalDip.dipPct, 1, "%")} (first-hour ${safeNumber(r.nocturnalDip.referenceHr, 0)} bpm to stable low ${safeNumber(r.nocturnalDip.lowestStableHr, 0)} bpm).`,
        { size: 8.5, sectionLabel: "STATISTICS SUMMARY" }
      );
    }
  }

  if ((mode === "workout" || mode === "mixed") && w.trimp) {
    drawHeading("Workout Load & Response", { size: 12, sectionLabel: "STATISTICS SUMMARY" });
    drawCompactTable(statColumns, [
      statRow("TRIMP (Banister)", safeNumber(w.trimp.score, 0), "Internal training impulse; compare with your own sessions"),
      statRow("Edwards load", safeNumber(w.loadScore, 0), "Zone-weighted minutes"),
      statRow("HR recovery 60 s", safeNumber(w.recovery?.values?.[60]?.drop, 0, " bpm"), ">12 bpm in the first minute is the commonly cited favorable threshold"),
      statRow("Recovery time-constant", safeNumber(w.recovery?.tauSec, 0, " s"), "Mono-exponential fit over 5 min post-peak")
    ], { sectionLabel: "STATISTICS SUMMARY", rowHeight: 20 });
  }

  ensureSpace(255, "RHYTHM SCREENING");
  drawHeading("Rhythm Screening", { sectionLabel: "RHYTHM SCREENING" });
  const verification = rhythm.verification ?? {};
  drawMetricGrid([
    { label: "Rhythm regularity", value: `${rhythm.regularityScore}/100` },
    { label: "Review priority", value: rhythm.reviewPriority },
    { label: "Verified ectopic candidates", value: `${rhythm.ectopicCount} (${rhythm.ectopicBurdenPct.toFixed(2)}%)`, detail: `of ${rhythm.ectopicCandidateCount ?? rhythm.ectopicCount} raw candidates` },
    { label: "Verified pause candidates", value: `${rhythm.pauseCount} (${rhythm.pauseBurdenPct.toFixed(2)}%)`, detail: `of ${rhythm.pauseCandidateCount ?? rhythm.pauseCount} raw candidates` },
    { label: "Rejected as sensor artifact", value: String((verification.artifactEctopicCount ?? 0) + (verification.artifactPauseCount ?? 0)), detail: "Template-verified against median beat shape" },
    { label: "Irregular episodes", value: String(rhythm.irregularEpisodeCount) },
    { label: "Distinct-QRS premature beats", value: String(verification.distinctQrsCount ?? 0), detail: "Beat shape differs from template" },
    { label: "Bradycardia candidates", value: String(rhythm.bradycardiaEpisodeCount) }
  ]);
  drawParagraph(rhythm.disclaimer, { font: bold, color: COLORS.rose, size: 9 });

  ensureSpace(150, "METHODOLOGY");
  drawHeading("Methodology and Eligibility", { sectionLabel: "METHODOLOGY" });
  if (methodology.rPeakConfidence) drawParagraph(`R-peak confidence: ${methodology.rPeakConfidence}`);
  if (methodology.hrvStandard) drawParagraph(`HRV: ${methodology.hrvStandard}`);
  if (methodology.signalCleansing) drawParagraph(`Signal cleansing: ${methodology.signalCleansing}`);
  if (methodology.intervalProtocol && (mode === "workout" || mode === "mixed")) drawParagraph(`Interval protocol: ${methodology.intervalProtocol}`);
  if (methodology.activityCaveat) drawParagraph(`Activity: ${methodology.activityCaveat}`);
  if (methodology.driftCaveat) drawParagraph(`Drift: ${methodology.driftCaveat}`);
  drawParagraph(`Explorer snapshot: ${formatDuration(explorerRange.startSec ?? 0)} to ${formatDuration(explorerRange.endSec ?? Math.min(30, u.durationSec))}.`);

  if (chartEntries.length) {
    ensureSpace(120, "DASHBOARD GRAPHS");
    drawHeading("Dashboard Graphs", { size: 22, sectionLabel: "DASHBOARD GRAPHS", after: 12 });
    drawParagraph("These images are captured from the same canvases shown in the dashboard, including the active ECG Explorer range.", { after: 14 });
    for (const entry of chartEntries) await drawChart(entry);
  }

  pages.forEach((reportPage, index) => {
    reportPage.drawLine({
      start: { x: MARGIN_X, y: 28 },
      end: { x: PAGE_WIDTH - MARGIN_X, y: 28 },
      thickness: 0.6,
      color: COLORS.border
    });
    reportPage.drawText(`IRSRI Heart Diagnostics - Sport Research Institute | Page ${index + 1} of ${pages.length}`, {
      x: MARGIN_X,
      y: 14,
      size: 7,
      font: regular,
      color: COLORS.muted
    });
    const generated = new Date().toLocaleString();
    const width = regular.widthOfTextAtSize(generated, 7);
    reportPage.drawText(generated, {
      x: PAGE_WIDTH - MARGIN_X - width,
      y: 14,
      size: 7,
      font: regular,
      color: COLORS.muted
    });
  });

  return pdfDoc.save();
}

export function downloadHeartReport(pdfBytes, name = "") {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `IRSRI_${sanitizeFileName(name)}_Heart_Report.pdf`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
