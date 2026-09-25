import { respirationCsv } from "./respiration.js";
import { renderRespiration, drawRespirationChart } from "./respiration-ui.js";
import { createHeartReportPdfFile, downloadHeartReport } from './pdf-report.js';
import { buildKeyFindings, buildReportHighlights, normalizeReportForRendering } from './report-compat.js';

// ───────────────────── DOM refs ─────────────────────
const form = document.getElementById("analysis-form");
const csvInput = document.getElementById("csv-file");
const nameInput = document.getElementById("name");
const ageInput = document.getElementById("age");
const recordingTypeInput = document.getElementById("recording-type");
const symptomsInput = document.getElementById("symptoms");
const progressDiv = document.getElementById("analysis-progress");
const progressLabel = document.getElementById("analysis-progress-label");
const progressPercent = document.getElementById("analysis-progress-percent");
const progressBar = document.getElementById("analysis-progress-bar");
const dashboardContent = document.getElementById("dashboard-content");
const emptyState = document.getElementById("empty-state");

let currentReport = null;
let currentProfile = null;
let globalWorker = null;
let totalDuration = 0;
let selectedMode = "auto";
let currentExplorerRange = { startSec: 0, endSec: 30 };
const ANALYSIS_WORKER_VERSION = "20260915-resp1";

const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");
navToggle?.addEventListener("click", () => {
  const open = navLinks?.classList.toggle("open") ?? false;
  navToggle.setAttribute("aria-expanded", String(open));
});
navLinks?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  navLinks.classList.remove("open");
  navToggle?.setAttribute("aria-expanded", "false");
}));

function clamp(value, lo, hi) {
  return Math.max(lo, Math.min(hi, value));
}

function optionalNumber(input) {
  const value = Number(input?.value);
  return input?.value !== "" && Number.isFinite(value) ? value : null;
}

// ───────────────────── Timeline Navigator ─────────────────────
class TimelineNavigator {
  constructor(container, onChange) {
    this.container = container;
    this.onChange = onChange;
    this.bar = container.querySelector('.range-bar');
    this.positionInput = document.getElementById('range-position');
    this.startInput = document.getElementById('timeline-start-input');
    this.totalLabel = document.getElementById('range-total-label');

    this.totalDuration = 0;
    this.startSec = 0;
    this.endSec = 30;
    this.minWindow = 5;

    this._bindEvents();
    this.resizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => this._render())
      : null;
    this.resizeObserver?.observe(container);
  }

  init(duration) {
    this.totalDuration = Math.max(0, Number(duration) || 0);
    this.totalLabel.textContent = `Recording end: ${fmtTime(this.totalDuration)}`;
    this.setRange(0, Math.min(30, this.totalDuration));
  }

  _render() {
    if (!this.totalDuration) return;
    const windowSec = this.endSec - this.startSec;
    const maxStart = Math.max(0, this.totalDuration - windowSec);
    this.positionInput.min = "0";
    this.positionInput.max = String(maxStart);
    this.positionInput.step = windowSec <= 30 ? "0.5" : "1";
    this.positionInput.value = String(clamp(this.startSec, 0, maxStart));
    this.positionInput.disabled = maxStart === 0;
    this.startInput.value = fmtTimeInput(this.startSec);

    const trackWidth = this.container.clientWidth;
    if (!trackWidth) return;
    const actualWidth = windowSec / this.totalDuration * trackWidth;
    const visualWidth = clamp(Math.max(actualWidth, 12), 12, trackWidth);
    const center = (this.startSec + windowSec / 2) / this.totalDuration * trackWidth;
    const left = clamp(center - visualWidth / 2, 0, trackWidth - visualWidth);
    this.bar.style.left = `${left}px`;
    this.bar.style.width = `${visualWidth}px`;
    this.bar.classList.toggle("range-bar-magnified", visualWidth > actualWidth + 0.5);
  }

  _fireChange() {
    if (this.onChange) this.onChange(this.startSec, this.endSec);
  }

  setRange(startSec, endSec, fire = true) {
    if (!this.totalDuration) return;
    const minimum = Math.min(this.minWindow, this.totalDuration);
    const requestedWindow = Number(endSec) - Number(startSec);
    const windowSec = clamp(Number.isFinite(requestedWindow) ? requestedWindow : 30, minimum, this.totalDuration);
    const maxStart = Math.max(0, this.totalDuration - windowSec);
    this.startSec = clamp(Number(startSec) || 0, 0, maxStart);
    this.endSec = this.startSec + windowSec;
    this._render();
    if (fire) this._fireChange();
  }

  setWindowLength(windowSec) {
    const currentCenter = (this.startSec + this.endSec) / 2;
    const nextWindow = clamp(Number(windowSec) || 30, Math.min(this.minWindow, this.totalDuration), this.totalDuration);
    this.setRange(currentCenter - nextWindow / 2, currentCenter + nextWindow / 2);
  }

  shift(seconds) {
    const windowSec = this.endSec - this.startSec;
    this.setRange(this.startSec + seconds, this.startSec + seconds + windowSec);
  }

  jumpToStart() {
    const windowSec = this.endSec - this.startSec;
    this.setRange(0, windowSec);
  }

  jumpToEnd() {
    const windowSec = this.endSec - this.startSec;
    this.setRange(this.totalDuration - windowSec, this.totalDuration);
  }

  applyTypedStart() {
    const parsed = parseTimeInput(this.startInput.value);
    if (!Number.isFinite(parsed)) {
      this.startInput.setCustomValidity("Use seconds, M:SS, or H:MM:SS.");
      this.startInput.reportValidity();
      return;
    }
    this.startInput.setCustomValidity("");
    const windowSec = this.endSec - this.startSec;
    this.setRange(parsed, parsed + windowSec);
  }

  _bindEvents() {
    this.positionInput.addEventListener("input", () => {
      const windowSec = this.endSec - this.startSec;
      const start = Number(this.positionInput.value);
      this.setRange(start, start + windowSec);
    });
    this.startInput.addEventListener("change", () => this.applyTypedStart());
    this.startInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        this.applyTypedStart();
      }
    });
    document.getElementById("timeline-start-btn").addEventListener("click", () => this.jumpToStart());
    document.getElementById("timeline-end-btn").addEventListener("click", () => this.jumpToEnd());
    document.getElementById("timeline-back-5-btn").addEventListener("click", () => this.shift(-5));
    document.getElementById("timeline-forward-5-btn").addEventListener("click", () => this.shift(5));
    document.getElementById("timeline-prev-window-btn").addEventListener("click", () => this.shift(-(this.endSec - this.startSec)));
    document.getElementById("timeline-next-window-btn").addEventListener("click", () => this.shift(this.endSec - this.startSec));
    document.getElementById("reset-zoom-btn").addEventListener("click", () => {
      this.setRange(0, Math.min(30, this.totalDuration));
      setActiveZoomPreset(30);
    });
  }
}

// ───────────────────── Debounce ─────────────────────
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ───────────────────── Time formatting ─────────────────────
function fmtTime(sec) {
  if (!Number.isFinite(sec)) return "--";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  return `${m}:${s.toString().padStart(2,'0')}`;
}

function fmtTimeInput(sec) {
  if (!Number.isFinite(sec)) return "0:00";
  const rounded = Math.max(0, Math.round(sec * 2) / 2);
  const h = Math.floor(rounded / 3600);
  const m = Math.floor((rounded % 3600) / 60);
  const s = rounded % 60;
  const seconds = Number.isInteger(s) ? String(s).padStart(2, "0") : s.toFixed(1).padStart(4, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${seconds}` : `${m}:${seconds}`;
}

function parseTimeInput(value) {
  const parts = String(value ?? "").trim().split(":").map(Number);
  if (!parts.length || parts.some((part) => !Number.isFinite(part) || part < 0)) return null;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2 && parts[1] < 60) return parts[0] * 60 + parts[1];
  if (parts.length === 3 && parts[1] < 60 && parts[2] < 60) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

// ───────────────────── Canvas helpers ─────────────────────
function setupCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);
  return { ctx, w: rect.width, h: rect.height };
}

// ───────────────────── Draw: labeled line chart ─────────────────────
function drawHrvTrendChart(canvasId, trendData) {
  const c = setupCanvas(canvasId);
  if (!c || !trendData || trendData.times.length === 0) return;
  const { ctx, w, h } = c;

  const pad = { top: 32, right: 14, bottom: 28, left: 50 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  // Plot RMSSD vs HR
  const rmssdData = trendData.rmssd;
  const hrData = trendData.hr;

  const minR = Math.min(...rmssdData);
  const maxR = Math.max(...rmssdData);
  const rangeR = (maxR - minR) || 1;

  // Draw grid
  ctx.strokeStyle = "rgba(0,0,0,0.05)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (i / 4) * plotH;
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    
    // Y-axis labels for RMSSD
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.font = "10px Inter";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const val = maxR - (i / 4) * rangeR;
    ctx.fillText(val.toFixed(0), pad.left - 8, y);
  }
  ctx.stroke();

  // Draw RMSSD Line
  ctx.beginPath();
  ctx.strokeStyle = "#8B5CF6"; // Purple for HRV
  ctx.lineWidth = 2;
  for (let i = 0; i < rmssdData.length; i++) {
    const px = pad.left + (i / (rmssdData.length - 1 || 1)) * plotW;
    const py = pad.top + plotH - ((rmssdData[i] - minR) / rangeR) * plotH;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Title and Axis
  ctx.fillStyle = "#10243d";
  ctx.font = "600 13px Inter";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("HRV Trend (RMSSD, 5-min windows)", pad.left, 8);

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.font = "10px Inter";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Time (segments)", pad.left + plotW / 2, h - pad.bottom + 8);
}

function drawLabeledLine(canvasId, data, color, title, yLabel) {
  const c = setupCanvas(canvasId);
  if (!c || !data || data.length === 0) return;
  const { ctx, w, h } = c;

  const pad = { top: 32, right: 14, bottom: 28, left: 50 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const minV = Math.min(...data);
  const maxV = Math.max(...data);
  const range = (maxV - minV) || 1;

  // Title
  ctx.fillStyle = '#10243d';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(title, pad.left, 18);

  // Y-axis label
  ctx.save();
  ctx.fillStyle = '#607087';
  ctx.font = '11px sans-serif';
  ctx.translate(12, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  // Y-axis ticks
  ctx.fillStyle = '#607087';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const val = minV + (range / yTicks) * i;
    const y = pad.top + plotH - (plotH / yTicks) * i;
    ctx.fillText(Math.round(val).toString(), pad.left - 6, y + 3);
    ctx.strokeStyle = 'rgba(16,36,61,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
  }

  // Data line
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  const stepX = plotW / (data.length - 1);
  for (let i = 0; i < data.length; i++) {
    const x = pad.left + i * stepX;
    const y = pad.top + plotH - ((data[i] - minV) / range) * plotH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// ───────────────────── Draw: scatter ─────────────────────
function drawLabeledScatter(canvasId, data, color, title, yLabel) {
  const c = setupCanvas(canvasId);
  if (!c || !data || data.length === 0) return;
  const { ctx, w, h } = c;

  const pad = { top: 32, right: 14, bottom: 28, left: 50 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const minV = Math.min(...data);
  const maxV = Math.max(...data);
  const range = (maxV - minV) || 1;

  ctx.fillStyle = '#10243d';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(title, pad.left, 18);

  ctx.save();
  ctx.fillStyle = '#607087';
  ctx.font = '11px sans-serif';
  ctx.translate(12, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  ctx.fillStyle = '#607087';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const val = minV + (range / yTicks) * i;
    const y = pad.top + plotH - (plotH / yTicks) * i;
    ctx.fillText(Math.round(val).toString(), pad.left - 6, y + 3);
    ctx.strokeStyle = 'rgba(16,36,61,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
  }

  ctx.fillStyle = color;
  const stepX = plotW / (data.length - 1 || 1);
  for (let i = 0; i < data.length; i++) {
    const x = pad.left + i * stepX;
    const y = pad.top + plotH - ((data[i] - minV) / range) * plotH;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ───────────────────── Draw: labeled histogram ─────────────────────
function drawLabeledHistogram(canvasId, histData, color, title, xLabel, yLabel) {
  const c = setupCanvas(canvasId);
  if (!c || !histData) return;
  const { ctx, w, h } = c;

  const pad = { top: 32, right: 14, bottom: 36, left: 50 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const keys = Object.keys(histData).map(Number).sort((a, b) => a - b);
  if (keys.length === 0) return;

  const maxCount = Math.max(...Object.values(histData));
  if (maxCount === 0) return;

  // Title
  ctx.fillStyle = '#10243d';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(title, pad.left, 18);

  // Y-axis label
  ctx.save();
  ctx.fillStyle = '#607087';
  ctx.font = '11px sans-serif';
  ctx.translate(12, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  // Y gridlines
  ctx.fillStyle = '#607087';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const val = (maxCount / yTicks) * i;
    const y = pad.top + plotH - (plotH / yTicks) * i;
    ctx.fillText(Math.round(val).toString(), pad.left - 6, y + 3);
    ctx.strokeStyle = 'rgba(16,36,61,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
  }

  // Bars
  const barW = plotW / keys.length;
  ctx.fillStyle = color;
  for (let i = 0; i < keys.length; i++) {
    const count = histData[keys[i]];
    const barH = (count / maxCount) * plotH;
    const x = pad.left + i * barW;
    const y = pad.top + plotH - barH;
    ctx.fillRect(x + 1, y, barW - 2, barH);
  }

  // X-axis tick labels (every Nth)
  ctx.fillStyle = '#607087';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'center';
  const step = Math.max(1, Math.floor(keys.length / 8));
  for (let i = 0; i < keys.length; i += step) {
    const x = pad.left + i * barW + barW / 2;
    ctx.fillText(keys[i].toString(), x, pad.top + plotH + 14);
  }

  // X-axis label
  ctx.fillStyle = '#607087';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(xLabel, pad.left + plotW / 2, h - 4);
}

// ───────────────────── Draw: Beat Overlay ─────────────────────
function drawBeatOverlay(canvasId, beatData) {
  const c = setupCanvas(canvasId);
  if (!c || !beatData || !beatData.mean || beatData.mean.length === 0) return;
  const { ctx, w, h } = c;

  const pad = { top: 32, right: 14, bottom: 28, left: 50 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const allVals = [...beatData.lower, ...beatData.upper];
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = (maxV - minV) || 1;

  ctx.fillStyle = '#10243d';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('ECG Beat Distribution Overlay', pad.left, 18);

  ctx.save();
  ctx.fillStyle = '#607087';
  ctx.font = '11px sans-serif';
  ctx.translate(12, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('Amplitude (mV)', 0, 0);
  ctx.restore();

  // Y ticks
  ctx.fillStyle = '#607087';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const val = minV + (range / 4) * i;
    const y = pad.top + plotH - (plotH / 4) * i;
    ctx.fillText(val.toFixed(2), pad.left - 6, y + 3);
    ctx.strokeStyle = 'rgba(16,36,61,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
  }

  // X-axis: time in ms (beat centered at 0)
  const beatDurMs = (beatData.mean.length / (beatData.sampleRate || 130)) * 1000;
  const halfMs = beatDurMs / 2;
  ctx.fillStyle = '#607087';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  const xTicks = 6;
  for (let i = 0; i <= xTicks; i++) {
    const ms = -halfMs + (beatDurMs / xTicks) * i;
    const x = pad.left + (plotW / xTicks) * i;
    ctx.fillText(ms.toFixed(0) + 'ms', x, pad.top + plotH + 16);
  }

  const stepX = plotW / (beatData.mean.length - 1 || 1);
  const toY = (v) => pad.top + plotH - ((v - minV) / range) * plotH;

  // Variance fill
  ctx.beginPath();
  ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
  for (let i = 0; i < beatData.upper.length; i++) {
    const x = pad.left + i * stepX;
    if (i === 0) ctx.moveTo(x, toY(beatData.upper[i]));
    else ctx.lineTo(x, toY(beatData.upper[i]));
  }
  for (let i = beatData.lower.length - 1; i >= 0; i--) {
    ctx.lineTo(pad.left + i * stepX, toY(beatData.lower[i]));
  }
  ctx.fill();

  // Mean line
  ctx.beginPath();
  ctx.strokeStyle = '#F43F5E';
  ctx.lineWidth = 2;
  for (let i = 0; i < beatData.mean.length; i++) {
    const x = pad.left + i * stepX;
    const y = toY(beatData.mean[i]);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

let isEcgExplorerInteractive = false;
let ecgDragState = {
  active: false,
  startX: 0,
  currentX: 0,
  windowStartSec: 0,
  windowSizeSec: 0,
  plotW: 0,
  padLeft: 0
};

// ───────────────────── Draw: ECG Explorer ─────────────────────
function drawEcgExplorer(canvasId, ecgData, markers, windowStartSec, windowSizeSec, beats = []) {
  const canvas = document.getElementById(canvasId);
  const c = setupCanvas(canvasId);
  if (!c || !ecgData || ecgData.min.length === 0) return;
  const { ctx, w, h } = c;

  const pad = { top: 32, right: 14, bottom: 28, left: 50 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  // Track state for mouse events
  ecgDragState.windowStartSec = windowStartSec;
  ecgDragState.windowSizeSec = windowSizeSec;
  ecgDragState.plotW = plotW;
  ecgDragState.padLeft = pad.left;
  ecgDragState.padTop = pad.top;
  ecgDragState.plotH = plotH;
  ecgDragState.canvasW = w;
  ecgDragState.canvasH = h;

  if (!isEcgExplorerInteractive && canvas) {
    isEcgExplorerInteractive = true;
    canvas.style.touchAction = 'none';

    let dragCtx = canvas.getContext('2d');
    let savedImageData = null;

    // Pointer events cover mouse, touch, and pen with one code path.
    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pL = ecgDragState.padLeft;
      const pW = ecgDragState.plotW;
      if (x >= pL && x <= pL + pW) {
        ecgDragState.active = true;
        ecgDragState.startX = x;
        ecgDragState.currentX = x;
        savedImageData = dragCtx.getImageData(0, 0, canvas.width, canvas.height);
        try { canvas.setPointerCapture(e.pointerId); } catch { /* unsupported */ }
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!ecgDragState.active || !savedImageData) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      let x = e.clientX - rect.left;
      const pL = ecgDragState.padLeft;
      const pW = ecgDragState.plotW;
      x = Math.max(pL, Math.min(x, pL + pW));
      ecgDragState.currentX = x;

      // Restore saved image and draw selection overlay
      dragCtx.putImageData(savedImageData, 0, 0);
      const dpr = window.devicePixelRatio || 1;
      dragCtx.save();
      dragCtx.scale(dpr, dpr);
      dragCtx.fillStyle = 'rgba(14, 165, 198, 0.22)';
      const selStart = Math.min(ecgDragState.startX, ecgDragState.currentX);
      const selWidth = Math.abs(ecgDragState.currentX - ecgDragState.startX);
      dragCtx.fillRect(selStart, ecgDragState.padTop, selWidth, ecgDragState.plotH);
      dragCtx.strokeStyle = 'rgba(14, 165, 198, 0.85)';
      dragCtx.lineWidth = 1;
      dragCtx.strokeRect(selStart, ecgDragState.padTop, selWidth, ecgDragState.plotH);
      dragCtx.restore();
    });

    const handlePointerUp = () => {
      if (!ecgDragState.active) return;
      ecgDragState.active = false;

      const pL = ecgDragState.padLeft;
      const pW = ecgDragState.plotW;
      const wStart = ecgDragState.windowStartSec;
      const wSize = ecgDragState.windowSizeSec;

      let startX = Math.min(ecgDragState.startX, ecgDragState.currentX);
      let endX = Math.max(ecgDragState.startX, ecgDragState.currentX);
      if (endX - startX < 6) {
        // Treat as a tap: redraw without zooming.
        if (savedImageData) dragCtx.putImageData(savedImageData, 0, 0);
        return;
      }

      let startRatio = (startX - pL) / pW;
      let endRatio = (endX - pL) / pW;

      let newStartSec = wStart + startRatio * wSize;
      let newEndSec = wStart + endRatio * wSize;
      let newSizeSec = newEndSec - newStartSec;

      // Min zoom 5 seconds
      if (newSizeSec < 5) {
        const center = newStartSec + newSizeSec / 2;
        newStartSec = Math.max(0, center - 2.5);
        newEndSec = Math.min(totalDuration, newStartSec + 5);
        if (newEndSec - newStartSec < 5) {
            newStartSec = Math.max(0, newEndSec - 5);
        }
      }

      if (rangeSlider) {
        rangeSlider.setRange(newStartSec, newEndSec);
      }
    };

    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);
  }

  const minV = Math.min(...ecgData.min);
  const maxV = Math.max(...ecgData.max);
  const range = (maxV - minV) || 1;

  ctx.fillStyle = '#10243d';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`Raw ECG Signal (${fmtTime(windowStartSec)} – ${fmtTime(windowStartSec + windowSizeSec)})`, pad.left, 18);

  ctx.save();
  ctx.fillStyle = '#607087';
  ctx.font = '11px sans-serif';
  ctx.translate(12, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('mV', 0, 0);
  ctx.restore();

  // Y ticks
  ctx.fillStyle = '#607087';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const val = minV + (range / 4) * i;
    const y = pad.top + plotH - (plotH / 4) * i;
    ctx.fillText(val.toFixed(2), pad.left - 6, y + 3);
    ctx.strokeStyle = 'rgba(16,36,61,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
  }

  // X-axis time ticks
  ctx.fillStyle = '#607087';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  const xTicks = 6;
  for (let i = 0; i <= xTicks; i++) {
    const t = windowStartSec + (windowSizeSec / xTicks) * i;
    const x = pad.left + (plotW / xTicks) * i;
    ctx.fillText(fmtTime(t), x, pad.top + plotH + 16);
  }

  const stepX = plotW / (ecgData.min.length - 1 || 1);
  const toY = (v) => pad.top + plotH - ((v - minV) / range) * plotH;

  // Clinical grid for readable windows: major line each 1 s, minor each 0.2 s,
  // plus 0.5 / 0.1 mV horizontal rules — the familiar ECG-paper layout.
  if (windowSizeSec <= 30) {
    const secondsToX = (sec) => pad.left + (sec - windowStartSec) / windowSizeSec * plotW;
    const minorStepPx = plotW / windowSizeSec * 0.2;
    ctx.lineWidth = 1;
    if (minorStepPx >= 4) {
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.07)';
      ctx.beginPath();
      for (let t = Math.ceil(windowStartSec / 0.2) * 0.2; t <= windowStartSec + windowSizeSec; t += 0.2) {
        const x = secondsToX(t);
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, pad.top + plotH);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.18)';
    ctx.beginPath();
    for (let t = Math.ceil(windowStartSec); t <= windowStartSec + windowSizeSec; t += 1) {
      const x = secondsToX(t);
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + plotH);
    }
    ctx.stroke();
    const mvMinor = 0.1;
    if (plotH / (range / mvMinor) >= 5) {
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.07)';
      ctx.beginPath();
      for (let v = Math.ceil(minV / mvMinor) * mvMinor; v <= maxV; v += mvMinor) {
        ctx.moveTo(pad.left, toY(v));
        ctx.lineTo(pad.left + plotW, toY(v));
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.16)';
    ctx.beginPath();
    for (let v = Math.ceil(minV / 0.5) * 0.5; v <= maxV; v += 0.5) {
      ctx.moveTo(pad.left, toY(v));
      ctx.lineTo(pad.left + plotW, toY(v));
    }
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
  for (let i = 0; i < ecgData.max.length; i++) {
    const x = pad.left + i * stepX;
    if (i === 0) ctx.moveTo(x, toY(ecgData.max[i]));
    else ctx.lineTo(x, toY(ecgData.max[i]));
  }
  for (let i = ecgData.min.length - 1; i >= 0; i--) {
    const x = pad.left + i * stepX;
    ctx.lineTo(x, toY(ecgData.min[i]));
  }
  ctx.fill();

  // ECG Median Line
  ctx.beginPath();
  ctx.strokeStyle = '#F43F5E';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < ecgData.median.length; i++) {
    const x = pad.left + i * stepX;
    const y = toY(ecgData.median[i]);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Beat annotations: R-peak ticks, with RR-interval labels at close zoom.
  if (beats && beats.length > 0 && windowSizeSec <= 60) {
    const showRr = windowSizeSec <= 15 && beats.length <= 40;
    for (const beat of beats) {
      const x = pad.left + beat.pos * plotW;
      ctx.strokeStyle = 'rgba(14, 165, 198, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + 8);
      ctx.stroke();
      if (showRr && Number.isFinite(beat.rrMs)) {
        ctx.fillStyle = '#0EA5C6';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(beat.rrMs)}`, x, pad.top + 18);
      }
    }
    if (showRr) {
      ctx.fillStyle = '#607087';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('RR in ms', pad.left + plotW - 44, pad.top + 18);
    }
  }

  // Irregularity markers: E = verified premature, P = verified pause,
  // A = candidate downgraded to sensor artifact.
  if (markers && markers.length > 0) {
    for (const m of markers) {
      const idx = Math.floor(m.pos * (ecgData.median.length - 1));
      const x = pad.left + idx * stepX;
      const y = toY(ecgData.max[idx]);
      const artifact = m.classification === 'artifact-suspected';
      ctx.fillStyle = artifact ? '#94A3B8' : m.type === 'ectopic' ? '#F97316' : '#EF4444';
      ctx.beginPath();
      ctx.arc(x, y - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#10243d';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(artifact ? 'A' : m.type === 'ectopic' ? 'E' : 'P', x, y - 13);
    }
  }
}

