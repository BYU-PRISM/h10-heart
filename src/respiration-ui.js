export function renderRespiration(report, { metricCard, statValue, fmtTime }) {
  const r = report.respiration, s = r.summary;
  document.getElementById("respiration-cards").innerHTML = [
    metricCard("Median breathing estimate", statValue(s.medianBpm, 1, " breaths/min"), "Median of accepted windows; may not represent the whole session.", s.coveragePct >= 70 ? "tone-good" : "tone-warn"),
    metricCard("Middle 80% of estimates", Number.isFinite(s.p10Bpm) ? `${s.p10Bpm.toFixed(1)}–${s.p90Bpm.toFixed(1)}` : "Unavailable", "10th–90th percentiles; not an accuracy interval."),
    metricCard("Breathing estimate coverage", `${s.coveragePct.toFixed(0)}%`, `${s.acceptedWindows} of ${s.totalWindows} complete windows accepted.`, s.coveragePct >= 70 ? "tone-good" : "tone-warn"),
    metricCard("Timing + shape agreement", `${s.agreementWindows}`, "Accepted windows supported by both signal families.")
  ].join("");
  document.getElementById("respiration-note").textContent = r.caveat;
  document.getElementById("respiration-timing").textContent = r.settings.windowSec ? `Analyzed as ${r.mode}. ${r.timingNote}` : r.timingNote;
  document.getElementById("respiration-method").textContent = r.settings.windowSec
    ? `Search: ${r.settings.minBpm}–72 breaths/min, capped at 45% of local heart rate. ${r.settings.windowSec} s window; ${r.settings.stepSec} s step. Nominal spectral spacing before zero-padding: ${r.settings.nominalResolutionBpm.toFixed(2)} breaths/min. Normalized spectral fusion looks for a common peak in timing and morphology. Two QRS features count as one morphology family. Workout analysis excludes breathing below 12/min; choose a recording type before reanalysis to change the window and band. Strong single-family estimates have less corroboration. A narrow peak can still be motion-related.`
    : "Reanalyze the original CSV or ZIP to compute the breathing timeline.";
  document.getElementById("respiration-rejections").textContent = Object.entries(r.reasonCounts).map(([reason, count]) => `${reason}: ${count}`).join(" · ") || (r.available ? "All complete windows accepted." : "No complete breathing windows available.");
  const rows = r.buckets.map((b) => `<tr><th scope="row">${fmtTime(b.startSec)}–${fmtTime(b.endSec)}</th><td>${statValue(b.medianBpm, 1)}</td><td>${statValue(b.p10Bpm, 1)}–${statValue(b.p90Bpm, 1)}</td><td>${b.acceptedWindows}/${b.totalWindows} (${b.coveragePct.toFixed(0)}%)</td><td>${b.agreementWindows}</td></tr>`).join("");
  document.getElementById("respiration-table").innerHTML = `<table class="stats-table"><thead><tr><th scope="col">Elapsed time</th><th scope="col">Median breaths/min</th><th scope="col">P10–P90</th><th scope="col">Accepted windows</th><th scope="col">Both families</th></tr></thead><tbody>${rows || '<tr><td colspan="5">Breathing estimate unavailable.</td></tr>'}</tbody></table>`;
  document.getElementById("download-respiration-csv").disabled = !r.windows.length;
}

export function drawRespirationChart(canvasState, r, durationSec, fmtTime) {
  if (!canvasState) return;
  const { ctx, w, h } = canvasState;
  const left = 56, right = w - 18, width = right - left;
  const top = 34, bottom = h * 0.61, hrTop = h * 0.72, hrBottom = h - 32;
  const rates = r.windows.filter((p) => Number.isFinite(p.bpm)).map((p) => p.bpm);
  const rateMax = Math.max(30, Math.ceil(Math.max(0, ...rates) / 10) * 10 + 10);
  const heartRates = r.windows.filter((p) => Number.isFinite(p.hrBpm)).map((p) => p.hrBpm);
  const hrMin = Math.max(0, Math.floor(Math.min(40, ...heartRates) / 20) * 20);
  const hrMax = Math.max(100, Math.ceil(Math.max(0, ...heartRates) / 20) * 20);
  const x = (sec) => left + sec / Math.max(1, durationSec) * width;
  const y = (bpm) => bottom - bpm / rateMax * (bottom - top);
  const hy = (bpm) => hrBottom - (bpm - hrMin) / Math.max(1, hrMax - hrMin) * (hrBottom - hrTop);
  ctx.fillStyle = "#10243d"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left";
  ctx.fillText("Estimated breathing · breaths/min", left, 20);
  ctx.fillText("Heart rate · bpm", left, hrTop - 10);
  for (let v = 0; v <= rateMax; v += 10) {
    ctx.strokeStyle = "#e5eaf0"; ctx.beginPath(); ctx.moveTo(left, y(v)); ctx.lineTo(right, y(v)); ctx.stroke();
    ctx.fillStyle = "#607087"; ctx.font = "11px sans-serif"; ctx.textAlign = "right"; ctx.fillText(String(v), left - 8, y(v) + 4);
  }
  for (const v of [hrMin, hrMax]) {
    ctx.fillText(String(v), left - 8, hy(v) + 4);
    ctx.strokeStyle = "#e5eaf0"; ctx.beginPath(); ctx.moveTo(left, hy(v)); ctx.lineTo(right, hy(v)); ctx.stroke();
  }
  const step = r.settings.stepSec || 30;
  r.windows.forEach((p, i) => {
    const prev = r.windows[i - 1];
    if (!Number.isFinite(p.bpm)) {
      ctx.fillStyle = "rgba(100,116,139,0.12)";
      ctx.fillRect(x(p.centerSec - step / 2), top, Math.max(1, width * step / Math.max(1, durationSec)), bottom - top);
    } else {
      ctx.strokeStyle = ctx.fillStyle = p.support === "agreement" ? "#087f8c" : "#bd7414";
      if (Number.isFinite(prev?.bpm)) {
        ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x(prev.centerSec), y(prev.bpm)); ctx.lineTo(x(p.centerSec), y(p.bpm)); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(x(p.centerSec), y(p.bpm), r.windows.length > 1000 ? 1.3 : 2.3, 0, Math.PI * 2); ctx.fill();
    }
    if (Number.isFinite(p.hrBpm) && Number.isFinite(prev?.hrBpm)) {
      ctx.strokeStyle = "#b84d65"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x(prev.centerSec), hy(prev.hrBpm)); ctx.lineTo(x(p.centerSec), hy(p.hrBpm)); ctx.stroke();
    }
  });
  ctx.fillStyle = "#607087"; ctx.font = "11px sans-serif";
  const ticks = w < 500 ? 3 : 6;
  for (let i = 0; i <= ticks; i++) {
    const sec = durationSec * i / ticks;
    ctx.textAlign = i === 0 ? "left" : i === ticks ? "right" : "center";
    ctx.fillText(fmtTime(sec), x(sec), h - 10);
  }
  if (!rates.length) {
    ctx.textAlign = "center"; ctx.fillStyle = "#607087";
    ctx.fillText("No supported breathing estimate in this recording", (left + right) / 2, (top + bottom) / 2);
  }
}
