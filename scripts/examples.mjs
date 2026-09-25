// Loader for the de-identified example recordings in examples/.
//
// They are stored gzipped because a night of 130 Hz single-lead ECG is ~95 MB
// of CSV. Everything downstream wants the plain text, so unpack on read.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

export const examplesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../examples");

// Named recordings, so scripts refer to "the sleep example" rather than a path.
export const EXAMPLES = {
  rest: { files: ["subject-a/rest.csv.gz"], recordingType: "rest", label: "Subject A - seated rest" },
  sleep: { dir: "subject-a", match: /^sleep-\d+\.csv\.gz$/, recordingType: "sleep", label: "Subject A - overnight sleep" },
  workout: { files: ["subject-b/workout.csv.gz"], recordingType: "workout", label: "Subject B - workout" }
};

async function listFiles(example) {
  if (example.files) return example.files;
  const names = await readdir(path.join(examplesDir, example.dir));
  return names
    .filter((name) => example.match.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => path.posix.join(example.dir, name));
}

/** Read one example CSV as the `{ name, text }` shape analyzeEcgData() expects. */
export async function readExampleCsv(relPath) {
  const bytes = await readFile(path.join(examplesDir, relPath));
  return {
    name: path.basename(relPath, ".gz"),
    text: (relPath.endsWith(".gz") ? gunzipSync(bytes) : bytes).toString("utf8")
  };
}

/** Read every CSV of a named example, in recording order. */
export async function readExample(name) {
  const example = EXAMPLES[name];
  if (!example) throw new Error(`Unknown example "${name}"`);
  const files = await listFiles(example);
  const csvs = [];
  for (const file of files) csvs.push(await readExampleCsv(file));
  return csvs;
}

/**
 * Write a named example out as plain CSV files, for the few consumers that need
 * real paths on disk (a browser file input, a manual upload). Returns the paths.
 */
export async function materializeExample(name, destDir) {
  await mkdir(destDir, { recursive: true });
  const written = [];
  for (const csv of await readExample(name)) {
    const file = path.join(destDir, csv.name);
    await writeFile(file, csv.text);
    written.push(file);
  }
  return written;
}
