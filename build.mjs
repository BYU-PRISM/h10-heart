// Bundle the browser app.
//
// esbuild writes app.js and analysis-worker.js straight into public/, next to
// the hand-written index.php, styles.css and logo they load. dist/ is then a
// byte copy of public/ and is what gets deployed to the web root.
import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const distDir = path.join(__dirname, "dist");

const bundles = [
  { entry: "src/main.js", outfile: "app.js" },
  { entry: "src/analysis-worker.js", outfile: "analysis-worker.js" }
];

for (const bundle of bundles) {
  await esbuild.build({
    entryPoints: [path.join(__dirname, bundle.entry)],
    bundle: true,
    format: "esm",
    outfile: path.join(publicDir, bundle.outfile),
    platform: "browser",
    target: ["es2020"],
    sourcemap: false,
    minify: false
  });
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(publicDir, distDir, { recursive: true });

const shipped = (await readdir(distDir)).sort();
console.log(`Built ${bundles.length} bundles into public/ and staged dist/: ${shipped.join(", ")}`);