// ───────────────────── Draw: Spectrogram ─────────────────────
function drawSpectrogram(canvasId, spectrogram, windowStartSec, windowSizeSec) {
  const c = setupCanvas(canvasId);
  if (!c || !spectrogram || spectrogram.length === 0) return;
  const { ctx, w, h } = c;

  const pad = { top: 32, right: 14, bottom: 28, left: 50 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const numFreqs = spectrogram.length;
  const numTimes = spectrogram[0].length;
  const cellW = plotW / numTimes;
  const cellH = plotH / numFreqs;

  ctx.fillStyle = '#10243d';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('Wavelet Spectrogram (Morlet CWT)', pad.left, 18);

  // Heatmap
  for (let f = 0; f < numFreqs; f++) {
    for (let t = 0; t < numTimes; t++) {
      const val = spectrogram[f][t];
      const r = Math.floor(val * 255);
      const g = Math.floor(val * 200);
      const b = Math.floor(80 + (1 - val) * 175);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(pad.left + t * cellW, pad.top + (numFreqs - 1 - f) * cellH, cellW + 1, cellH + 1);
    }
  }

  // Y-axis: Frequency (Hz)
  ctx.save();
  ctx.fillStyle = '#607087';
  ctx.font = '11px sans-serif';
  ctx.translate(12, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('Frequency (Hz)', 0, 0);
  ctx.restore();

  const freqLabels = [1, 5, 10, 20, 40];
  ctx.fillStyle = '#607087';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  for (const freq of freqLabels) {
    const frac = (freq - 1) / (40 - 1);
    const y = pad.top + plotH - frac * plotH;
    ctx.fillText(freq + ' Hz', pad.left - 6, y + 3);
  }

  // X-axis: Time
  ctx.fillStyle = '#607087';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  const xTicks = 6;
  for (let i = 0; i <= xTicks; i++) {
    const t = windowStartSec + (windowSizeSec / xTicks) * i;
    const x = pad.left + (plotW / xTicks) * i;
    ctx.fillText(fmtTime(t), x, pad.top + plotH + 16);
  }

  ctx.fillStyle = '#607087';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Time', pad.left + plotW / 2, h - 2);
}

// ───────────────────── Range slider instance ─────────────────────
let rangeSlider = null;

const debouncedFetchWindow = debounce((startSec, endSec) => {
  if (!globalWorker) return;
  globalWorker.postMessage({
    action: 'get_window',
    windowStart: startSec,
    windowSize: endSec - startSec
  });
}, 300);

function onRangeChange(startSec, endSec) {
  const dur = endSec - startSec;
  currentExplorerRange = { startSec, endSec };
  document.getElementById('range-label-start').textContent = fmtTimeInput(startSec);
  document.getElementById('range-label-end').textContent = fmtTimeInput(endSec);
  document.getElementById('range-label-window').textContent = `Selected window: ${dur < 60 ? dur.toFixed(dur % 1 ? 1 : 0) + 's' : fmtTime(dur)}`;
  setActiveZoomPreset(dur);
  debouncedFetchWindow(startSec, endSec);
}

// ───────────────────── Zoom Presets ─────────────────────
function setActiveZoomPreset(seconds) {
  const container = document.getElementById('zoom-presets');
  if (!container) return;
  container.querySelectorAll('button').forEach((button) => {
    button.classList.toggle("active", Math.abs(Number(button.dataset.seconds) - seconds) < 0.01);
  });
}

function buildZoomPresets(duration) {
  const container = document.getElementById('zoom-presets');
  if (!container) return;
  container.innerHTML = '';
  container.style.display = 'flex';

  const presets = [
    { label: 'All', sec: duration },
    { label: '30 min', sec: 1800 },
    { label: '10 min', sec: 600 },
    { label: '1 min', sec: 60 },
    { label: '30s', sec: 30 },
    { label: '10s', sec: 10 },
    { label: '5s', sec: 5 },
  ];

  for (const p of presets) {
    if (p.sec > duration && p.sec !== duration) continue;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = p.label;
    btn.dataset.seconds = String(p.sec);
    if (p.label === '30s') btn.classList.add('active');
    btn.addEventListener('click', () => {
      if (!rangeSlider) return;
      const windowSec = Math.min(p.sec, totalDuration);
      rangeSlider.setWindowLength(windowSec);
      setActiveZoomPreset(windowSec);
    });
    container.appendChild(btn);
  }
}

// ───────────────────── Form submit ─────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!csvInput.files || csvInput.files.length === 0) {
    alert("Please select a file or files");
    return;
  }

  const files = Array.from(csvInput.files);
  const recordingType = recordingTypeInput?.value || "auto";
  const profileInfo = {
    name: nameInput.value.trim(),
    age: parseInt(ageInput.value, 10) || null,
    recordingType,
    symptoms: symptomsInput?.value.trim() || "",
    nominalSampleRate: 130,
    protocol: {
      enabled: recordingType === "interval-test"
    }
  };

  progressDiv.classList.remove("hidden");
  emptyState.classList.add("hidden");
  dashboardContent.classList.add("hidden");

  try {
    progressLabel.textContent = "Processing files...";

    if (globalWorker) globalWorker.terminate();

    const workerUrl = new URL('./analysis-worker.js', import.meta.url);
    workerUrl.searchParams.set("v", ANALYSIS_WORKER_VERSION);
    globalWorker = new Worker(workerUrl, { type: 'module' });

    globalWorker.onmessage = (ev) => {
      const msg = ev.data;
      if (msg.type === 'progress') {
        progressLabel.textContent = msg.message;
        progressPercent.textContent = `${msg.percent}%`;
        progressBar.style.width = `${msg.percent}%`;
        progressDiv.querySelector('[role="progressbar"]')?.setAttribute("aria-valuenow", String(msg.percent));
      } else if (msg.type === 'complete') {
        const compatibleReport = normalizeReportForRendering(msg.report);
        currentReport = compatibleReport;
        currentProfile = profileInfo;
        totalDuration = compatibleReport.universal.durationSec;
        try {
          renderDashboard(compatibleReport);
        } catch (err) {
          console.error(err);
          alert("The ECG analysis finished, but the dashboard could not be displayed. Please refresh the page and try again.");
        }
        progressDiv.classList.add("hidden");
        dashboardContent.classList.remove("hidden");
        document.getElementById("pdf-report-actions").classList.remove("hidden");

        // Init range slider
        const sliderEl = document.getElementById('range-slider');
        rangeSlider = new TimelineNavigator(sliderEl, onRangeChange);
        rangeSlider.init(totalDuration);

        // Init zoom preset buttons
        buildZoomPresets(totalDuration);

      } else if (msg.type === 'window_data') {
        renderWindowData(msg.data);
      } else if (msg.type === 'error') {
        alert("Analysis error: " + msg.error);
        progressDiv.classList.add("hidden");
      }
    };

    globalWorker.onerror = (event) => {
      console.error("ECG analysis worker error", event.error ?? event.message);
      progressLabel.textContent = "Analysis could not be completed.";
      alert("The ECG analysis could not be completed. Please refresh the page and try the file again.");
      progressDiv.classList.add("hidden");
    };

    globalWorker.postMessage({ files, profileInfo });
  } catch (err) {
    alert("Upload failed: " + err.message);
    progressDiv.classList.add("hidden");
  }
});

// ───────────────────── Render window (ECG explorer + spectrogram) ─────────────────────
function renderWindowData(data) {
  drawEcgExplorer('ecg-explorer-chart', data.ecg, data.markers, data.windowStartSec, data.windowSizeSec, data.beats);
  drawSpectrogram('cwt-chart', data.spectrogram, data.windowStartSec, data.windowSizeSec);
}

// ───────────────────── Drill-down navigation ─────────────────────
function jumpToTime(timeSec, windowSec = 10) {
  if (!rangeSlider || !Number.isFinite(timeSec)) return;
  const half = windowSec / 2;
  rangeSlider.setRange(timeSec - half, timeSec + half);
  document.getElementById('explorer-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Makes a full-duration timeline canvas clickable: a click maps the x position
// to recording time and opens the ECG explorer there.
function makeTimelineClickable(canvasId, padLeft, padRight) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || canvas.dataset.jumpBound) return;
  canvas.dataset.jumpBound = "1";
  canvas.style.cursor = 'pointer';
  canvas.addEventListener('click', (event) => {
    if (!totalDuration) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const plotW = rect.width - padLeft - padRight;
    if (plotW <= 0) return;
    const fraction = clamp((x - padLeft) / plotW, 0, 1);
    jumpToTime(fraction * totalDuration);
  });
}

// ───────────────────── Heart dashboard visualizations ─────────────────────
function drawChartMessage(canvasId, title, message) {
  const c = setupCanvas(canvasId);
  if (!c) return;
  const { ctx, w, h } = c;
  ctx.fillStyle = "#10243d";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(title, 28, 24);
  ctx.fillStyle = "#607087";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(message, w / 2, h / 2);
}

