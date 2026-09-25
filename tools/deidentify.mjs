// Build the de-identified example recordings that ship with this repository.
//
// The source recordings are private files held outside version control, and so
// is the mapping that names them: see tools/sources.example.json for the shape
// and point --map at your own copy. Nothing identifying reaches examples/.
//
// This tool copies only the heart data (the Polar H10 `time,ecg,hr,rr,marker`
// columns) and removes the two identifying details those exports carry:
//
//   1. Subject names, which live in the file and folder names -> subject-a / subject-b.
//   2. Absolute recording dates, which live in the epoch-nanosecond `time`
//      column -> shifted back by a whole number of days, per subject.
//
// Whole-day shifts preserve the local time of day (a sleep recording has to
// still start at night for the recording classifier) and preserve every
// interval, so the analysis output is unchanged apart from the displayed date.
//
// Usage: node tools/deidentify.mjs [--map <file>] [--source <dir>] [--out <dir>]

import { createReadStream } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

import JSZip from "jszip";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1]);

const mapPath = path.resolve(args.get("map") || path.join(repoRoot, "tools", "sources.local.json"));
const config = JSON.parse(await readFile(mapPath, "utf8"));
const sourceRoot = path.resolve(args.get("source") || config.sourceRoot || ".");
const outRoot = path.resolve(args.get("out") || path.join(repoRoot, "examples"));

const NS_PER_DAY = 86_400_000_000_000n;
const HEADER = "time,ecg,hr,rr,marker";

// Polar's exports put a narrow no-break space (U+202F) before AM/PM, so match
// file names loosely rather than depending on how a path was typed.
const loosen = (name) => name.replace(/[   ]/g, " ");

async function findFile(relDir, name) {
  const dir = path.join(sourceRoot, relDir);
  const hits = (await readdir(dir)).filter((entry) => loosen(entry) === loosen(name));
  if (hits.length !== 1) throw new Error(`Expected one "${name}" in ${relDir}, found ${hits.length}`);
  return path.join(dir, hits[0]);
}

// Polar H10 ECG samples are whole microvolts, but the exporter prints them as
// raw binary floats ("0.026000000000000002"). Rounding to 3 decimals is
// lossless for this data and roughly halves the uncompressed size.
function trimEcg(value) {
  if (value === "") return "";
  const rounded = Math.round(Number(value) * 1000) / 1000;
  return Number.isFinite(rounded) ? String(rounded) : value;
}

// `source` is either { path } for a loose CSV or { text } for a zip member.
async function* linesOf(source) {
  if (source.path) {
    yield* createInterface({ input: createReadStream(source.path, "utf8"), crlfDelay: Infinity });
    return;
  }
  for (const line of source.text.split(/\r?\n/)) yield line;
}

async function convert(source, shiftNs) {
  const out = [HEADER];
  let first = null;
  let last = null;
  let rows = 0;
  let sawFirstLine = false;
  for await (const line of linesOf(source)) {
    if (!line.trim()) continue;
    if (!sawFirstLine) {
      sawFirstLine = true;
      if (/^\s*time\s*,/i.test(line)) continue;
    }
    const cells = line.split(",");
    const timeNs = BigInt(cells[0].trim()) - shiftNs;
    if (first === null) first = timeNs;
    last = timeNs;
    rows += 1;
    const [, ecg = "", hr = "", rr = "", marker = ""] = cells;
    out.push([timeNs.toString(), trimEcg(ecg.trim()), hr.trim(), rr.trim(), marker.trim()].join(",").replace(/,+$/, ""));
  }
  if (!rows) throw new Error("No ECG rows found in source");
  return { text: out.join("\n") + "\n", first, last, rows };
}

const zipCache = new Map();
async function readZipMember(zipPath, member) {
  if (!zipCache.has(zipPath)) zipCache.set(zipPath, JSZip.loadAsync(await readFile(zipPath)));
  const zip = await zipCache.get(zipPath);
  const entry = Object.values(zip.files).find(
    (file) =>
      !file.dir &&
      !file.name.includes("__MACOSX") &&
      !path.basename(file.name).startsWith(".") &&
      loosen(file.name).endsWith(loosen(member))
  );
  if (!entry) throw new Error(`No member ending in "${member}" in ${path.basename(zipPath)}`);
  return entry.async("text");
}

const manifest = [];
for (const subject of config.subjects) {
  // One whole-day shift per subject, applied to all of their recordings, so
  // relative timing between recordings survives too.
  const shiftNs = BigInt(subject.shiftDays) * NS_PER_DAY;
  const dir = path.join(outRoot, subject.id);
  await mkdir(dir, { recursive: true });
  for (const recording of subject.recordings) {
    const sourcePath = await findFile(recording.dir, recording.file);
    const source = recording.member ? { text: await readZipMember(sourcePath, recording.member) } : { path: sourcePath };
    const { text, first, last, rows } = await convert(source, shiftNs);
    const gz = gzipSync(Buffer.from(text, "utf8"), { level: 9 });
    await writeFile(path.join(dir, `${recording.out}.gz`), gz);
    const durationMin = Number((last - first) / 1_000_000n) / 60_000;
    manifest.push({
      file: `${subject.id}/${recording.out}.gz`,
      rows,
      startsUtc: new Date(Number(first / 1_000_000n)).toISOString(),
      durationMin: +durationMin.toFixed(1),
      megabytes: +(gz.length / 1e6).toFixed(2)
    });
    console.log(`${subject.id}/${recording.out}.gz  ${rows} rows  ${durationMin.toFixed(1)} min  ${(gz.length / 1e6).toFixed(2)} MB`);
  }
}
await writeFile(path.join(outRoot, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`\nWrote ${manifest.length} de-identified recordings to ${outRoot}`);
