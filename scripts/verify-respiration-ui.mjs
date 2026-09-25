// Browser QA uses local uploads only. Set PLAYWRIGHT_MODULE if Playwright is
// installed outside this project (no production dependency is required).
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { materializeExample } from "./examples.mjs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "output/respiration");
// The file input needs real paths, so unpack the gzipped examples once.
const uploads = path.join(root, "output/uploads");
const base = "http://127.0.0.1:8765";
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || "chrome" });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
await context.route("**/*", (route) => new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort());
const errors = [];
try {
  for (const id of ["subject-a-sleep", "subject-b-workout"]) {
    const { example, report } = JSON.parse(await readFile(path.join(out, `${id}.json`), "utf8"));
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("dialog", async (dialog) => { errors.push(dialog.message()); await dialog.dismiss(); });
    await page.goto(`${base}/public/index.php`);
    await page.locator("#csv-file").setInputFiles(await materializeExample(id.endsWith("sleep") ? "sleep" : "workout", path.join(uploads, id)));
    await page.locator("#name").fill(example.name);
    await page.locator("#recording-type").selectOption(example.recordingType);
    // No ages are supplied for these examples. Dispatch the existing submit
    // handler directly; respiration itself does not use age or estimated HRmax.
    await page.locator("#analysis-form").dispatchEvent("submit");
    await page.locator("#dashboard-content:not(.hidden)").waitFor({ timeout: 120000 });
    await page.locator("#respiration-chart").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.getElementById("respiration-chart").width > 0);
    assert.ok((await page.locator("#respiration-cards").innerText()).includes(report.respiration.summary.medianBpm.toFixed(1)));
    assert.ok((await page.locator("#respiration-cards").textContent()).includes(`${report.respiration.summary.acceptedWindows} of ${report.respiration.summary.totalWindows}`));
    assert.ok((await page.locator("#heart-export-text").inputValue()).includes("[ECG_DERIVED_BREATHING]"));
    const downloaded = page.waitForEvent("download");
    await page.locator("#download-respiration-csv").click();
    const download = await downloaded;
    const csv = await readFile(await download.path(), "utf8");
    assert.equal(csv.split("\n").length, report.respiration.windows.length + 1);
    await page.locator("#respiration-section").screenshot({ path: path.join(out, `${id}-app.png`) });
    await page.locator("#activity-mode-select").selectOption("mixed");
    assert.ok(await page.locator("#respiration-section").isVisible());
    await page.locator("#activity-mode-select").selectOption(example.recordingType);
    if (id === "subject-b-workout") {
      const pdfDownload = page.waitForEvent("download", { timeout: 60000 });
      await page.locator("#download-pdf-report").click();
      await (await pdfDownload).saveAs(path.join(out, "subject-b-workout-report.pdf"));
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator("#respiration-chart").scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.getElementById("respiration-chart").width < 390);
      await page.locator("#respiration-section").screenshot({ path: path.join(out, "subject-b-workout-app-mobile.png") });
      const bounds = await page.locator("#respiration-chart").boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 391, "Breathing chart should fit mobile app layout");
      await page.setViewportSize({ width: 1440, height: 1100 });
    }
    // Chart clicks still navigate to a real ECG window.
    await page.locator("#respiration-chart").click({ position: { x: 200, y: 100 } });
    assert.ok((await page.locator("#range-label-start").innerText()) !== "0:00");
    console.log(`${id}: worker analysis, breathing chart, table, CSV, export and explorer passed`);
    await page.close();
  }
  const comparison = await context.newPage();
  comparison.on("pageerror", (error) => errors.push(error.message));
  await comparison.goto(`${base}/output/respiration/index.html`);
  await comparison.screenshot({ path: path.join(out, "comparison.png"), fullPage: true });
  await comparison.setViewportSize({ width: 390, height: 844 });
  await comparison.screenshot({ path: path.join(out, "comparison-mobile.png"), fullPage: true });
  assert.ok(await comparison.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Comparison should fit a mobile viewport");
  await comparison.close();
  assert.deepEqual(errors, []);
  await writeFile(path.join(out, "ui-verification.json"), JSON.stringify({ passed: true, recordings: ["subject-a-sleep", "subject-b-workout"], browserErrors: errors }, null, 2));
  console.log("Breathing UI verification passed.");
} finally { await browser.close(); }