function drawQualityGauge(canvasId, universal) {
  const c = setupCanvas(canvasId);
  if (!c) return;
  const { ctx, w, h } = c;
  const centerX = w / 2;
  const centerY = h * 0.58;
  const radius = Math.min(w, h) * 0.3;
  const start = Math.PI * 0.8;
  const span = Math.PI * 1.4;
  ctx.fillStyle = "#10243d";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Signal Quality Score", 28, 24);
  ctx.lineCap = "round";
  ctx.lineWidth = 20;
  ctx.strokeStyle = "rgba(16,36,61,0.09)";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, start, start + span);
  ctx.stroke();
  const scoreColor = universal.qualityScore >= 85 ? "#10B981" : universal.qualityScore >= 60 ? "#F59E0B" : "#F43F5E";
  ctx.strokeStyle = scoreColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, start, start + span * universal.qualityScore / 100);
  ctx.stroke();
  ctx.fillStyle = "#10243d";
  ctx.font = "700 34px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${universal.qualityScore}`, centerX, centerY + 4);
  ctx.fillStyle = "#607087";
  ctx.font = "11px sans-serif";
  ctx.fillText(universal.qualityLevel, centerX, centerY + 26);
  const components = Object.entries(universal.qualityComponents);
  components.forEach(([label, value], index) => {
    const x = 28 + index * ((w - 56) / components.length);
    ctx.textAlign = "left";
    ctx.fillStyle = "#607087";
    ctx.font = "9px sans-serif";
    ctx.fillText(label.replace(/([A-Z])/g, " $1"), x, h - 22);
    ctx.fillStyle = "#10243d";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText(`${value.toFixed(0)}%`, x, h - 8);
  });
}

function drawIntegrityChart(canvasId, universal, gaps) {
  const c = setupCanvas(canvasId);
  if (!c) return;
  const { ctx, w, h } = c;
  const pad = { top: 44, right: 24, bottom: 42, left: 28 };
  const plotW = w - pad.left - pad.right;
  ctx.fillStyle = "#10243d";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("Recording Integrity Timeline", pad.left, 24);
  ctx.fillStyle = "rgba(16,185,129,0.18)";
  ctx.fillRect(pad.left, h / 2 - 16, plotW, 32);
  ctx.strokeStyle = "#10B981";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pad.left, h / 2);
  ctx.lineTo(pad.left + plotW, h / 2);
  ctx.stroke();
  for (const gap of gaps) {
    const x = pad.left + gap.timeSec / universal.durationSec * plotW;
    const width = Math.max(2, gap.durationSec / universal.durationSec * plotW);
    ctx.fillStyle = "#F43F5E";
    ctx.fillRect(x, h / 2 - 24, width, 48);
  }
  ctx.fillStyle = "#607087";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("0:00", pad.left, h - 18);
  ctx.textAlign = "right";
  ctx.fillText(fmtTime(universal.durationSec), pad.left + plotW, h - 18);
  ctx.textAlign = "center";
  ctx.fillText(`${universal.gapCount} gap${universal.gapCount === 1 ? "" : "s"} | ${universal.missingSamples.toLocaleString()} estimated missing samples`, w / 2, h - 4);
}

function drawQualityTimeline(canvasId, timeline, durationSec) {
  const c = setupCanvas(canvasId);
  if (!c || !timeline?.length) {
    drawChartMessage(canvasId, "Analysis Usability by Time", "No quality timeline is available.");
    return;
  }
  const { ctx, w, h } = c;
  const pad = { top: 42, right: 20, bottom: 34, left: 92 };
  const plotW = w - pad.left - pad.right;
  const lanes = [
    { key: "hrUsable", label: "Heart rate" },
    { key: "hrvUsable", label: "HRV" },
    { key: "morphologyUsable", label: "Morphology" }
  ];
  const laneHeight = Math.max(18, (h - pad.top - pad.bottom) / lanes.length - 8);
  ctx.fillStyle = "#10243d";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Analysis Usability by Time", pad.left, 22);
  lanes.forEach((lane, laneIndex) => {
    const y = pad.top + laneIndex * (laneHeight + 8);
    ctx.fillStyle = "#607087";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(lane.label, pad.left - 10, y + laneHeight / 2 + 3);
    ctx.fillStyle = "rgba(96,112,135,0.14)";
    ctx.fillRect(pad.left, y, plotW, laneHeight);
    for (const segment of timeline) {
      const x = pad.left + segment.startSec / Math.max(1, durationSec) * plotW;
      const width = Math.max(1, (segment.endSec - segment.startSec) / Math.max(1, durationSec) * plotW);
      ctx.fillStyle = segment[lane.key]
        ? segment.score >= 80 ? "#10B981" : "#F59E0B"
        : segment.displacement ? "#F43F5E" : "#94A3B8";
      ctx.fillRect(x, y, width, laneHeight);
    }
  });
  ctx.font = "10px sans-serif";
  ctx.fillStyle = "#607087";
  ctx.textAlign = "left";
  ctx.fillText("0:00", pad.left, h - 10);
  ctx.textAlign = "right";
  ctx.fillText(fmtTime(durationSec), pad.left + plotW, h - 10);
  ctx.textAlign = "center";
  ctx.fillStyle = "#10B981";
  ctx.fillText("usable", w * 0.42, h - 10);
  ctx.fillStyle = "#F59E0B";
  ctx.fillText("limited", w * 0.55, h - 10);
  ctx.fillStyle = "#94A3B8";
  ctx.fillText("excluded", w * 0.68, h - 10);
}

