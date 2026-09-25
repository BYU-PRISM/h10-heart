// Analyze the bundled de-identified recordings and write the breathing-estimate
// research outputs. Outputs are local artifacts and are never deployed.
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { analyzeEcgData } from "../src/ecg-analysis.js";
import { respirationCsv } from "../src/respiration.js";
import { EXAMPLES, readExample } from "./examples.mjs";

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../output/respiration");
await mkdir(out, { recursive: true });

const examples = [
  { id: "subject-a-sleep", key: "sleep", name: "Subject A" },
  { id: "subject-b-workout", key: "workout", name: "Subject B" }
];

for (const example of examples) {
  if (process.argv[2] && process.argv[2] !== example.id) continue;
  const { recordingType, label } = EXAMPLES[example.key];
  const csvs = await readExample(example.key);
  console.log(`Analyzing ${example.id} (${label}): ${csvs.length} CSV files`);
  const { report } = analyzeEcgData(csvs, { name: example.name, recordingType });
  await writeFile(path.join(out, `${example.id}.json`), JSON.stringify({ example: { ...example, recordingType }, report }));
  await writeFile(path.join(out, `${example.id}.csv`), respirationCsv(report.respiration));
  console.log(JSON.stringify({ id: example.id, durationHours: report.universal.durationSec / 3600, sampleHz: report.universal.sampleRate, ...report.respiration.summary, rejected: report.respiration.reasonCounts, buckets: report.respiration.buckets }, null, 2));
}
