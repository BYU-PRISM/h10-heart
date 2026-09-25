// Serve the app and local research output on loopback only. No upload endpoint.
//
// Deployment runs index.php behind PHP; there is no PHP here, so the server
// strips `<?php ... ?>` blocks and serves the page as static HTML. That is
// exactly what the browser needs: all analysis happens client-side.
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.HEART_PREVIEW_PORT || 8765);
const types = { ".php": "text/html", ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".csv": "text/csv", ".md": "text/plain", ".pdf": "application/pdf" };

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    // Redirect rather than serve the app at "/", so its relative asset URLs
    // (./app.js, ./styles.css) still resolve inside public/.
    if (url.pathname === "/") {
      res.writeHead(302, { Location: "/public/" });
      res.end();
      return;
    }
    let file = path.resolve(root, "." + decodeURIComponent(url.pathname));
    if (!file.startsWith(root + path.sep) && file !== root) throw new Error("Outside app");
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.php");
    let bytes = await readFile(file);
    if (path.extname(file) === ".php") bytes = Buffer.from(bytes.toString("utf8").replace(/<\?php[\s\S]*?\?>/g, ""), "utf8");
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(bytes);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`Heart preview: http://127.0.0.1:${port}/`));
