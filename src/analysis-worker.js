import { analyzeEcgData, extractWindow } from './ecg-analysis.js';
import JSZip from 'jszip';

let globalState = null;

function isCsvName(name) {
  const normalized = String(name || '').replace(/\\/g, '/');
  const parts = normalized.split('/');
  const basename = parts[parts.length - 1] || '';
  return basename.toLowerCase().endsWith('.csv')
    && !basename.startsWith('.')
    && !parts.some((part) => part.toLowerCase() === '__macosx');
}

function hasExtension(name, extension) {
  return String(name || '').toLowerCase().endsWith(extension);
}

self.onmessage = async (e) => {
  const { files, profileInfo, action, windowStart, windowSize } = e.data;

  if (action === 'get_window') {
    if (!globalState) return;
    const result = extractWindow(globalState, windowStart || 0, windowSize || 30);
    self.postMessage({ type: 'window_data', data: result });
    return;
  }

  try {
    self.postMessage({ type: 'progress', percent: 5, message: 'Extracting files...' });

    let allCsvs = [];

    for (const file of files) {
      if (hasExtension(file.name, '.zip')) {
        const zip = new JSZip();
        const arrayBuffer = await file.arrayBuffer();
        const contents = await zip.loadAsync(arrayBuffer);

        for (const [filename, zipEntry] of Object.entries(contents.files)) {
          if (!zipEntry.dir && isCsvName(filename)) {
            const text = await zipEntry.async('text');
            allCsvs.push({ name: filename, text });
          }
        }
      } else if (isCsvName(file.name)) {
        const text = await file.text();
        allCsvs.push({ name: file.name, text });
      }
    }

    allCsvs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    self.postMessage({ type: 'progress', percent: 20, message: `Parsing ${allCsvs.length} CSV file(s)...` });

    const { report, rawData } = analyzeEcgData(allCsvs, profileInfo, (pct) => {
      self.postMessage({ type: 'progress', percent: 20 + Math.floor(pct * 60), message: 'Analyzing data...' });
    });

    globalState = rawData;

    self.postMessage({ type: 'progress', percent: 95, message: 'Finalizing report...' });

    self.postMessage({ type: 'complete', report });
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
};