function drawPoincareChart(canvasId, points) {
  const c = setupCanvas(canvasId);
  if (!c || !points?.length) {
    drawChartMessage(canvasId, "Poincare Plot (Clean NN Intervals)", "Not enough HRV-quality beat pairs.");
    return;
  }
  const { ctx, w, h } = c;
  const pad = { top: 40, right: 22, bottom: 42, left: 54 };
  const values = points.flatMap((point) => [point.x, point.y]).filter(Number.isFinite).sort((a, b) => a - b);
  const low = values[Math.floor(values.length * 0.01)] ?? 300;
  const high = values[Math.min(values.length - 1, Math.ceil(values.length * 0.99))] ?? 1500;
  const range = Math.max(50, high - low);
  const min = low - range * 0.08;
  const max = high + range * 0.08;
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const toX = (value) => pad.left + clamp((value - min) / (max - min), 0, 1) * plotW;
  const toY = (value) => pad.top + plotH - clamp((value - min) / (max - min), 0, 1) * plotH;
  ctx.fillStyle = "#10243d";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("Poincare Plot (Clean NN Intervals)", pad.left, 22);
  ctx.strokeStyle = "rgba(16,36,61,0.18)";
  ctx.beginPath();
  ctx.moveTo(toX(min), toY(min));
  ctx.lineTo(toX(max), toY(max));
  ctx.stroke();
  ctx.fillStyle = "rgba(139,92,246,0.34)";
  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
    ctx.beginPath();
    ctx.arc(toX(point.x), toY(point.y), 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#607087";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("RR n (ms)", pad.left + plotW / 2, h - 10);
  ctx.save();
  ctx.translate(13, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("RR n+1 (ms)", 0, 0);
  ctx.restore();
  ctx.textAlign = "left";
  ctx.fillText(min.toFixed(0), pad.left, h - 27);
  ctx.textAlign = "right";
  ctx.fillText(max.toFixed(0), pad.left + plotW, h - 27);
}

function drawAlignedIntervalChart(canvasId, intervalTest, phase) {
  const repetitions = intervalTest?.repetitions ?? [];
  const traces = repetitions.map((repetition) => repetition.trace ?? repetition.relativeTrace ?? []).filter((trace) => trace.length);
  const title = phase === "effort" ? "Aligned One-Minute HR Response" : "Aligned Recovery to Baseline";
  if (!intervalTest?.enabled || !traces.length) {
    drawChartMessage(canvasId, title, intervalTest?.enabled ? "No quality-valid aligned trace is available." : "Select Five-repeat interval test before analysis.");
    return;
  }
  const c = setupCanvas(canvasId);
  if (!c) return;
  const { ctx, w, h } = c;
  const pad = { top: 42, right: 20, bottom: 38, left: 50 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const prepared = repetitions.map((repetition) => {
    const source = repetition.trace ?? repetition.relativeTrace ?? [];
    return source.flatMap((point) => {
      const relative = Number(point.timeSec ?? point.relativeTimeSec);
      const rawValue = point.hr ?? point.value;
      const value = rawValue === null || rawValue === undefined ? Number.NaN : Number(rawValue);
      const quality = Number(point.quality ?? point.qualityPct ?? 100);
      if (!Number.isFinite(relative) || !Number.isFinite(value) || (Number.isFinite(quality) && quality < 50)) return [];
      if (phase === "effort" && relative >= -30 && relative <= 60) return [{ timeSec: relative, value }];
      if (phase === "recovery" && relative >= 60 && relative <= 360) return [{ timeSec: relative - 60, value }];
      return [];
    });
  });
  const allPoints = prepared.flat();
  if (!allPoints.length) {
    drawChartMessage(canvasId, title, "No quality-valid points are available for this phase.");
    return;
  }
  const minTime = phase === "effort" ? -30 : 0;
  const maxTime = phase === "effort" ? 60 : Math.max(60, Math.min(300, ...allPoints.map((point) => point.timeSec)));
  const values = allPoints.map((point) => point.value);
  const minHr = Math.floor((Math.min(...values) - 5) / 10) * 10;
  const maxHr = Math.ceil((Math.max(...values) + 5) / 10) * 10;
  const toX = (value) => pad.left + (value - minTime) / Math.max(1, maxTime - minTime) * plotW;
  const toY = (value) => pad.top + plotH - (value - minHr) / Math.max(1, maxHr - minHr) * plotH;
  ctx.fillStyle = "#10243d";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(title, pad.left, 22);
  for (let tick = 0; tick <= 4; tick++) {
    const hr = minHr + (maxHr - minHr) * tick / 4;
    const y = toY(hr);
    ctx.strokeStyle = "rgba(16,36,61,0.07)";
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
    ctx.fillStyle = "#607087";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(hr.toFixed(0), pad.left - 7, y + 3);
  }
  if (phase === "recovery" && Number.isFinite(intervalTest.baselineHr ?? intervalTest.baseline?.hr)) {
    const baseline = intervalTest.baselineHr ?? intervalTest.baseline.hr;
    ctx.strokeStyle = "#10B981";
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, toY(baseline));
    ctx.lineTo(pad.left + plotW, toY(baseline));
    ctx.stroke();
    ctx.setLineDash([]);
  }
  const colors = ["#0EA5C6", "#F43F5E", "#8B5CF6", "#F59E0B", "#10B981"];
  prepared.forEach((points, index) => {
    if (!points.length) return;
    ctx.strokeStyle = colors[index % colors.length];
    ctx.lineWidth = 2;
    ctx.beginPath();
    let previousTime = null;
    points.forEach((point) => {
      if (previousTime === null || point.timeSec - previousTime > 8) ctx.moveTo(toX(point.timeSec), toY(point.value));
      else ctx.lineTo(toX(point.timeSec), toY(point.value));
      previousTime = point.timeSec;
    });
    ctx.stroke();
    ctx.fillStyle = colors[index % colors.length];
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`#${index + 1}`, pad.left + 8 + index * 34, 36);
  });
  ctx.fillStyle = "#607087";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(phase === "effort" ? "-30s" : "0", pad.left, h - 10);
  ctx.textAlign = "right";
  ctx.fillText(`${maxTime.toFixed(0)}s`, pad.left + plotW, h - 10);
}

function chartBounds(points, fallbackMin = 40, fallbackMax = 180) {
  const values = points.map((point) => point.value).filter(Number.isFinite);
  if (!values.length) return { min: fallbackMin, max: fallbackMax };
  const min = Math.floor(Math.min(...values) / 10) * 10 - 5;
  const max = Math.ceil(Math.max(...values) / 10) * 10 + 5;
  return { min, max: max === min ? max + 10 : max };
}

function drawTimeSeriesBase(canvasId, points, title, color = "#F43F5E", options = {}) {
  const c = setupCanvas(canvasId);
  if (!c || !points?.length) {
    drawChartMessage(canvasId, title, "Not enough clean data for this chart.");
    return null;
  }
  const { ctx, w, h } = c;
  const pad = { top: 38, right: 18, bottom: 34, left: 52 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const maxTime = options.maxTime ?? Math.max(...points.map((point) => point.timeSec));
  const { min, max } = options.bounds ?? chartBounds(points);
  const toX = (time) => pad.left + clamp(time / Math.max(1, maxTime), 0, 1) * plotW;
  const toY = (value) => pad.top + plotH - clamp((value - min) / (max - min), 0, 1) * plotH;
  ctx.fillStyle = "#10243d";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(title, pad.left, 20);
  ctx.font = "10px sans-serif";
  for (let tick = 0; tick <= 4; tick++) {
    const value = min + (max - min) * tick / 4;
    const y = toY(value);
    ctx.strokeStyle = "rgba(16,36,61,0.07)";
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
    ctx.fillStyle = "#607087";
    ctx.textAlign = "right";
    ctx.fillText(value.toFixed(0), pad.left - 7, y + 3);
  }
  for (let tick = 0; tick <= 5; tick++) {
    const time = maxTime * tick / 5;
    ctx.fillStyle = "#607087";
    ctx.textAlign = "center";
    ctx.fillText(fmtTime(time), toX(time), h - 10);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = toX(point.timeSec);
    const y = toY(point.value);
    if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  return { ctx, w, h, pad, plotW, plotH, toX, toY, min, max, maxTime };
}

function drawAnnotatedHrChart(canvasId, report) {
  const base = drawTimeSeriesBase(canvasId, report.visualizationData.hrPoints, "Heart Rate With Intervals, Peaks, and Events", "#F43F5E", { maxTime: report.universal.durationSec });
  if (!base) return;
  const { ctx, pad, plotH, toX, toY } = base;
  const protocolRepetitions = report.workout.intervalTest?.enabled ? report.workout.intervalTest.repetitions ?? [] : [];
  const displayedIntervals = protocolRepetitions.length
    ? protocolRepetitions.map((repetition) => ({ startSec: repetition.startSec, endSec: repetition.endSec }))
    : report.workout.intervals;
  for (const interval of displayedIntervals) {
    ctx.fillStyle = "rgba(14,165,198,0.10)";
    ctx.fillRect(toX(interval.startSec), pad.top, Math.max(2, toX(interval.endSec) - toX(interval.startSec)), plotH);
  }
  for (const repetition of protocolRepetitions) {
    if (!Number.isFinite(repetition.recoveryEndSec ?? repetition.baselineReturnSec)) continue;
    const recoveryEnd = repetition.recoveryEndSec ?? repetition.baselineReturnSec;
    ctx.fillStyle = "rgba(16,185,129,0.07)";
    ctx.fillRect(toX(repetition.endSec), pad.top, Math.max(2, toX(recoveryEnd) - toX(repetition.endSec)), plotH);
  }
  const peak = report.workout.peakTiming;
  if (peak) {
    ctx.fillStyle = "#F97316";
    ctx.beginPath();
    ctx.arc(toX(peak.timeSec), toY(peak.hr), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Peak ${peak.hr.toFixed(0)}`, toX(peak.timeSec), toY(peak.hr) - 10);
  }
  for (const event of report.rhythm.events.slice(0, 100)) {
    const time = event.timeSec ?? event.startSec;
    ctx.strokeStyle = event.type === "pause" ? "#EF4444" : event.type === "ectopic" ? "#F97316" : "#8B5CF6";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(toX(time), pad.top);
    ctx.lineTo(toX(time), pad.top + plotH);
    ctx.stroke();
  }
}

function drawZoneChart(canvasId, zones) {
  const c = setupCanvas(canvasId);
  if (!c || !zones?.some((zone) => zone.seconds > 0)) {
    drawChartMessage(canvasId, "Time in Estimated HR Zones", "No qualifying zone time.");
    return;
  }
  const { ctx, w, h } = c;
  const colors = ["#38BDF8", "#10B981", "#F59E0B", "#F97316", "#F43F5E"];
  const total = zones.reduce((sum, zone) => sum + zone.seconds, 0);
  const centerX = w * 0.33;
  const centerY = h * 0.56;
  const radius = Math.min(w, h) * 0.28;
  let angle = -Math.PI / 2;
  ctx.fillStyle = "#10243d";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("Time in Estimated HR Zones", 24, 22);
  zones.forEach((zone, index) => {
    const span = zone.seconds / total * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, angle, angle + span);
    ctx.closePath();
    ctx.fillStyle = colors[index];
    ctx.fill();
    angle += span;
  });
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.fillStyle = "#10243d";
  ctx.textAlign = "center";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(`${(total / 60).toFixed(0)} min`, centerX, centerY + 5);
  zones.forEach((zone, index) => {
    const y = 52 + index * 32;
    ctx.fillStyle = colors[index];
    ctx.fillRect(w * 0.62, y - 10, 12, 12);
    ctx.fillStyle = "#10243d";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${zone.label}: ${zone.minutes.toFixed(1)} min`, w * 0.62 + 20, y);
  });
}

function drawRecoveryChart(canvasId, recovery) {
  if (!recovery?.available) {
    drawChartMessage(canvasId, "Post-Peak HR Recovery", "No clean post-peak recovery tail is available.");
    return;
  }
  const points = [{ timeSec: 0, value: recovery.peakHr }];
  for (const seconds of [30, 60, 120]) {
    const item = recovery.values[seconds];
    if (item?.available) points.push({ timeSec: seconds, value: item.hr });
  }
  drawTimeSeriesBase(canvasId, points, "Post-Peak HR Recovery", "#10B981", { maxTime: 120 });
}

function drawIntervalChart(canvasId, workout) {
  if (!workout.intervalDetection.applicable) {
    drawChartMessage(canvasId, "Interval Peak and Recovery Comparison", workout.intervalDetection.reason);
    return;
  }
  const c = setupCanvas(canvasId);
  if (!c) return;
  const { ctx, w, h } = c;
  const pad = { top: 42, right: 24, bottom: 34, left: 48 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const max = Math.max(...workout.intervals.map((interval) => interval.peakHr), 1);
  ctx.fillStyle = "#10243d";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("Interval Peak and Recovery Comparison", pad.left, 22);
  const groupW = plotW / workout.intervals.length;
  workout.intervals.forEach((interval, index) => {
    const peakH = interval.peakHr / max * plotH;
    const dropH = Math.max(0, interval.recoveryDrop ?? 0) / max * plotH;
    const x = pad.left + index * groupW + groupW * 0.18;
    ctx.fillStyle = "#F43F5E";
    ctx.fillRect(x, pad.top + plotH - peakH, groupW * 0.28, peakH);
    ctx.fillStyle = "#10B981";
    ctx.fillRect(x + groupW * 0.34, pad.top + plotH - dropH, groupW * 0.28, dropH);
    ctx.fillStyle = "#607087";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`#${interval.index}`, x + groupW * 0.3, h - 12);
  });
}

function drawRestHrChart(canvasId, report) {
  const points = report.rest.windows.map((window) => ({ timeSec: window.centerSec, value: window.avgHr }));
  const base = drawTimeSeriesBase(canvasId, points, "Sleep / Rest HR Trend (5-Minute Windows)", "#0EA5C6", { maxTime: report.universal.durationSec });
  if (!base) return;
  const { ctx, pad, plotW, toY } = base;
  const baseline = report.rest.baseline.hr;
  if (Number.isFinite(baseline)) {
    ctx.strokeStyle = "#10B981";
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(pad.left, toY(baseline));
    ctx.lineTo(pad.left + plotW, toY(baseline));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#10B981";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Session baseline ${baseline.toFixed(0)} bpm`, pad.left + 6, toY(baseline) - 7);
  }
}

function drawRestHrvChart(canvasId, report) {
  const points = report.rest.windows
    .filter((window) => window.rmssd > 0)
    .map((window) => ({ timeSec: window.centerSec, value: window.rmssd }));
  drawTimeSeriesBase(canvasId, points, "RMSSD Trend (Valid 5-Minute Windows)", "#8B5CF6", { maxTime: report.universal.durationSec, bounds: chartBounds(points, 0, 100) });
}

function drawRhythmTimeline(canvasId, report) {
  const c = setupCanvas(canvasId);
  if (!c) return;
  const { ctx, w, h } = c;
  const pad = { top: 46, right: 24, bottom: 34, left: 90 };
  const plotW = w - pad.left - pad.right;
  const lanes = [
    { type: "ectopic", label: "Premature", color: "#F97316" },
    { type: "pause", label: "Long interval", color: "#EF4444" },
    { type: "irregular", label: "Irregular seq.", color: "#8B5CF6" },
    { type: "bradycardia", label: "Bradycardia", color: "#3B82F6" },
    { type: "high-hr", label: "High sleep HR", color: "#F43F5E" }
  ];
  ctx.fillStyle = "#10243d";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("Rhythm Screening Timeline", pad.left, 22);
  lanes.forEach((lane, index) => {
    const y = pad.top + index * ((h - pad.top - pad.bottom) / lanes.length) + 10;
    ctx.fillStyle = "#607087";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(lane.label, pad.left - 10, y + 3);
    ctx.strokeStyle = "rgba(16,36,61,0.08)";
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
    const events = report.rhythm.events.filter((event) => event.type === lane.type);
    for (const event of events) {
      const start = event.timeSec ?? event.startSec;
      const end = event.endSec ?? start + Math.max(5, report.universal.durationSec * 0.003);
      const x = pad.left + start / report.universal.durationSec * plotW;
      const width = Math.max(3, (end - start) / report.universal.durationSec * plotW);
      ctx.fillStyle = lane.color;
      ctx.fillRect(x, y - 6, width, 12);
    }
  });
  ctx.fillStyle = "#607087";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("0:00", pad.left, h - 8);
  ctx.textAlign = "right";
  ctx.fillText(fmtTime(report.universal.durationSec), pad.left + plotW, h - 8);
}

// ───────────────────── Draw: Sleep-stage proxy hypnogram ─────────────────────
function drawHypnogram(canvasId, stageProxy, durationSec) {
  const c = setupCanvas(canvasId);
  if (!c) return;
  if (!stageProxy?.available) {
    drawChartMessage(canvasId, "Cardiac Sleep-Stage Proxy", "Requires at least one hour of scored sleep-like data.");
    return;
  }
  const { ctx, w, h } = c;
  const pad = { top: 40, right: 20, bottom: 30, left: 88 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const lanes = [
    { stage: "wake-like", label: "Wake-like", color: "#F59E0B" },
    { stage: "rem-like", label: "REM-like", color: "#8B5CF6" },
    { stage: "light-like", label: "Light-like", color: "#38BDF8" },
    { stage: "deep-like", label: "Deep-like", color: "#0E766E" }
  ];
  const laneIndex = new Map(lanes.map((lane, index) => [lane.stage, index]));
  const laneHeight = plotH / lanes.length;
  ctx.fillStyle = "#10243d";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Cardiac Sleep-Stage Proxy (HR/HRV-based; not polysomnography)", pad.left, 22);
  lanes.forEach((lane, index) => {
    const y = pad.top + index * laneHeight;
    ctx.fillStyle = "#607087";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(lane.label, pad.left - 8, y + laneHeight / 2 + 3);
    ctx.strokeStyle = "rgba(16,36,61,0.06)";
    ctx.beginPath();
    ctx.moveTo(pad.left, y + laneHeight);
    ctx.lineTo(pad.left + plotW, y + laneHeight);
    ctx.stroke();
  });
  let previous = null;
  for (const entry of stageProxy.stages) {
    const index = laneIndex.get(entry.stage);
    const x = pad.left + entry.startSec / durationSec * plotW;
    const width = Math.max(1, (entry.endSec - entry.startSec) / durationSec * plotW);
    if (index === undefined) { previous = null; continue; }
    const y = pad.top + index * laneHeight + laneHeight * 0.25;
    ctx.fillStyle = lanes[index].color;
    ctx.fillRect(x, y, width, laneHeight * 0.5);
    if (previous && previous.index !== index) {
      ctx.strokeStyle = "rgba(96,112,135,0.35)";
      ctx.beginPath();
      ctx.moveTo(x, previous.centerY);
      ctx.lineTo(x, y + laneHeight * 0.25);
      ctx.stroke();
    }
    previous = { index, centerY: y + laneHeight * 0.25 };
  }
  ctx.fillStyle = "#607087";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("0:00", pad.left, h - 8);
  ctx.textAlign = "right";
  ctx.fillText(fmtTime(durationSec), pad.left + plotW, h - 8);
  const minutes = stageProxy.minutes;
  ctx.textAlign = "center";
  ctx.fillText(`Deep-like ${minutes.deep.toFixed(0)} min | Light-like ${minutes.light.toFixed(0)} min | REM-like ${minutes.rem.toFixed(0)} min | Wake-like ${minutes.wake.toFixed(0)} min`, pad.left + plotW / 2, h - 8);
}

// ───────────────────── Draw: LF / HF spectral trend ─────────────────────
function drawLfHfChart(canvasId, lfhfTrend, durationSec) {
  const c = setupCanvas(canvasId);
  if (!c) return;
  const points = (lfhfTrend ?? []).filter((point) => Number.isFinite(point.lf) && Number.isFinite(point.hf) && point.lf > 0 && point.hf > 0);
  if (points.length < 2) {
    drawChartMessage(canvasId, "Autonomic Balance (LF / HF Power)", "Not enough valid 5-minute HRV windows for spectral analysis.");
    return;
  }
  const { ctx, w, h } = c;
  const pad = { top: 40, right: 18, bottom: 32, left: 56 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const logValues = points.flatMap((point) => [Math.log10(point.lf), Math.log10(point.hf)]);
  const minLog = Math.floor(Math.min(...logValues));
  const maxLog = Math.ceil(Math.max(...logValues));
  const toX = (timeSec) => pad.left + clamp(timeSec / Math.max(1, durationSec), 0, 1) * plotW;
  const toY = (value) => pad.top + plotH - clamp((Math.log10(value) - minLog) / Math.max(1, maxLog - minLog), 0, 1) * plotH;
  ctx.fillStyle = "#10243d";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Autonomic Balance: LF and HF Power per 5-Minute Window", pad.left, 22);
  for (let exponent = minLog; exponent <= maxLog; exponent++) {
    const y = toY(10 ** exponent);
    ctx.strokeStyle = "rgba(16,36,61,0.07)";
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
    ctx.fillStyle = "#607087";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${(10 ** exponent).toLocaleString()}`, pad.left - 6, y + 3);
  }
  const series = [
    { key: "lf", color: "#8B5CF6", label: "LF (0.04-0.15 Hz)" },
    { key: "hf", color: "#0EA5C6", label: "HF (0.15-0.4 Hz)" }
  ];
  series.forEach((line, index) => {
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((point, pointIndex) => {
      const x = toX(point.timeSec);
      const y = toY(point[line.key]);
      if (pointIndex === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = line.color;
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(line.label, pad.left + 10 + index * 130, 34);
  });
  ctx.fillStyle = "#607087";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("ms² (log scale)", pad.left + plotW - 80, 34);
  ctx.fillText("0:00", pad.left, h - 8);
  ctx.textAlign = "right";
  ctx.fillText(fmtTime(durationSec), pad.left + plotW, h - 8);
}

// ───────────────────── Key findings ─────────────────────
function renderKeyFindings(report) {
  const container = document.getElementById("key-findings");
  if (!container) return;
  const findings = buildKeyFindings(report, resolvedActivityMode(report));
  if (!findings.length) {
    container.innerHTML = `<p class="muted">No prioritized findings for this recording. Review the sections below for detail.</p>`;
    return;
  }
  const severityLabel = { action: "Action", watch: "Watch", good: "Good", info: "Info" };
  container.innerHTML = findings.map((finding, index) => `
    <article class="finding-card finding-${finding.severity}">
      <div class="finding-head">
        <span class="finding-chip">${severityLabel[finding.severity] ?? "Info"}</span>
        <strong>${finding.title}</strong>
      </div>
      <p>${finding.detail}</p>
      ${Number.isFinite(finding.timeSec) ? `<button type="button" class="finding-jump" data-jump="${finding.timeSec}">Inspect at ${fmtTime(finding.timeSec)}</button>` : ""}
    </article>`).join("");
  container.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => jumpToTime(Number(button.dataset.jump)));
  });
}

// ───────────────────── Statistics dashboard ─────────────────────
function statValue(value, digits = 1, suffix = "") {
  return Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : "--";
}

function statsTable(title, rows, note = "") {
  const body = rows
    .filter((row) => row)
    .map((row) => `<tr><th scope="row">${row[0]}</th><td>${row[1]}</td><td class="stat-ref">${row[2] ?? ""}</td></tr>`)
    .join("");
  return `<div class="stats-table-card">
    <h3>${title}</h3>
    <div class="stats-table-wrap" tabindex="0"><table class="stats-table">
      <thead><tr><th scope="col">Metric</th><th scope="col">Value</th><th scope="col">Reference / note</th></tr></thead>
      <tbody>${body}</tbody>
    </table></div>
    ${note ? `<p class="stats-note">${note}</p>` : ""}
  </div>`;
}

function renderStatisticsTables(report) {
  const container = document.getElementById("stats-tables");
  if (!container) return;
  const mode = resolvedActivityMode(report);
  const workoutMode = mode === "workout" || mode === "mixed";
  const u = report.universal;
  const hrv = report.hrv ?? {};
  const time = hrv.time ?? report.rest.hrv ?? {};
  const freq = hrv.frequency;
  const nonlinear = hrv.nonlinear ?? {};
  const rhythm = report.rhythm;
  const verification = rhythm.verification ?? {};
  const hrSource = workoutMode ? report.workout.hr : report.rest.hr;
  const tables = [];

  tables.push(statsTable("Heart Rate", [
    ["Average", statValue(hrSource.avg, 0, " bpm")],
    ["Median", statValue(hrSource.median, 0, " bpm")],
    ["Clean min / max (P1 / P99)", `${statValue(hrSource.min, 0)} / ${statValue(hrSource.max, 0)} bpm`],
    !workoutMode ? ["Resting HR estimate", statValue(report.rest.restingHr, 0, " bpm"), "Trained adults are often 40-60 bpm at rest"] : null,
    !workoutMode ? ["Lowest stable 5 min", statValue(report.rest.lowest5MinHr, 0, " bpm")] : null,
    workoutMode ? ["P5 / P25 / P75 / P95", `${statValue(report.workout.hr.percentiles.p5, 0)} / ${statValue(report.workout.hr.percentiles.p25, 0)} / ${statValue(report.workout.hr.percentiles.p75, 0)} / ${statValue(report.workout.hr.percentiles.p95, 0)} bpm`] : null,
    !workoutMode && report.rest.nocturnalDip?.available ? ["Overnight HR dip", statValue(report.rest.nocturnalDip.dipPct, 1, "%"), "A dip of roughly 8%+ from early-night HR is favorable"] : null,
    !workoutMode && Number.isFinite(report.rest.respirationBpm) ? ["Est. breathing rate", statValue(report.rest.respirationBpm, 1, " /min"), "ECG timing + QRS morphology; accepted-window median"] : null
  ]));

  tables.push(statsTable("HRV — Time Domain", [
    ["Mean NN", statValue(time.meanNN, 0, " ms")],
    ["SDNN", statValue(time.sdnn, 1, " ms"), "Short-term healthy-adult span ~32-93 ms"],
    ["RMSSD", statValue(time.rmssd, 1, " ms"), "Short-term healthy-adult span ~19-75 ms"],
    ["lnRMSSD", statValue(time.lnRMSSD, 2), "~2.9-4.3 for the RMSSD span above"],
    ["pNN50", statValue(time.pNN50, 1, "%")],
    ["pNN20", statValue(time.pNN20, 1, "%")],
    ["CVNN", statValue(time.cvNN, 1, "%"), "SDNN as a percent of mean NN"],
    ["SDANN (5-min means)", statValue(time.sdann, 1, " ms"), "Needs 3+ valid windows"],
    ["SDNN index", statValue(time.sdnnIndex, 1, " ms"), "Mean of per-window SDNN"]
  ], "Computed from artifact-screened normal-to-normal intervals across the whole recording."));

  tables.push(statsTable("HRV — Frequency Domain", freq ? [
    ["Total power (VLF+LF+HF)", statValue(freq.totalPower, 0, " ms²")],
    ["VLF power (0.0033-0.04 Hz)", statValue(freq.vlf, 0, " ms²"), "Interpret cautiously in 5-min windows"],
    ["LF power (0.04-0.15 Hz)", statValue(freq.lf, 0, " ms²")],
    ["HF power (0.15-0.4 Hz)", statValue(freq.hf, 0, " ms²"), "Vagal / respiratory band"],
    ["LF/HF ratio", statValue(freq.lfHfRatio, 2), "Posture-, breathing-, and context-dependent"],
    ["LF nu / HF nu", `${statValue(freq.lfNu, 0)} / ${statValue(freq.hfNu, 0)}%`],
    ["HF peak (legacy proxy)", statValue(freq.respirationBpm, 1, " /min"), "Restricted to 9–24 /min; see Breathing for the EDR estimate"],
    ["Valid windows", `${freq.windowCount}`, "5-minute windows meeting the HRV standard"]
  ] : [["Frequency analysis", "Unavailable", "Requires valid 5-minute HRV windows"]], hrv.frequencyNote ?? ""));

  tables.push(statsTable("HRV — Nonlinear", nonlinear.available ? [
    ["Poincaré SD1", statValue(nonlinear.sd1, 1, " ms"), "Short-term (beat-to-beat) variability"],
    ["Poincaré SD2", statValue(nonlinear.sd2, 1, " ms"), "Long-term variability"],
    ["SD1 / SD2", statValue(nonlinear.sd1Sd2Ratio, 2)],
    ["Ellipse area", statValue(nonlinear.ellipseAreaMs2, 0, " ms²")],
    ["Baevsky stress index", statValue(nonlinear.stressIndex, 1), "Higher under sympathetic load; ~50-150 typical at rest"],
    ["Triangular index (HTI)", statValue(nonlinear.triangularIndex, 1), "24-h references ~15-50; lower in short recordings"]
  ] : [["Nonlinear analysis", "Unavailable", "Requires at least 10 clean NN intervals"]]));

  tables.push(statsTable("Rhythm & Beats", [
    ["Detected R-peaks", u.detectedBeats.toLocaleString()],
    ["Clean beats", statValue(u.cleanBeatPercentage, 1, "%"), "95%+ is strong coverage"],
    ["Verified premature beats", `${rhythm.ectopicCount} of ${rhythm.ectopicCandidateCount ?? rhythm.ectopicCount} candidates`, "Template-verified against the median beat shape"],
    ["Verified long pauses", `${rhythm.pauseCount} of ${rhythm.pauseCandidateCount ?? rhythm.pauseCount} candidates`],
    ["Rejected as sensor artifact", `${(verification.artifactEctopicCount ?? 0) + (verification.artifactPauseCount ?? 0)}`, "Distorted neighboring beats at the event"],
    ["Distinct-QRS premature beats", `${verification.distinctQrsCount ?? 0}`, "Beat shape differs from the template (wide/aberrant-like)"],
    ["Irregular sequences", `${rhythm.irregularEpisodeCount}`],
    ["Candidate burden", statValue(rhythm.candidateBurdenPer1000, 2, " / 1,000 beats")],
    ["Rhythm regularity score", `${rhythm.regularityScore}/100`]
  ], rhythm.disclaimer));

  if (workoutMode) {
    const w = report.workout;
    tables.push(statsTable("Workout Load & Response", [
      ["TRIMP (Banister)", statValue(w.trimp?.score, 0), "Compare against your own recent sessions"],
      ["Edwards load", statValue(w.loadScore, 0), "Zone-weighted minutes"],
      ["Peak HR", `${statValue(w.hr.max, 0, " bpm")}${w.peakTiming ? ` at ${fmtTime(w.peakTiming.timeSec)}` : ""}`],
      ["HR recovery 60 s", statValue(w.recovery.values[60]?.drop, 0, " bpm"), "More than 12 bpm in the first minute is the commonly cited favorable threshold"],
      ["Recovery time-constant τ", statValue(w.recovery.tauSec, 0, " s"), "Mono-exponential fit over 5 min post-peak; faster (smaller) with better fitness"],
      ["Max ramp", statValue(w.rampBpmPerMinute, 1, " bpm/min")],
      ["Detected intervals", `${w.intervalDetection.count}`],
      ["Zone 1-5 minutes", w.zones.map((zone) => zone.minutes.toFixed(0)).join(" / ")]
    ]));
  }

  container.innerHTML = tables.join("");
  const lfhfPanel = document.getElementById("lfhf-panel");
  const hasSpectral = (report.visualizationData.lfhfTrend?.length ?? 0) >= 2;
  lfhfPanel?.classList.toggle("hidden", !hasSpectral);
}

// ───────────────────── Hourly sleep table ─────────────────────
function renderHourlyTable(report) {
  const wrap = document.getElementById("hourly-table-wrap");
  if (!wrap) return;
  const hourly = report.rest.hourly ?? [];
  const meaningful = hourly.filter((hour) => hour.usableWindowCount > 0);
  if (meaningful.length < 2) {
    wrap.classList.add("hidden");
    return;
  }
  wrap.classList.remove("hidden");
  const rows = hourly.map((hour) => `<tr>
    <th scope="row">${fmtTime(hour.startSec)}–${fmtTime(hour.endSec)}</th>
    <td>${statValue(hour.avgHr, 0)}</td>
    <td>${statValue(hour.minHr, 0)}</td>
    <td>${statValue(hour.rmssd, 0)}</td>
    <td>${statValue(hour.lfHfRatio, 1)}</td>
    <td>${statValue(hour.respirationBpm, 1)} (${statValue(hour.respirationCoveragePct, 0)}%)</td>
    <td>${statValue(hour.cleanCoveragePct, 0)}%</td>
  </tr>`).join("");
  wrap.innerHTML = `<h3 class="stats-inline-title">Hour-by-Hour Summary</h3>
  <table class="stats-table">
    <thead><tr><th scope="col">Hour</th><th scope="col">Avg HR (bpm)</th><th scope="col">Min HR (bpm)</th><th scope="col">RMSSD (ms)</th><th scope="col">LF/HF</th><th scope="col">Est. breaths/min (coverage)</th><th scope="col">Good data</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ───────────────────── Event review queue ─────────────────────
const EVENT_TYPE_LABELS = {
  ectopic: "Premature beat",
  pause: "Long pause",
  irregular: "Irregular sequence",
  bradycardia: "Bradycardia",
  "high-hr": "High sleeping HR"
};

function renderEventTable(report) {
  const wrap = document.getElementById("event-table-wrap");
  if (!wrap) return;
  const events = (report.rhythm.events ?? []).slice(0, 200);
  if (!events.length) {
    wrap.innerHTML = `<p class="muted event-empty">No screening events were detected in usable signal. Nothing requires waveform review.</p>`;
    return;
  }
  const rows = events.map((event) => {
    const timeSec = event.timeSec ?? event.startSec;
    const isArtifact = event.classification === "artifact-suspected";
    const statusChip = isArtifact
      ? `<span class="event-chip event-chip-artifact">Artifact</span>`
      : event.classification === "verified"
        ? `<span class="event-chip event-chip-verified">Verified</span>`
        : `<span class="event-chip event-chip-info">Screening</span>`;
    const detail = event.rrMs ? `RR ${Math.round(event.rrMs)} ms`
      : event.endSec ? `${fmtTime(event.startSec)}–${fmtTime(event.endSec)}`
        : "";
    const morphology = event.morphology === "distinct-qrs" ? "Distinct QRS shape"
      : event.morphology === "narrow-similar" ? "Normal QRS shape"
        : event.morphology === "flanked-by-normal-beats" ? "Clean flanking beats"
          : "";
    return `<tr class="${isArtifact ? "event-row-artifact" : ""}">
      <td>${fmtTime(timeSec)}</td>
      <td>${EVENT_TYPE_LABELS[event.type] ?? event.type}</td>
      <td>${statusChip}</td>
      <td>${morphology}</td>
      <td>${detail}</td>
      <td><button type="button" class="event-inspect" data-jump="${timeSec}">Inspect</button></td>
    </tr>`;
  }).join("");
  wrap.innerHTML = `<table class="stats-table event-table">
    <thead><tr><th scope="col">Time</th><th scope="col">Type</th><th scope="col">Verification</th><th scope="col">Morphology</th><th scope="col">Detail</th><th scope="col"></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  ${report.rhythm.events.length > 200 ? `<p class="muted event-empty">Showing the first 200 of ${report.rhythm.events.length} events.</p>` : ""}`;
  wrap.querySelectorAll(".event-inspect").forEach((button) => {
    button.addEventListener("click", () => jumpToTime(Number(button.dataset.jump)));
  });
}

const METRIC_EXPLANATIONS = {
  "Recording duration": "Elapsed time between the first and last valid ECG timestamps.",
  "Estimated sample rate": "How many ECG voltage samples were recorded each second, estimated from the median timestamp spacing.",
  "Total samples": "The number of usable ECG voltage measurements included in the analysis.",
  "Missing samples / gaps": "Estimated missing measurements and distinct timestamp breaks relative to the usual sample interval.",
  "Signal quality": "A 0-100 composite of recording continuity, R-peak detector agreement, beat-shape consistency, and clean-beat coverage.",
  "Clean beats": "The percentage of detected RR intervals retained after excluding implausible or event-adjacent beats.",
  "R-peak confidence": "Agreement between two independent R-peak detectors within 100 milliseconds.",
  "Activity type": "The recording's automatically inferred context based on duration, heart-rate level, and heart-rate changes.",
  "Morphology consistency": "How closely sampled ECG beat shapes resemble one another; lower values can indicate noise, motion, or changing contact.",
  "Accepted ECG files": "CSV members with a recognized timestamp and ECG-voltage column. ZIP metadata sidecars and invalid schemas are ignored and reported.",
  "Timestamp cleanup": "Duplicate timestamps are removed, out-of-order rows are sorted, and relative timestamp resets are joined before analysis.",
  "Noise / baseline": "Relative short-window indices used to consolidate high-frequency noise, baseline steps, flatline, and likely contact displacement.",
  "Average HR": "Mean clean heart rate across the recording.",
  "Clean min / max HR": "Robust low and high clean heart-rate estimates using the 1st and 99th percentiles rather than isolated extremes.",
  "HR percentiles": "The heart-rate values below which 5%, 25%, 50%, 75%, and 95% of clean beats fall.",
  "HR trend": "The overall hourly slope through clean 15-second median heart-rate points.",
  "Max HR ramp": "The fastest sustained rise in heart rate measured across a one-minute span.",
  "Peak timing": "When the highest clean 15-second heart-rate value occurred and how far it was into the recording.",
  "HR recovery 30 / 60 / 120s": "The heart-rate decrease from the detected peak to clean values 30, 60, and 120 seconds later.",
  "Intervals": "Repeated sustained high-heart-rate efforts separated by lower-heart-rate recovery periods.",
  "Workout load": "Edwards-style internal load: minutes in each estimated heart-rate zone multiplied by zone weights from 1 to 5.",
  "HR drift proxy": "The percent change between early and late sustained-work heart rate; ECG alone cannot confirm constant workload.",
  "Spike / drop flags": "Clean heart-rate changes of at least 20 bpm in roughly 30 seconds that are not explained by detected intervals.",
  "Zone 1 / 2": "Time below 70% of estimated maximum heart rate, split into the first two intensity zones.",
  "Zone 3 / 4 / 5": "Time at or above 70% of estimated maximum heart rate, split into moderate through highest intensity zones.",
  "Peak per interval": "The highest clean heart rate reached within each confidently detected interval.",
  "Average / median HR": "Mean and midpoint clean heart rate; the median is less affected by brief highs or lows.",
  "Resting HR estimate": "The median heart rate from the lowest stable, high-quality windows in this recording.",
  "Lowest stable 5 min": "The lowest average heart rate among stable five-minute windows with adequate clean-beat coverage.",
  "Lowest stable 10 min": "The lowest weighted average across two adjacent stable five-minute windows.",
  "HRV-valid duration": "Total duration of five-minute windows with enough clean normal-to-normal intervals for HRV analysis.",
  "RMSSD / lnRMSSD": "Short-term beat-to-beat variability and its natural-log transform, calculated from clean normal-to-normal intervals.",
  "SDNN / pNN50": "Overall normal-to-normal interval variability and the percent of successive interval pairs differing by more than 50 ms.",
  "HR stability": "A 0-100 score that decreases with greater heart-rate dispersion or a stronger sustained trend.",
  "Recovery vs session baseline": "A within-recording score combining stable heart rate, lnRMSSD, and clean-beat coverage; it is not a cross-night baseline.",
  "Suppressed HRV": "Flags consecutive valid windows whose lnRMSSD is meaningfully below this recording's session reference.",
  "Elevated resting HR": "Flags sustained stable heart rate at least 10 bpm above this recording's resting reference.",
  "Bradycardia candidates": "Clean episodes below 40 bpm lasting at least 30 seconds; these are screening candidates, not diagnoses.",
  "High sleeping HR": "Sleep/rest episodes lasting at least five minutes above both an absolute and session-relative threshold.",
  "Review priority": "A screening priority derived from clean-signal pause, ectopic, and irregular episode burden.",
  "Rhythm regularity": "A 0-100 score reduced by ectopic candidates, pause candidates, and irregular rhythm episodes.",
  "Premature-beat candidates": "Premature-short followed by compensatory-long RR patterns in otherwise usable signal.",
  "Long-interval candidates": "RR intervals at least two seconds long and at least 1.5 times their local median.",
  "Irregular sequences": "At least 30 seconds of locally irregular RR timing in signal with sufficient beat coverage.",
  "Signal-quality episodes": "Contiguous low-quality periods are grouped before rhythm screening so contact loss does not become a cascade of beat warnings.",
  "Signal-related exclusions": "Non-physiologic RR intervals omitted from clean heart-rate, HRV, and rhythm calculations."
};

function estimatedMaximumHeartRate(age = currentProfile?.age) {
  const knownMaximum = Number(currentProfile?.knownMaxHr);
  if (Number.isFinite(knownMaximum) && knownMaximum >= 100) return knownMaximum;
  const numericAge = Number(age);
  return Number.isFinite(numericAge) ? Math.max(100, 220 - numericAge) : null;
}

function heartRateReferenceContext(age = currentProfile?.age) {
  const numericAge = Number(age);
  const estimatedMax = estimatedMaximumHeartRate(numericAge);
  if (!Number.isFinite(estimatedMax)) {
    return "For most adults, calm waking resting heart rate is commonly 60-100 bpm; exercise ranges require age and individual context.";
  }
  const knownMaximum = Number(currentProfile?.knownMaxHr);
  const maxContext = Number.isFinite(knownMaximum) && knownMaximum >= 100
    ? `Using the athlete-provided maximum HR of ${estimatedMax} bpm`
    : `For age ${numericAge}, this app estimates maximum HR at ${estimatedMax} bpm`;
  const exerciseContext = `${maxContext}; roughly ${Math.round(estimatedMax * 0.5)}-${Math.round(estimatedMax * 0.7)} bpm is its moderate-intensity reference and ${Math.round(estimatedMax * 0.7)}-${Math.round(estimatedMax * 0.85)} bpm its vigorous reference.`;
  if (numericAge < 18) {
    return `Resting ranges for children and adolescents vary with age and clinical context, so adult cutoffs should not be applied. ${exerciseContext}`;
  }
  return `For most adults, calm waking resting HR is commonly 60-100 bpm; trained people may be near 40 bpm. ${exerciseContext}`;
}

function zoneReferenceContext(age = currentProfile?.age) {
  const numericAge = Number(age);
  const estimatedMax = estimatedMaximumHeartRate(numericAge);
  if (!Number.isFinite(estimatedMax)) {
    return "This app uses Zone 1 <60%, Zone 2 60-69%, Zone 3 70-79%, Zone 4 80-89%, and Zone 5 at least 90% of age-estimated maximum HR.";
  }
  const bounds = [0.6, 0.7, 0.8, 0.9].map((ratio) => Math.round(estimatedMax * ratio));
  const knownMaximum = Number(currentProfile?.knownMaxHr);
  const source = Number.isFinite(knownMaximum) && knownMaximum >= 100
    ? `athlete-provided max ${estimatedMax} bpm`
    : `age-estimated max ${estimatedMax} bpm`;
  return `Using ${source}: Zone 1 <${bounds[0]}, Zone 2 ${bounds[0]}-${bounds[1] - 1}, Zone 3 ${bounds[1]}-${bounds[2] - 1}, Zone 4 ${bounds[2]}-${bounds[3] - 1}, and Zone 5 at least ${bounds[3]} bpm. Zones remain training context, not clinical thresholds.`;
}

function metricReferenceContext(label) {
  const heartRateLabels = new Set([
    "Average HR",
    "Clean min / max HR",
    "HR percentiles",
    "Average / median HR",
    "Resting HR estimate",
    "Lowest stable 5 min",
    "Lowest stable 10 min"
  ]);
  if (heartRateLabels.has(label)) return heartRateReferenceContext();

  const contexts = {
    "Recording duration": "There is no universal ideal duration. In this app, one HRV window needs 5 minutes, the stable 10-minute low needs adjacent valid windows, and HR drift requires at least 30 minutes.",
    "Estimated sample rate": "The expected value is the recording device's configured rate and should remain nearly constant. A stable rate matters more than a particular number; the bundled example recordings are near 130 Hz.",
    "Total samples": "Expected samples are approximately duration multiplied by sample rate. A value close to the expected count indicates good continuity.",
    "Missing samples / gaps": "Ideal is 0 missing samples and 0 gaps. Small isolated gaps may be usable, but increasing gap time reduces continuity and confidence.",
    "Signal quality": "App bands: 90-100 Excellent, 75-89 Good, 55-74 Fair, and below 55 Poor. These are analysis-quality bands, not clinical grades.",
    "Clean beats": "Closer to 100% is better. As an app guide, at least 95% is strong coverage, 90-94% is usable with caution, and below 90% increasingly limits HRV and rhythm interpretation.",
    "R-peak confidence": "Closer to 100% is better. As an app guide, at least 90% is high agreement, 80-89% is moderate, and below 80% deserves closer signal review.",
    "Activity type": "There is no typical value. Classification confidence of 80-100% is stronger, 60-79% is tentative, and below 60% should usually be checked or overridden.",
    "Morphology consistency": "Closer to 100% is better. As an app guide, at least 90% is highly consistent, 75-89% is moderate, and below 75% can reflect noise, contact change, motion, or genuine beat-shape variation.",
    "HR trend": "Near 0 bpm/hour is typical for a steady rest or steady-effort segment. Positive or negative slopes can be expected during warm-up, progression, fatigue, recovery, or sleep-stage changes.",
    "Max HR ramp": "There is no universal normal ramp. Near 0 bpm/min suggests steady effort; larger positive values are expected during workout starts and intervals.",
    "Peak timing": "There is no typical percentage. A late peak is common in progressive efforts; interval sessions may peak earlier or repeatedly.",
    "HR recovery 30 / 60 / 120s": "Protocol matters. In a widely used one-minute exercise-test definition, a drop of more than 12 bpm was above the abnormal cutoff; 30- and 120-second values do not have one universal threshold.",
    "Intervals": "There is no typical count. The meaningful comparison is whether detected efforts match the planned workout and show repeatable peaks and recoveries.",
    "Workout load": "There is no universal healthy range because the score scales with both duration and intensity. Compare similar workouts and your own recent load rather than another person's score.",
    "HR drift proxy": "Closer to 0% indicates steadier HR. Positive drift can occur with heat, dehydration, fatigue, or changing effort, but ECG alone cannot verify a constant external workload.",
    "Spike / drop flags": "A typical clean, steady recording has 0 unexplained flags. This app flags changes of at least 20 bpm in about 30 seconds outside detected interval transitions.",
    "Zone 1 / 2": zoneReferenceContext(),
    "Zone 3 / 4 / 5": zoneReferenceContext(),
    "Peak per interval": "There is no universal range. Compare peaks across intervals and against the age-estimated zones; repeatable peaks are usually more informative than one isolated maximum.",
    "HRV-valid duration": "At least 5 clean minutes supports one short-term HRV window. More valid windows improve trend interpretation, but values from different recording lengths should not be compared directly.",
    "RMSSD / lnRMSSD": "Published short-term healthy-adult references span roughly RMSSD 19-75 ms, equivalent to lnRMSSD 2.94-4.32. Age, posture, breathing, sleep, recording length, and personal baseline can shift values substantially.",
    "SDNN / pNN50": "Published short-term healthy-adult references span roughly SDNN 32-93 ms. pNN50 has no single broadly applicable normal range and generally changes with age and recording conditions.",
    "HR stability": "App bands: 85-100 stable, 70-84 moderately variable, and below 70 more variable. Workout ramps and normal sleep-stage changes can lower this score.",
    "Recovery vs session baseline": "App bands: 80-100 favorable within this recording, 60-79 mixed, and below 60 below the session reference. It is not a clinical score or a comparison with prior nights.",
    "Suppressed HRV": "A typical unflagged result is 0 qualifying episodes. The app requires two consecutive valid windows at least one robust deviation below this session's median lnRMSSD.",
    "Elevated resting HR": "A typical unflagged result is 0 episodes. The app flags sustained stable HR at least 10 bpm above this recording's resting reference.",
    "Bradycardia candidates": "A typical candidate count is 0. This app uses <40 bpm for at least 30 seconds; low rates can occur during sleep or in trained people, so context and symptoms matter.",
    "High sleeping HR": "A typical candidate count is 0. This app requires at least 5 minutes above both 100 bpm and 20 bpm over the session reference.",
    "Review priority": "App levels are Low, Moderate, and High. Low means few screening candidates; Moderate or High means the signal and event timeline deserve closer human review.",
    "Rhythm regularity": "App bands: 90-100 highly regular, 75-89 some candidate burden, and below 75 greater candidate burden. This score is not a rhythm diagnosis.",
    "Premature-beat candidates": "A typical clean recording has 0 or a low candidate burden. There is no diagnostic normal range for this app's screening detector; inspect the ECG around candidates.",
    "Long-interval candidates": "A typical candidate count is 0. This app flags RR intervals at least 2.0 seconds and at least 1.5 times the local median; candidates require waveform review.",
    "Irregular sequences": "A typical candidate count is 0. Any sequence is a screening prompt for waveform review, not a diagnosis.",
    "Signal-quality episodes": "Fewer is better, but one consolidated episode may contain many excluded beat intervals. This count is intentionally not expanded into repeated rhythm warnings.",
    "Signal-related exclusions": "Closer to 0 is better. As an app guide, under 5% excluded beats is strong coverage, while 10% or more increasingly limits confidence."
  };
  return contexts[label] || "";
}

function metricCard(label, value, detail = "", tone = "", progress = null) {
  const progressMarkup = Number.isFinite(progress)
    ? `<div class="metric-bar" aria-hidden="true"><span style="width:${clamp(progress, 0, 100)}%"></span></div>`
    : "";
  const explanation = METRIC_EXPLANATIONS[label] || detail || "This value summarizes the corresponding clean ECG-derived measurement.";
  const referenceContext = metricReferenceContext(label);
  const referenceMarkup = referenceContext
    ? `<p class="metric-reference"><strong>Typical / reference context:</strong> ${referenceContext}</p>`
    : "";
  const currentNote = detail && detail !== explanation ? `<p class="metric-current-note"><strong>This recording:</strong> ${detail}</p>` : "";
  return `<article class="highlight-card metric-card ${tone}">
    <span class="metric-label">${label}</span>
    <strong>${value}</strong>
    <details class="metric-explanation">
      <summary>What this metric means</summary>
      <p>${explanation}</p>
      ${referenceMarkup}
      ${currentNote}
    </details>
    ${progressMarkup}
  </article>`;
}

function availableValue(value, formatter, unavailable = "Unavailable") {
  return Number.isFinite(value) ? formatter(value) : unavailable;
}

function resolvedActivityMode(report = currentReport) {
  if (!report) return "rest";
  return selectedMode === "auto" ? report.classification.inferredMode : selectedMode;
}

function updateModeVisibility(report) {
  const mode = resolvedActivityMode(report);
  const showWorkout = mode === "workout" || mode === "mixed";
  const showRest = mode === "sleep" || mode === "rest" || mode === "mixed";
  document.getElementById("workout-mode-section").classList.toggle("hidden", !showWorkout);
  document.getElementById("rest-mode-section").classList.toggle("hidden", !showRest);
  document.getElementById("report-type-title").textContent = `${mode.toUpperCase()} ANALYSIS`;
  document.getElementById("report-type-desc").textContent = mode === "mixed"
    ? "Workout-like and low-activity segments are shown together."
    : showWorkout
      ? "Heart-rate response, zones, interval structure, strain, recovery, and rhythm screening."
      : "Resting heart rate, HRV, within-recording recovery context, stability, and rhythm screening.";
  report.classification.selectedMode = mode;
  report.classification.override = selectedMode !== "auto";
  const confidence = document.getElementById("activity-confidence");
  confidence.textContent = selectedMode === "auto"
    ? `${report.classification.confidence}% classification confidence`
    : "User-selected interpretation";
  document.getElementById("activity-reason").textContent = selectedMode === "auto"
    ? report.classification.reason
    : `Automatic result: ${report.classification.inferredMode} (${report.classification.confidence}% confidence).`;
}

function buildHeartAnalysisExport(report, profile) {
  const mode = resolvedActivityMode(report);
  const u = report.universal;
  const w = report.workout;
  const r = report.rest;
  const rhythm = report.rhythm;
  const lines = [
    "HEART ANALYSIS FOR GENERATIVE AI",
    "Format: pipe-delimited key-value sections. Raw ECG samples are intentionally excluded.",
    "Instruction to AI: Review this heart analysis and the user's symptoms to provide insights into their cardiovascular health.",
    "",
    "[PROFILE_AND_RECORDING]",
    `name=${profile?.name || "unknown"} | age=${profile?.age ?? "unknown"} | selected_mode=${mode}`,
    `recording_type=${profile?.recordingType || "auto"}`,
    `symptoms_or_notes=${profile?.symptoms || "none"}`,
    `inferred_mode=${report.classification.inferredMode} | classification_confidence_pct=${report.classification.confidence} | user_override=${report.classification.override}`,
    `classification_reason=${report.classification.reason}`,
    "",
    "[UNIVERSAL_QUALITY]",
    `duration_s=${u.durationSec.toFixed(2)} | sample_rate_hz=${u.sampleRate.toFixed(3)} | total_samples=${u.totalSamples} | expected_samples=${u.expectedSamples}`,
    `gap_count=${u.gapCount} | missing_samples_estimate=${u.missingSamples} | gap_duration_s=${u.gapDurationSec.toFixed(3)}`,
    `quality_score=${u.qualityScore} | quality_level=${u.qualityLevel} | clean_beats_pct=${u.cleanBeatPercentage.toFixed(2)} | r_peak_confidence_pct=${u.rPeakConfidence.toFixed(2)}`,
    `quality_continuity_pct=${u.qualityComponents.continuity.toFixed(1)} | quality_morphology_pct=${u.qualityComponents.morphology.toFixed(1)} | quality_detector_agreement_pct=${u.qualityComponents.rPeakAgreement.toFixed(1)}`,
    `hr_usable_pct=${u.hrUsablePercentage.toFixed(1)} | hrv_usable_pct=${u.hrvUsablePercentage.toFixed(1)} | morphology_usable_pct=${u.morphologyUsablePercentage.toFixed(1)}`,
    `hr_quality_grade=${u.qualityGrades.hr} | hrv_quality_grade=${u.qualityGrades.hrv} | morphology_quality_grade=${u.qualityGrades.morphology}`,
    `flatline_s=${u.flatlineDurationSec.toFixed(1)} | clipped_samples_pct=${u.clippedSamplePercentage.toFixed(3)} | displacement_episodes=${u.displacementEpisodeCount}`,
    `accepted_csv_files=${u.ingestion.acceptedFileCount} | skipped_csv_files=${u.ingestion.skippedFileCount} | timestamp_duplicates=${u.ingestion.duplicateCount} | timestamp_resets=${u.ingestion.resetCount}`,
    "",
    "[RHYTHM_SCREENING]",
    `rhythm_regularity_score=${rhythm.regularityScore} | review_priority=${rhythm.reviewPriority}`,
    `ectopic_candidates=${rhythm.ectopicCount} | ectopic_burden_pct=${rhythm.ectopicBurdenPct.toFixed(3)} | pause_candidates=${rhythm.pauseCount} | pause_burden_pct=${rhythm.pauseBurdenPct.toFixed(3)}`,
    `irregular_episodes=${rhythm.irregularEpisodeCount} | bradycardia_episodes=${rhythm.bradycardiaEpisodeCount} | high_sleeping_hr_episodes=${rhythm.highSleepingHrEpisodeCount}`,
    `candidate_burden_per_1000_usable_beats=${rhythm.candidateBurdenPer1000.toFixed(3)} | consolidated_artifact_episodes=${rhythm.artifactEpisodes.length} | artifact_excluded_intervals=${rhythm.artifactExcludedIntervalCount}`,
    `verified_ectopic=${rhythm.verification?.verifiedEctopicCount ?? rhythm.ectopicCount} | artifact_rejected_ectopic=${rhythm.verification?.artifactEctopicCount ?? 0} | verified_pause=${rhythm.verification?.verifiedPauseCount ?? rhythm.pauseCount} | artifact_rejected_pause=${rhythm.verification?.artifactPauseCount ?? 0} | distinct_qrs_ectopic=${rhythm.verification?.distinctQrsCount ?? 0}`,
    `event_timeline=${rhythm.events.slice(0, 100).map((event) => `${event.type}${event.classification === "artifact-suspected" ? "(artifact)" : ""}@${fmtTime(event.timeSec ?? event.startSec)}`).join(",") || "none"}`,
  ];
  const hrvX = report.hrv;
  if (hrvX) {
    const freq = hrvX.frequency;
    const nl = hrvX.nonlinear ?? {};
    lines.push(
      "",
      "[HRV_EXTENDED]",
      `mean_nn_ms=${hrvX.time?.meanNN?.toFixed(0) ?? "--"} | cvnn_pct=${hrvX.time?.cvNN?.toFixed(1) ?? "--"} | pnn20_pct=${hrvX.time?.pNN20?.toFixed(1) ?? "--"} | sdann_ms=${hrvX.time?.sdann?.toFixed(1) ?? "--"} | sdnn_index_ms=${hrvX.time?.sdnnIndex?.toFixed(1) ?? "--"}`,
      freq
        ? `vlf_ms2=${freq.vlf?.toFixed(0)} | lf_ms2=${freq.lf?.toFixed(0)} | hf_ms2=${freq.hf?.toFixed(0)} | total_power_ms2=${freq.totalPower?.toFixed(0)} | lf_hf_ratio=${freq.lfHfRatio?.toFixed(2)} | lf_nu=${freq.lfNu?.toFixed(0)} | hf_nu=${freq.hfNu?.toFixed(0)} | legacy_hf_peak_per_min=${freq.respirationBpm?.toFixed(1) ?? "--"} | valid_windows=${freq.windowCount}`
        : "frequency_domain=unavailable",
      nl.available
        ? `poincare_sd1_ms=${nl.sd1?.toFixed(1)} | poincare_sd2_ms=${nl.sd2?.toFixed(1)} | sd1_sd2_ratio=${nl.sd1Sd2Ratio?.toFixed(2)} | baevsky_stress_index=${nl.stressIndex?.toFixed(1)} | triangular_index=${nl.triangularIndex?.toFixed(1)}`
        : "nonlinear=unavailable"
    );
  }
  const findings = buildKeyFindings(report, mode);
  if (findings.length) {
    lines.push(
      "",
      "[KEY_FINDINGS]",
      ...findings.map((finding, index) => `finding_${index + 1}=[${finding.severity.toUpperCase()}] ${finding.title}: ${finding.detail}`)
    );
  }
  if (mode === "workout" || mode === "mixed") {
    lines.push(
      "",
      "[WORKOUT]",
      `avg_hr_bpm=${w.hr.avg.toFixed(1)} | median_hr_bpm=${w.hr.median.toFixed(1)} | clean_min_hr_bpm=${w.hr.min.toFixed(1)} | clean_max_hr_bpm=${w.hr.max.toFixed(1)}`,
      `p5=${w.hr.percentiles.p5.toFixed(1)} | p25=${w.hr.percentiles.p25.toFixed(1)} | p50=${w.hr.percentiles.p50.toFixed(1)} | p75=${w.hr.percentiles.p75.toFixed(1)} | p95=${w.hr.percentiles.p95.toFixed(1)}`,
      `trend_bpm_per_hour=${w.trendBpmPerHour.toFixed(2)} | max_ramp_bpm_per_min=${w.rampBpmPerMinute.toFixed(2)} | peak_hr_bpm=${w.peakTiming?.hr?.toFixed(1) ?? "--"} | peak_time=${w.peakTiming ? fmtTime(w.peakTiming.timeSec) : "--"}`,
      `zone_1_min=${w.zones[0].minutes.toFixed(1)} | zone_2_min=${w.zones[1].minutes.toFixed(1)} | zone_3_min=${w.zones[2].minutes.toFixed(1)} | zone_4_min=${w.zones[3].minutes.toFixed(1)} | zone_5_min=${w.zones[4].minutes.toFixed(1)}`,
      `workout_load_score=${w.loadScore.toFixed(1)} | interval_count=${w.intervalDetection.count} | interval_detection_reason=${w.intervalDetection.reason}`,
      `recovery_30_bpm=${w.recovery.values[30]?.drop?.toFixed(1) ?? "--"} | recovery_60_bpm=${w.recovery.values[60]?.drop?.toFixed(1) ?? "--"} | recovery_120_bpm=${w.recovery.values[120]?.drop?.toFixed(1) ?? "--"}`,
      `trimp_banister=${w.trimp?.score?.toFixed(1) ?? "--"} | trimp_rest_hr_reference=${w.trimp?.restHrReference?.toFixed(0) ?? "--"} | recovery_tau_s=${w.recovery?.tauSec?.toFixed(0) ?? "--"}`,
      `hr_drift_eligible=${w.drift.eligible} | hr_drift_proxy_pct=${w.drift.valuePct?.toFixed(2) ?? "--"} | hr_drift_note=${w.drift.reason}`,
      `unexplained_spike_drop_flags=${w.spikeDropFlags.map((flag) => `${flag.type}@${fmtTime(flag.timeSec)}:${flag.changeBpm.toFixed(1)}bpm`).join(",") || "none"}`,
      ...w.intervals.map((interval) => `interval_${interval.index}_peak_bpm=${interval.peakHr.toFixed(1)} | recovery_drop_bpm=${interval.recoveryDrop?.toFixed(1) ?? "--"} | start=${fmtTime(interval.startSec)} | end=${fmtTime(interval.endSec)}`)
    );
    const test = w.intervalTest;
    if (test?.enabled) {
      const statLine = (key) => {
        const stat = test.statistics?.[key];
        return `n=${stat?.count ?? 0},mean=${stat?.mean?.toFixed(2) ?? "--"},sd=${stat?.sd?.toFixed(2) ?? "--"},median=${stat?.median?.toFixed(2) ?? "--"},min=${stat?.min?.toFixed(2) ?? "--"},max=${stat?.max?.toFixed(2) ?? "--"}`;
      };
      lines.push(
        "",
        "[DYNAMIC_INTERVAL_TEST]",
        `status=${test.status} | baseline_hr_bpm=${test.baseline?.hr?.toFixed(1) ?? "--"} | baseline_source=${test.baseline?.source ?? "unavailable"} | segmented_repeats=${test.repetitions.length} | incomplete_recoveries=${test.incompleteRecoveryCount}`,
        `ramp_rate_stats=${statLine("rampRateBpmPerMin")}`,
        `recovery_rate_stats=${statLine("recoveryRateBpmPerMin")}`,
        `hrr60_stats=${statLine("hrr60")}`,
        ...test.repetitions.map((repetition) => `repeat_${repetition.index} | start=${fmtTime(repetition.startSec)} | pre_hr=${repetition.preHr?.toFixed(1) ?? "--"} | hr_30s=${repetition.hr30?.toFixed(1) ?? "--"} | end_hr=${repetition.endHr?.toFixed(1) ?? "--"} | rise_bpm=${repetition.riseBpm?.toFixed(1) ?? "--"} | ramp_bpm_per_min=${repetition.rampRateBpmPerMin?.toFixed(1) ?? "--"} | hrr60_bpm=${repetition.hrr60?.toFixed(1) ?? "--"} | recovery_bpm_per_min=${repetition.recoveryRateBpmPerMin?.toFixed(1) ?? "--"} | baseline_return_s=${repetition.returnToBaselineSec?.toFixed(0) ?? "--"} | effort_quality_pct=${repetition.effortQualityPct?.toFixed(1) ?? "--"} | recovery_quality_pct=${repetition.recoveryQualityPct?.toFixed(1) ?? "--"}`)
      );
    }
  }
  if (mode === "sleep" || mode === "rest" || mode === "mixed") {
    lines.push(
      "",
      "[SLEEP_REST]",
      `avg_hr_bpm=${r.hr.avg.toFixed(1)} | median_hr_bpm=${r.hr.median.toFixed(1)} | clean_min_hr_bpm=${r.hr.min.toFixed(1)} | clean_max_hr_bpm=${r.hr.max.toFixed(1)}`,
      `resting_hr_estimate_bpm=${r.restingHr.toFixed(1)} | lowest_stable_5min_hr_bpm=${r.lowest5MinHr.toFixed(1)} | lowest_stable_10min_hr_bpm=${r.lowest10MinHr?.toFixed(1) ?? "--"}`,
      `rmssd_ms=${r.hrv.rmssd.toFixed(2)} | lnrmssd=${r.hrv.lnRMSSD.toFixed(3)} | sdnn_ms=${r.hrv.sdnn.toFixed(2)} | pnn50_pct=${r.hrv.pNN50.toFixed(2)}`,
      `hrv_valid_duration_s=${r.hrvValidDurationSec.toFixed(0)} | hr_stability_score=${r.stabilityScore} | within_recording_recovery_score=${r.recoveryScore}`,
      `session_baseline_hr_bpm=${r.baseline.hr?.toFixed(1) ?? "--"} | session_baseline_lnrmssd=${r.baseline.lnRMSSD?.toFixed(3) ?? "--"}`,
      `suppressed_hrv_flag=${r.suppressedHrvFlag} | elevated_resting_hr_flag=${r.elevatedRestingHrFlag} | high_sleeping_hr_episodes=${r.highSleepingEpisodes.length}`,
      `baseline_note=${r.baseline.note}`,
      `nocturnal_hr_dip_pct=${r.nocturnalDip?.available ? r.nocturnalDip.dipPct.toFixed(1) : "--"} | est_breathing_rate_per_min=${r.respirationBpm?.toFixed(1) ?? "--"}`,
      r.stageProxy?.available
        ? `stage_proxy_minutes=deep:${r.stageProxy.minutes.deep.toFixed(0)},light:${r.stageProxy.minutes.light.toFixed(0)},rem:${r.stageProxy.minutes.rem.toFixed(0)},wake:${r.stageProxy.minutes.wake.toFixed(0)} | stage_proxy_caveat=${r.stageProxy.caveat}`
        : "stage_proxy=unavailable",
      ...(r.hourly ?? []).filter((hour) => hour.usableWindowCount > 0).map((hour) => `hour_${hour.hour} | avg_hr=${hour.avgHr?.toFixed(1) ?? "--"} | min_hr=${hour.minHr?.toFixed(1) ?? "--"} | rmssd_ms=${hour.rmssd?.toFixed(1) ?? "--"} | lf_hf=${hour.lfHfRatio?.toFixed(2) ?? "--"} | breaths_per_min=${hour.respirationBpm?.toFixed(1) ?? "--"} | breathing_accepted_window_pct=${hour.respirationCoveragePct?.toFixed(0) ?? "--"} | good_ecg_data_pct=${hour.cleanCoveragePct.toFixed(0)}`),
      ...r.windows.map((window, index) => `window_${index + 1} | start=${fmtTime(window.startSec)} | avg_hr_bpm=${window.avgHr.toFixed(1)} | rmssd_ms=${window.rmssd.toFixed(1)} | sdnn_ms=${window.sdnn.toFixed(1)} | clean_pct=${window.cleanCoverage.toFixed(1)}`)
    );
  }
  lines.push(
    "",
    "[METHODOLOGY_AND_CAVEATS]",
    `r_peak_confidence=${report.methodology.rPeakConfidence}`,
    `signal_cleansing=${report.methodology.signalCleansing}`,
    `interval_protocol=${report.methodology.intervalProtocol}`,
    `activity_caveat=${report.methodology.activityCaveat}`,
    `drift_caveat=${report.methodology.driftCaveat}`,
    `medical_caveat=${report.methodology.medicalCaveat}`
  );
  const breathing = report.respiration;
  lines.push("", "[ECG_DERIVED_BREATHING]", `method=${breathing.method}`,
    `median_breaths_per_min=${breathing.summary.medianBpm ?? "unavailable"} | p10=${breathing.summary.p10Bpm ?? "unavailable"} | p90=${breathing.summary.p90Bpm ?? "unavailable"} | accepted_window_pct=${breathing.summary.coveragePct.toFixed(1)}`,
    `timing=${breathing.timingNote}`, `limitations=${breathing.caveat}`,
    ...breathing.buckets.map((b) => `start_s=${b.startSec} | end_s=${b.endSec} | median_breaths_per_min=${b.medianBpm ?? "unavailable"} | accepted_window_pct=${b.coveragePct.toFixed(1)}`));
  return lines.join("\n");
}

function drawDashboardCharts(report) {
  const data = report.visualizationData;
  drawQualityGauge("quality-gauge-chart", report.universal);
  drawIntegrityChart("integrity-chart", report.universal, data.gaps);
  drawQualityTimeline("quality-timeline-chart", data.qualityTimeline, report.universal.durationSec);
  drawLabeledLine("hr-overview-chart", data.hrPoints.map((point) => point.value), "#F43F5E", "Heart Rate Trend (Full Duration)", "BPM");
  drawLabeledScatter("rr-overview-chart", data.rrPoints.map((point) => point.value), "#3B82F6", "RR Interval (Full Duration)", "ms");
  drawLabeledHistogram("hr-histogram", data.hrHistogram, "#3B82F6", "Heart Rate Distribution", "BPM", "Count");
  drawLabeledHistogram("rr-histogram", data.rrHistogram, "#8B5CF6", "RR Interval Distribution", "RR Interval (ms)", "Count");
  drawBeatOverlay("beat-chart", data.beatOverlay);
  drawHrvTrendChart("hrv-trend-chart", data.hrvTrend);
  drawRhythmTimeline("rhythm-timeline-chart", report);
  const mode = resolvedActivityMode(report);
  if (mode === "workout" || mode === "mixed") {
    drawAnnotatedHrChart("annotated-hr-chart", report);
    drawZoneChart("zone-chart", report.workout.zones);
    drawRecoveryChart("recovery-chart", report.workout.recovery);
    drawIntervalChart("interval-chart", report.workout);
    drawAlignedIntervalChart("interval-response-chart", report.workout.intervalTest, "effort");
    drawAlignedIntervalChart("interval-recovery-chart", report.workout.intervalTest, "recovery");
  }
  if (mode === "sleep" || mode === "rest" || mode === "mixed") {
    drawRestHrChart("rest-hr-chart", report);
    drawRestHrvChart("rest-hrv-chart", report);
    drawPoincareChart("poincare-chart", data.poincare);
    const hypnogramPanel = document.getElementById("hypnogram-panel");
    const showHypnogram = mode !== "workout" && data.stageProxy?.available;
    hypnogramPanel?.classList.toggle("hidden", !showHypnogram);
    if (showHypnogram) drawHypnogram("hypnogram-chart", data.stageProxy, report.universal.durationSec);
  }
  drawRespirationChart(setupCanvas("respiration-chart"), report.respiration, report.universal.durationSec, fmtTime);
  makeTimelineClickable("respiration-chart", 56, 18);
  const breathingCanvas = document.getElementById("respiration-chart");
  breathingCanvas.onpointermove = (event) => {
    const rect = breathingCanvas.getBoundingClientRect();
    const sec = clamp((event.clientX - rect.left - 56) / Math.max(1, rect.width - 74), 0, 1) * report.universal.durationSec;
    const r = report.respiration;
    const index = Math.round((sec - (r.settings.windowSec || 0) / 2) / (r.settings.stepSec || 30));
    const point = r.windows[index];
    breathingCanvas.title = point ? `${fmtTime(point.startSec)}–${fmtTime(point.endSec)}: ${Number.isFinite(point.bpm) ? point.bpm.toFixed(1) + " breaths/min · " + point.source : "Unavailable · " + point.reason}. Click to inspect ECG.` : "Outside complete analysis windows.";
  };
  drawLfHfChart("lfhf-chart", data.lfhfTrend, report.universal.durationSec);

  // Drill-down: clicking a full-duration timeline jumps the ECG explorer there.
  makeTimelineClickable("annotated-hr-chart", 52, 18);
  makeTimelineClickable("rest-hr-chart", 52, 18);
  makeTimelineClickable("rest-hrv-chart", 52, 18);
  makeTimelineClickable("rhythm-timeline-chart", 90, 24);
  makeTimelineClickable("quality-timeline-chart", 92, 20);
  makeTimelineClickable("hypnogram-chart", 88, 20);
  makeTimelineClickable("lfhf-chart", 56, 18);
  makeTimelineClickable("hr-overview-chart", 50, 14);
}

function summaryTile(label, value, detail, tone = "", progress = null) {
  const progressMarkup = Number.isFinite(progress)
    ? `<div class="summary-meter" aria-label="${progress.toFixed(0)} percent"><span style="width:${clamp(progress, 0, 100)}%"></span></div>`
    : "";
  return `<article class="summary-tile ${tone}">
    <span class="metric-label">${label}</span>
    <strong>${value}</strong>
    <p>${detail}</p>
    ${progressMarkup}
  </article>`;
}

function statSummaryValue(stat, unit = "") {
  if (!stat || !Number.isFinite(stat.mean)) return "Unavailable";
  const deviation = stat.sd ?? stat.sampleSd ?? stat.standardDeviation;
  return Number.isFinite(deviation)
    ? `${stat.mean.toFixed(1)} ± ${deviation.toFixed(1)}${unit}`
    : `${stat.mean.toFixed(1)}${unit}`;
}

function renderActionableSummary(report) {
  const mode = resolvedActivityMode(report);
  const highlights = buildReportHighlights(report, mode);
  document.getElementById("actionable-summary").innerHTML = highlights
    .map((item) => summaryTile(item.label, item.value, item.detail, item.tone ? `tone-${item.tone}` : "", item.progress))
    .join("");
}

function renderQualitySummary(report) {
  const u = report.universal;
  document.getElementById("quality-grade-cards").innerHTML = [
    summaryTile("HR usability", u.qualityGrades.hr, `${u.hrUsablePercentage.toFixed(1)}% of the recording supports heart-rate analysis.`, u.hrUsablePercentage >= 75 ? "tone-good" : "tone-warn"),
    summaryTile("HRV usability", u.qualityGrades.hrv, `${u.hrvUsablePercentage.toFixed(1)}% meets the stricter beat-timing standard.`, u.hrvUsablePercentage >= 75 ? "tone-good" : "tone-warn"),
    summaryTile("Morphology usability", u.qualityGrades.morphology, `${u.morphologyUsablePercentage.toFixed(1)}% supports cautious beat-shape review.`, u.morphologyUsablePercentage >= 75 ? "tone-good" : "tone-warn"),
    summaryTile("Contact / displacement", `${u.displacementEpisodeCount} episode${u.displacementEpisodeCount === 1 ? "" : "s"}`, `${fmtTime(u.flatlineDurationSec)} flatline; ${u.clippedSamplePercentage.toFixed(2)}% repeated-extreme samples.`, u.displacementEpisodeCount ? "tone-warn" : "tone-good")
  ].join("");
  const artifactSummary = document.getElementById("artifact-summary");
  const excludedIntervals = report.rhythm.artifactExcludedIntervalCount ?? report.rhythm.qualityExcludedBeatCount ?? 0;
  artifactSummary.innerHTML = `<strong>Artifact-aware screening:</strong> ${report.rhythm.artifactEpisodes.length} low-quality signal episode${report.rhythm.artifactEpisodes.length === 1 ? " was" : "s were"} consolidated. ${excludedIntervals.toLocaleString()} affected beat interval${excludedIntervals === 1 ? " was" : "s were"} excluded before rhythm candidates were counted, reducing warning cascades from strap movement or contact loss.`;
}

function renderIntervalTest(report) {
  const test = report.workout.intervalTest;
  const panel = document.getElementById("interval-test-panel");
  const enabled = Boolean(test?.enabled);
  panel.classList.toggle("hidden", !enabled);
  if (!enabled) return;

  const repetitions = test.repetitions ?? [];
  const baselineHr = test.baselineHr ?? test.baseline?.hr;
  const statusText = test.summary?.text ?? test.message ?? test.status ?? "Interval-test analysis complete.";
  document.getElementById("interval-protocol-summary").textContent = `${repetitions.length}/5 repeats segmented. ${Number.isFinite(baselineHr) ? `Baseline ${baselineHr.toFixed(0)} bpm. ` : ""}${statusText}`;
  const stats = test.statistics ?? {};
  document.getElementById("interval-stat-cards").innerHTML = [
    summaryTile("Ramp rate", statSummaryValue(stats.rampRateBpmPerMin, " bpm/min"), `${stats.rampRateBpmPerMin?.count ?? stats.rampRateBpmPerMin?.n ?? 0}/5 quality-valid repeats.`),
    summaryTile("Recovery rate", statSummaryValue(stats.recoveryRateBpmPerMin, " bpm/min"), `${stats.recoveryRateBpmPerMin?.count ?? stats.recoveryRateBpmPerMin?.n ?? 0}/5 quality-valid first-minute recoveries.`),
    summaryTile("HRR60", statSummaryValue(stats.hrr60, " bpm"), `First-to-last change ${Number.isFinite(test.firstToLastDrift?.hrr60?.absolute) ? test.firstToLastDrift.hrr60.absolute.toFixed(1) + " bpm" : "unavailable"}.`),
    summaryTile("Baseline return", statSummaryValue(stats.returnToBaselineSec, " s"), `${test.incompleteRecoveryCount ?? repetitions.filter((repetition) => !repetition.recoveryComplete).length} incomplete recovery period(s).`)
  ].join("");

  const format = (value, digits = 0, suffix = "") => Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : "--";
  const rows = Array.from({ length: 5 }, (_, index) => {
    const repetition = repetitions[index];
    if (!repetition) return `<tr><th scope="row">${index + 1}</th><td colspan="9">Not segmented because a prior baseline return or sufficient clean data was unavailable.</td></tr>`;
    const quality = [repetition.effortQualityPct, repetition.recoveryQualityPct].filter(Number.isFinite);
    const qualityText = quality.length ? `${Math.min(...quality).toFixed(0)}% min` : "--";
    const returned = repetition.recoveryComplete ?? repetition.baselineReturn?.returned;
    return `<tr>
      <th scope="row">${index + 1}</th>
      <td>${format(repetition.preHr, 0)}</td>
      <td>${format(repetition.hr30, 0)}</td>
      <td>${format(repetition.endHr, 0)}</td>
      <td>${format(repetition.riseBpm ?? repetition.hrRise, 1)}</td>
      <td>${format(repetition.rampRateBpmPerMin, 1)}</td>
      <td>${format(repetition.hrr60, 1)}</td>
      <td>${format(repetition.recoveryRateBpmPerMin, 1)}</td>
      <td>${format(repetition.returnToBaselineSec ?? repetition.baselineReturn?.returnTimeSec, 0, "s")} ${returned === false ? "(incomplete)" : ""}</td>
      <td>${qualityText}</td>
    </tr>`;
  });
  document.getElementById("interval-repeat-table-body").innerHTML = rows.join("");
}

function renderDashboard(report) {
  const u = report.universal;
  const w = report.workout;
  const r = report.rest;
  const rhythm = report.rhythm;
  const requestedMode = currentProfile?.recordingType === "interval-test"
    ? "workout"
    : ["sleep", "rest", "workout"].includes(currentProfile?.recordingType)
      ? currentProfile.recordingType
      : "auto";
  selectedMode = requestedMode;
  document.getElementById("activity-mode-select").value = requestedMode;
  updateModeVisibility(report);
  document.getElementById("overall-quality-score").textContent = `Data Quality: ${u.qualityScore}/100`;
  const alertBanner = document.getElementById("alert-banner");
  alertBanner.textContent = `${u.qualityLevel} | Review priority: ${rhythm.reviewPriority}`;
  const bannerClass = u.qualityScore >= 75 ? "green" : u.qualityScore >= 55 ? "yellow" : "orange";
  alertBanner.className = `alert-banner-container alert-${bannerClass}`;
  renderActionableSummary(report);
  renderKeyFindings(report);
  renderQualitySummary(report);
  renderIntervalTest(report);
  renderRespiration(report, { metricCard, statValue, fmtTime });
  renderStatisticsTables(report);
  renderHourlyTable(report);
  renderEventTable(report);

  document.getElementById("universal-cards").innerHTML = [
    metricCard("Recording duration", u.durationSec >= 3600 ? `${(u.durationSec / 3600).toFixed(2)} hr` : `${(u.durationSec / 60).toFixed(1)} min`, "Timestamp span of valid ECG samples.", "tone-good"),
    metricCard("Estimated sample rate", `${u.sampleRate.toFixed(2)} Hz`, `Median interval ${(u.medianSampleIntervalSec * 1000).toFixed(3)} ms.`, "tone-violet"),
    metricCard("Total samples", u.totalSamples.toLocaleString(), `${u.expectedSamples.toLocaleString()} expected including gaps.`),
    metricCard("Missing samples / gaps", `${u.missingSamples.toLocaleString()} / ${u.gapCount}`, `${u.gapDurationSec.toFixed(2)} seconds of gap time.`, u.gapCount ? "tone-warn" : "tone-good"),
    metricCard("Signal quality", `${u.qualityScore}/100`, u.qualityLevel, u.qualityScore >= 75 ? "tone-good" : "tone-warn", u.qualityScore),
    metricCard("Clean beats", `${u.cleanBeatPercentage.toFixed(1)}%`, `${u.detectedBeats.toLocaleString()} detected R-peaks.`, "tone-good", u.cleanBeatPercentage)
  ].join("");
  document.getElementById("advanced-quality").innerHTML = [
    metricCard("R-peak confidence", `${u.rPeakConfidence.toFixed(1)}%`, "Agreement between independent peak detectors.", "tone-violet", u.rPeakConfidence),
    metricCard("Activity type", report.classification.inferredMode.toUpperCase(), `${report.classification.confidence}% automatic confidence.`),
    metricCard("Morphology consistency", `${u.qualityComponents.morphology.toFixed(1)}%`, "Quality-gated consistency across sampled ECG beat shapes.", "tone-violet", u.qualityComponents.morphology),
    metricCard("Accepted ECG files", `${u.ingestion.acceptedFileCount}/${u.ingestion.inputFileCount}`, `${u.ingestion.invalidRows.toLocaleString()} invalid row(s) skipped; ${u.ingestion.usableRowsAfterDeduplication.toLocaleString()} samples retained.`, u.ingestion.skippedFileCount ? "tone-warn" : "tone-good"),
    metricCard("Timestamp cleanup", `${u.ingestion.duplicateCount.toLocaleString()} duplicates`, `${u.ingestion.resetCount} reset(s); ${u.ingestion.outOfOrderCount.toLocaleString()} out-of-order row(s).`, u.ingestion.resetCount || u.ingestion.outOfOrderCount ? "tone-warn" : "tone-good"),
    metricCard("Noise / baseline", `${u.highFrequencyNoiseIndex.toFixed(3)} / ${u.baselineWanderIndex.toFixed(3)}`, "Robust relative indices used to identify local contact and motion changes.", "tone-violet")
  ].join("");

  document.getElementById("workout-cards").innerHTML = [
    metricCard("Average HR", `${w.hr.avg.toFixed(0)} bpm`, `Median ${w.hr.median.toFixed(0)} bpm.`),
    metricCard("Clean min / max HR", `${w.hr.min.toFixed(0)} / ${w.hr.max.toFixed(0)}`, "Robust P1/P99 values reduce isolated-beat distortion."),
    metricCard("HR percentiles", `${w.hr.percentiles.p5.toFixed(0)} / ${w.hr.percentiles.p95.toFixed(0)}`, `P25 ${w.hr.percentiles.p25.toFixed(0)} | P50 ${w.hr.percentiles.p50.toFixed(0)} | P75 ${w.hr.percentiles.p75.toFixed(0)} bpm.`),
    metricCard("HR trend", `${w.trendBpmPerHour >= 0 ? "+" : ""}${w.trendBpmPerHour.toFixed(1)} bpm/hr`, "Linear trend through clean 15-second medians.", "tone-violet"),
    metricCard("Max HR ramp", `${w.rampBpmPerMinute.toFixed(1)} bpm/min`, "Largest sustained one-minute rise."),
    metricCard("Peak timing", w.peakTiming ? fmtTime(w.peakTiming.timeSec) : "--", w.peakTiming ? `${w.peakTiming.hr.toFixed(0)} bpm at ${w.peakTiming.percentIntoRecording.toFixed(0)}% of recording.` : "Unavailable.")
  ].join("");
  const recoveryValue = (seconds) => w.recovery.values[seconds]?.available ? `${w.recovery.values[seconds].drop.toFixed(0)} bpm` : "--";
  document.getElementById("workout-detail-cards").innerHTML = [
    metricCard("HR recovery 30 / 60 / 120s", `${recoveryValue(30)} / ${recoveryValue(60)} / ${recoveryValue(120)}`, w.recovery.available ? "Drop from clean post-peak HR." : "No clean post-peak tail.", w.recovery.available ? "tone-good" : "tone-warn"),
    metricCard("Intervals", `${w.intervalDetection.count}`, w.intervalDetection.reason, w.intervalDetection.applicable ? "tone-good" : ""),
    metricCard("Workout load", w.loadScore.toFixed(1), "Edwards-style minutes weighted by estimated HR zone.", "tone-violet"),
    metricCard("HR drift proxy", w.drift.eligible ? `${w.drift.valuePct >= 0 ? "+" : ""}${w.drift.valuePct.toFixed(1)}%` : "--", w.drift.reason, w.drift.eligible ? "tone-violet" : ""),
    metricCard("Spike / drop flags", `${w.spikeDropFlags.length}`, "Clean changes of at least 20 bpm in about 30 seconds outside detected intervals.", w.spikeDropFlags.length ? "tone-warn" : "tone-good"),
    metricCard("Zone 1 / 2", `${w.zones[0].minutes.toFixed(1)} / ${w.zones[1].minutes.toFixed(1)} min`, `Based on ${w.maxHrReference.source.replace("-", " ")} maximum HR (${w.maxHrReference.value.toFixed(0)} bpm).`),
    metricCard("Zone 3 / 4 / 5", `${w.zones[2].minutes.toFixed(1)} / ${w.zones[3].minutes.toFixed(1)} / ${w.zones[4].minutes.toFixed(1)} min`, `Based on ${w.maxHrReference.source.replace("-", " ")} maximum HR (${w.maxHrReference.value.toFixed(0)} bpm).`),
    metricCard("Peak per interval", w.intervals.length ? w.intervals.map((interval) => `${interval.peakHr.toFixed(0)}`).join(" / ") : "--", w.intervals.length ? "BPM by detected interval." : "No confident interval series.")
  ].join("");
  document.getElementById("workout-eligibility").textContent = w.intervalDetection.applicable ? `${w.intervalDetection.count} intervals detected` : "Intervals not confidently detected";

  document.getElementById("rest-cards").innerHTML = [
    metricCard("Average / median HR", `${r.hr.avg.toFixed(0)} / ${r.hr.median.toFixed(0)} bpm`, "Clean beat-derived heart rate."),
    metricCard("Clean min / max HR", `${r.hr.min.toFixed(0)} / ${r.hr.max.toFixed(0)} bpm`, "Robust P1/P99 values."),
    metricCard("Resting HR estimate", `${r.restingHr.toFixed(0)} bpm`, "Median of the lowest stable clean windows.", "tone-good"),
    metricCard("Lowest stable 5 min", `${r.lowest5MinHr.toFixed(0)} bpm`, "Requires stable, high-coverage window.", "tone-good"),
    metricCard("Lowest stable 10 min", availableValue(r.lowest10MinHr, (value) => `${value.toFixed(0)} bpm`), "Shown only when adjacent stable windows exist."),
    metricCard("HRV-valid duration", fmtTime(r.hrvValidDurationSec), "Sum of valid five-minute HRV windows.", "tone-violet")
  ].join("");
  document.getElementById("rest-detail-cards").innerHTML = [
    metricCard("RMSSD / lnRMSSD", `${r.hrv.rmssd.toFixed(1)} ms / ${r.hrv.lnRMSSD.toFixed(2)}`, "Clean normal-to-normal intervals.", "tone-violet"),
    metricCard("SDNN / pNN50", `${r.hrv.sdnn.toFixed(1)} ms / ${r.hrv.pNN50.toFixed(1)}%`, "Time-domain HRV measures.", "tone-violet"),
    metricCard("HR stability", `${r.stabilityScore}/100`, "Penalizes dispersion and sustained trend.", "tone-good", r.stabilityScore),
    metricCard("Recovery vs session baseline", `${r.recoveryScore}/100`, r.baseline.note, "tone-good", r.recoveryScore),
    metricCard("Suppressed HRV", r.suppressedHrvFlag ? "Flagged" : "Not flagged", `${r.suppressedHrvEpisodes.length} qualifying episode(s).`, r.suppressedHrvFlag ? "tone-warn" : "tone-good"),
    metricCard("Elevated resting HR", r.elevatedRestingHrFlag ? "Flagged" : "Not flagged", `${r.elevatedRestingEpisodes.length} qualifying episode(s).`, r.elevatedRestingHrFlag ? "tone-warn" : "tone-good"),
    metricCard("Bradycardia candidates", `${r.bradycardiaEpisodes.length}`, "Clean HR below 40 bpm for at least 30 seconds.", r.bradycardiaEpisodes.length ? "tone-warn" : "tone-good"),
    metricCard("High sleeping HR", `${r.highSleepingEpisodes.length}`, `At least ${r.highSleepingThreshold.toFixed(0)} bpm for five minutes.`, r.highSleepingEpisodes.length ? "tone-warn" : "tone-good")
  ].join("");

  document.getElementById("alerts-cards").innerHTML = [
    metricCard("Review priority", rhythm.reviewPriority, "Combines clean-signal candidate burden and episode counts.", rhythm.reviewPriority === "Low" ? "tone-good" : rhythm.reviewPriority === "Moderate" ? "tone-warn" : "tone-alert"),
    metricCard("Rhythm regularity", `${rhythm.regularityScore}/100`, "Penalizes ectopic, pause, and irregular candidate burden.", "tone-violet", rhythm.regularityScore),
    metricCard("Premature-beat candidates", `${rhythm.ectopicCount}`, `${rhythm.ectopicBurdenPct.toFixed(2)}% of detected RR intervals.`, rhythm.ectopicCount ? "tone-warn" : "tone-good"),
    metricCard("Long-interval candidates", `${rhythm.pauseCount}`, `${rhythm.pauseBurdenPct.toFixed(2)}% of detected RR intervals.`, rhythm.pauseCount ? "tone-warn" : "tone-good"),
    metricCard("Irregular sequences", `${rhythm.irregularEpisodeCount}`, "At least 30 seconds of locally irregular RR timing.", rhythm.irregularEpisodeCount ? "tone-warn" : "tone-good"),
    metricCard("Signal-quality episodes", `${rhythm.artifactEpisodes.length}`, `${rhythm.artifactExcludedIntervalCount.toLocaleString()} beat interval(s) excluded and consolidated before screening.`, rhythm.artifactEpisodes.length ? "tone-warn" : "tone-good")
  ].join("");

  document.getElementById("heart-export-text").value = buildHeartAnalysisExport(report, currentProfile);
  setTimeout(() => drawDashboardCharts(report), 120);
}

document.getElementById("activity-mode-select").addEventListener("change", (event) => {
  if (!currentReport) return;
  selectedMode = event.target.value;
  updateModeVisibility(currentReport);
  renderKeyFindings(currentReport);
  renderStatisticsTables(currentReport);
  renderHourlyTable(currentReport);
  document.getElementById("heart-export-text").value = buildHeartAnalysisExport(currentReport, currentProfile);
  setTimeout(() => drawDashboardCharts(currentReport), 80);
});

async function copyTextarea(textarea, statusElement, successMessage) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(textarea.value);
      statusElement.textContent = successMessage;
      return;
    }
    throw new Error("Clipboard API unavailable");
  } catch {
    textarea.focus();
    textarea.select();
    statusElement.textContent = "Clipboard access was blocked; the export text is selected.";
  }
}

async function shareTextarea(textarea, statusElement, title) {
  if (!textarea.value) {
    statusElement.textContent = "Analyze an ECG recording before sharing.";
    return;
  }
  try {
    if (navigator.share) {
      await navigator.share({ title, text: textarea.value });
      statusElement.textContent = "Share sheet opened.";
      return;
    }
    await copyTextarea(textarea, statusElement, "Share is unavailable here, so the export was copied instead.");
  } catch (error) {
    if (error?.name === "AbortError") {
      statusElement.textContent = "Share cancelled.";
      return;
    }
    await copyTextarea(textarea, statusElement, "Share failed, so the export was copied instead.");
  }
}

document.getElementById("copy-heart-export").addEventListener("click", () => {
  copyTextarea(
    document.getElementById("heart-export-text"),
    document.getElementById("heart-export-status"),
    "Full heart export copied."
  );
});

document.getElementById("share-heart-export").addEventListener("click", () => {
  shareTextarea(
    document.getElementById("heart-export-text"),
    document.getElementById("heart-export-status"),
    "Heart Analysis"
  );
});

function collectVisibleChartCanvases() {
  const definitions = [
    ["quality", "Signal Quality Score", "quality-gauge-chart"],
    ["integrity", "Recording Integrity Timeline", "integrity-chart"],
    ["qualityTimeline", "HR, HRV, and Morphology Usability Timeline", "quality-timeline-chart"],
    ["respiration", "Estimated Breathing Rate and Heart Rate", "respiration-chart"],
    ["heartRate", "Heart Rate Trend", "hr-overview-chart"],
    ["rrIntervals", "RR Interval Trend", "rr-overview-chart"],
    ["heartRateDistribution", "Heart Rate Distribution", "hr-histogram"],
    ["rrDistribution", "RR Interval Distribution", "rr-histogram"],
    ["beatOverlay", "ECG Beat Distribution", "beat-chart"],
    ["hrvTrend", "HRV Trend", "hrv-trend-chart"],
    ["annotatedHeartRate", "Annotated Workout Heart Rate", "annotated-hr-chart"],
    ["zones", "Estimated Heart Rate Zones", "zone-chart"],
    ["recovery", "Post-Peak Recovery", "recovery-chart"],
    ["intervals", "Interval Peak and Recovery", "interval-chart"],
    ["intervalResponse", "Five Aligned One-Minute HR Responses", "interval-response-chart"],
    ["intervalRecovery", "Five Aligned Baseline-Gated Recoveries", "interval-recovery-chart"],
    ["restHeartRate", "Sleep / Rest Heart Rate", "rest-hr-chart"],
    ["restHrv", "Sleep / Rest HRV", "rest-hrv-chart"],
    ["poincare", "Poincare Plot of Clean NN Intervals", "poincare-chart"],
    ["hypnogram", "Cardiac Sleep-Stage Proxy", "hypnogram-chart"],
    ["lfhf", "Autonomic Balance (LF / HF Power)", "lfhf-chart"],
    ["rhythm", "Rhythm Screening Timeline", "rhythm-timeline-chart"],
    ["ecgExplorer", "ECG Explorer - Current Window", "ecg-explorer-chart"],
    ["spectrogram", "ECG Spectrogram - Current Window", "cwt-chart"]
  ];
  return definitions.flatMap(([key, title, id]) => {
    const canvas = document.getElementById(id);
    if (!canvas || canvas.closest(".hidden") || canvas.width === 0 || canvas.height === 0) return [];
    return [{ key, title, canvas }];
  });
}

document.getElementById("download-pdf-report").addEventListener("click", async () => {
  if (!currentReport) return;
  const status = document.getElementById("pdf-report-status");
  try {
    status.textContent = "Preparing dashboard charts and PDF...";
    const chartCanvases = collectVisibleChartCanvases();
    let logoBytes = null;
    try {
      const response = await fetch("./irsri.png");
      if (response.ok) logoBytes = new Uint8Array(await response.arrayBuffer());
    } catch { /* logo optional */ }
    const pdfBytes = await createHeartReportPdfFile(
      currentReport,
      currentProfile,
      resolvedActivityMode(),
      currentExplorerRange,
      chartCanvases,
      { logoBytes }
    );
    downloadHeartReport(pdfBytes, currentProfile?.name);
    status.textContent = `PDF downloaded with ${chartCanvases.length} dashboard graphs.`;
  } catch (err) {
    status.textContent = `PDF failed: ${err.message}`;
  }
});


document.getElementById("download-respiration-csv").addEventListener("click", () => {
  if (!currentReport?.respiration?.windows?.length) return;
  const url = URL.createObjectURL(new Blob([respirationCsv(currentReport.respiration)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = "breathing-rate-estimates.csv"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// Recompute canvas pixels after a viewport/orientation change, rather than
// stretching a desktop-sized trace into a narrow mobile panel.
if (typeof ResizeObserver === "function") {
  let breathingResizeFrame;
  const breathingResizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(breathingResizeFrame);
    breathingResizeFrame = requestAnimationFrame(() => {
      if (!currentReport || document.getElementById("dashboard-content").classList.contains("hidden")) return;
      drawRespirationChart(setupCanvas("respiration-chart"), currentReport.respiration, currentReport.universal.durationSec, fmtTime);
    });
  });
  breathingResizeObserver.observe(document.getElementById("respiration-chart").parentElement);
}
