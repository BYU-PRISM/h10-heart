const TIME_COLUMN_UNITS = new Map([
  ["timestamp_ns", "ns"],
  ["timestamp_us", "us"],
  ["timestamp_ms", "ms"],
  ["timestamp_s", "s"],
  ["timestamp", null],
  ["time", null],
  ["sample_index", "sample_index"]
]);

const TIME_COLUMN_PRIORITY = [
  "timestamp_ns",
  "timestamp_us",
  "timestamp_ms",
  "timestamp_s",
  "timestamp",
  "time",
  "sample_index"
];

const ECG_COLUMN_PRIORITY = ["ecg_uv", "ecg", "voltage"];
const UNIT_TO_NS = { s: 1e9, ms: 1e6, us: 1e3, ns: 1 };

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function normalizeHeader(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\u00b5\u03bc]/g, "u")
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function parseCsvRow(line) {
  const values = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index++) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}

function findColumn(headers, priority) {
  for (const alias of priority) {
    const index = headers.indexOf(alias);
    if (index !== -1) return { index, alias };
  }
  return { index: -1, alias: null };
}

function sampledPositiveDeltas(values) {
  if (values.length < 2) return [];
  const deltas = [];
  const step = Math.max(1, Math.floor((values.length - 1) / 20000));
  for (let index = 1; index < values.length; index += step) {
    const delta = values[index] - values[index - 1];
    if (Number.isFinite(delta) && delta > 0) deltas.push(delta);
  }
  return deltas;
}

function magnitudeUnit(values) {
  if (!values.length) return null;
  const step = Math.max(1, Math.floor(values.length / 1000));
  const magnitudes = [];
  for (let index = 0; index < values.length; index += step) {
    const magnitude = Math.abs(values[index]);
    if (Number.isFinite(magnitude) && magnitude > 0) magnitudes.push(magnitude);
  }
  const typical = median(magnitudes);
  if (typical >= 1e17) return "ns";
  if (typical >= 1e14) return "us";
  if (typical >= 1e11) return "ms";
  if (typical >= 1e8) return "s";
  return null;
}

function inferTimestampUnit(values, nominalSampleRate) {
  const deltas = sampledPositiveDeltas(values);
  const typicalDelta = median(deltas);
  const magnitudeGuess = magnitudeUnit(values);

  if (!(typicalDelta > 0)) {
    return {
      unit: magnitudeGuess || "ns",
      source: magnitudeGuess ? "inferred-magnitude" : "fallback",
      typicalDeltaRaw: 0
    };
  }

  let best = null;
  for (const [unit, factor] of Object.entries(UNIT_TO_NS)) {
    const sampleRate = 1e9 / (typicalDelta * factor);
    if (!(sampleRate > 0) || !Number.isFinite(sampleRate)) continue;

    let score = Math.abs(Math.log(sampleRate / nominalSampleRate));
    if (sampleRate < 5) score += 5 + Math.abs(Math.log(sampleRate / 5));
    if (sampleRate > 5000) score += 5 + Math.abs(Math.log(sampleRate / 5000));
    if (magnitudeGuess === unit) score -= 2.5;
    else if (magnitudeGuess) score += 0.5;

    if (!best || score < best.score) best = { unit, score };
  }

  return {
    unit: best?.unit || magnitudeGuess || "ns",
    source: "inferred-delta",
    typicalDeltaRaw: typicalDelta
  };
}

function isAbsoluteTime(rawValue, unit) {
  const magnitude = Math.abs(rawValue);
  if (unit === "s") return magnitude >= 1e8;
  if (unit === "ms") return magnitude >= 1e11;
  if (unit === "us") return magnitude >= 1e14;
  if (unit === "ns") return magnitude >= 1e17;
  return false;
}

function naturalNameCompare(left, right) {
  return left.name.localeCompare(right.name, undefined, {
    numeric: true,
    sensitivity: "base"
  }) || left.inputIndex - right.inputIndex;
}

function lowerBound(values, target) {
  let lo = 0;
  let hi = values.length;
  while (lo < hi) {
    const middle = Math.floor((lo + hi) / 2);
    if (values[middle] < target) lo = middle + 1;
    else hi = middle;
  }
  return lo;
}

function approximatelyEqual(left, right) {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= scale * 1e-7;
}

function matchesExistingTimeline(segment, placedSegments) {
  const overlapping = placedSegments.filter((placed) =>
    placed.endNs >= segment.startNs && placed.startNs <= segment.endNs);
  if (!overlapping.length || !segment.times.length) return false;

  const sampleCount = Math.min(21, segment.times.length);
  let comparable = 0;
  let matching = 0;
  for (let sample = 0; sample < sampleCount; sample++) {
    const index = sampleCount === 1
      ? 0
      : Math.round(sample * (segment.times.length - 1) / (sampleCount - 1));
    const time = segment.times[index];
    for (const placed of overlapping) {
      if (time < placed.startNs || time > placed.endNs) continue;
      const found = lowerBound(placed.times, time);
      if (found >= placed.times.length || placed.times[found] !== time) continue;
      comparable++;
      if (approximatelyEqual(segment.ecgs[index], placed.ecgs[found])) matching++;
      break;
    }
  }

  const required = Math.min(2, sampleCount);
  return comparable >= required && matching / comparable >= 0.8;
}

function createDiagnostics(inputFileCount, nominalSampleRate) {
  return {
    inputFileCount,
    fileCount: inputFileCount,
    parsedFileCount: 0,
    acceptedFileCount: 0,
    skippedFileCount: 0,
    totalRows: 0,
    rowCount: 0,
    usableRows: 0,
    invalidRows: 0,
    blankRows: 0,
    schemaErrors: [],
    units: { s: 0, ms: 0, us: 0, ns: 0, sample_index: 0 },
    unitCounts: { s: 0, ms: 0, us: 0, ns: 0, sample_index: 0 },
    duplicateTimestamps: 0,
    duplicateCount: 0,
    outOfOrderRows: 0,
    outOfOrderCount: 0,
    timestampResets: 0,
    resetCount: 0,
    mergeReordered: false,
    mixedTimestampUnits: false,
    mixedTimeBases: false,
    nominalSampleRate,
    files: []
  };
}

function parseFile(file, nominalSampleRate) {
  const name = file.name || `file-${file.inputIndex + 1}.csv`;
  const report = {
    name,
    inputIndex: file.inputIndex,
    status: "skipped",
    totalRows: 0,
    usableRows: 0,
    invalidRows: 0,
    blankRows: 0,
    invalidTimeRows: 0,
    invalidEcgRows: 0,
    outOfOrderRows: 0,
    duplicateTimestamps: 0,
    timestampResets: 0,
    crossFileResets: 0,
    concatenatedSegments: 0,
    preservedOverlaps: 0,
    schema: null,
    timestampUnit: null,
    unitSource: null,
    ecgUnit: null,
    sampleRate: null,
    detectedSampleRate: null,
    absoluteTimeline: false,
    timeBasis: null,
    error: null
  };

  if (typeof file.text !== "string") {
    report.error = "CSV text is missing or is not a string.";
    return { report, segments: [] };
  }

  const lines = file.text.split(/\r?\n/);
  let headerLineIndex = -1;
  for (let index = 0; index < lines.length; index++) {
    if (lines[index].trim()) {
      headerLineIndex = index;
      break;
    }
    report.blankRows++;
  }
  if (headerLineIndex === -1) {
    report.error = "The file is empty.";
    return { report, segments: [] };
  }

  const originalHeaders = parseCsvRow(lines[headerLineIndex]);
  const headers = originalHeaders.map(normalizeHeader);
  const timeColumn = findColumn(headers, TIME_COLUMN_PRIORITY);
  const ecgColumn = findColumn(headers, ECG_COLUMN_PRIORITY);
  report.schema = {
    headers,
    timeColumn: timeColumn.alias,
    ecgColumn: ecgColumn.alias
  };

  if (timeColumn.index === -1 || ecgColumn.index === -1) {
    const missing = [];
    if (timeColumn.index === -1) missing.push("a timestamp column");
    if (ecgColumn.index === -1) missing.push("an ECG column");
    report.error = `Missing ${missing.join(" and ")}.`;
    for (let index = headerLineIndex + 1; index < lines.length; index++) {
      if (lines[index].trim()) report.totalRows++;
      else report.blankRows++;
    }
    report.invalidRows = report.totalRows;
    return { report, segments: [] };
  }

  const rows = [];
  const maximumColumn = Math.max(timeColumn.index, ecgColumn.index);
  for (let index = headerLineIndex + 1; index < lines.length; index++) {
    const line = lines[index];
    if (!line.trim()) {
      report.blankRows++;
      continue;
    }
    report.totalRows++;
    const columns = parseCsvRow(line);
    if (columns.length <= maximumColumn) {
      report.invalidRows++;
      report.invalidTimeRows++;
      report.invalidEcgRows++;
      continue;
    }

    const timeText = columns[timeColumn.index].trim();
    const ecgText = columns[ecgColumn.index].trim();
    const rawTime = timeText === "" ? Number.NaN : Number(timeText);
    const ecg = ecgText === "" ? Number.NaN : Number(ecgText);
    if (!Number.isFinite(rawTime) || !Number.isFinite(ecg)) {
      report.invalidRows++;
      if (!Number.isFinite(rawTime)) report.invalidTimeRows++;
      if (!Number.isFinite(ecg)) report.invalidEcgRows++;
      continue;
    }
    rows.push({ rawTime, ecg, rowNumber: index + 1 });
  }

  report.usableRows = rows.length;
  if (!rows.length) {
    report.error = "No rows contain both a finite timestamp and ECG value.";
    return { report, segments: [] };
  }

  const declaredUnit = TIME_COLUMN_UNITS.get(timeColumn.alias);
  let unitInfo;
  if (declaredUnit === "sample_index") {
    unitInfo = { unit: "sample_index", source: "sample-index", typicalDeltaRaw: 1 };
  } else if (declaredUnit) {
    unitInfo = {
      unit: declaredUnit,
      source: "explicit-header",
      typicalDeltaRaw: median(sampledPositiveDeltas(rows.map((row) => row.rawTime)))
    };
  } else {
    unitInfo = inferTimestampUnit(rows.map((row) => row.rawTime), nominalSampleRate);
  }

  const factor = unitInfo.unit === "sample_index"
    ? 1e9 / nominalSampleRate
    : UNIT_TO_NS[unitInfo.unit];
  const typicalDeltaRaw = unitInfo.typicalDeltaRaw > 0
    ? unitInfo.typicalDeltaRaw
    : unitInfo.unit === "sample_index" ? 1 : 1;

  report.timestampUnit = unitInfo.unit;
  report.unitSource = unitInfo.source;
  report.ecgUnit = ecgColumn.alias === "ecg_uv" ? "uV" : "unspecified";
  report.sampleRate = unitInfo.unit === "sample_index"
    ? nominalSampleRate
    : unitInfo.typicalDeltaRaw > 0 ? 1e9 / (typicalDeltaRaw * factor) : null;
  report.detectedSampleRate = report.sampleRate;

  const rawSegments = [[]];
  let segmentStart = rows[0].rawTime;
  let previous = rows[0].rawTime;
  rawSegments[0].push(rows[0]);
  for (let index = 1; index < rows.length; index++) {
    const row = rows[index];
    if (row.rawTime < previous) {
      report.outOfOrderRows++;
      const backwards = previous - row.rawTime;
      const nearOrigin = row.rawTime <= segmentStart + typicalDeltaRaw * 5;
      const progressed = previous >= segmentStart + typicalDeltaRaw * 2;
      const reset = backwards >= typicalDeltaRaw * 2 && nearOrigin && progressed;
      if (reset) {
        report.timestampResets++;
        rawSegments.push([]);
        segmentStart = row.rawTime;
      }
    }
    rawSegments[rawSegments.length - 1].push(row);
    previous = row.rawTime;
  }

  const segments = rawSegments.filter((segment) => segment.length).map((rawSegment, segmentIndex) => {
    rawSegment.sort((left, right) => left.rawTime - right.rawTime || left.rowNumber - right.rowNumber);
    const rawOrigin = rawSegment[0].rawTime;
    const times = rawSegment.map((row) => Math.round(row.rawTime * factor));
    const ecgs = rawSegment.map((row) => row.ecg);
    for (let index = 1; index < times.length; index++) {
      if (times[index] === times[index - 1]) report.duplicateTimestamps++;
    }
    const intervalNs = report.sampleRate > 0 && Number.isFinite(report.sampleRate)
      ? 1e9 / report.sampleRate
      : 1e9 / nominalSampleRate;
    return {
      times,
      ecgs,
      startNs: times[0],
      endNs: times[times.length - 1],
      intervalNs,
      absolute: unitInfo.unit !== "sample_index" && isAbsoluteTime(rawOrigin, unitInfo.unit),
      forceAppend: segmentIndex > 0,
      report
    };
  });

  report.absoluteTimeline = segments.some((segment) => segment.absolute);
  report.timeBasis = unitInfo.unit === "sample_index"
    ? "sample-index"
    : report.absoluteTimeline ? "absolute" : "relative";
  report.status = "accepted";
  return { report, segments };
}

/**
 * Parse and merge ECG CSV text objects into the nanosecond time domain used by
 * the existing analysis pipeline.
 *
 * @param {Array<{name?: string, text: string}>} csvFiles
 * @param {{nominalSampleRate?: number}} profileInfo
 * @returns {{ecgTimes: number[], ecgs: number[], diagnostics: object}}
 */
export function parseEcgCsvFiles(csvFiles, profileInfo = {}, progressCallback) {
  const files = Array.isArray(csvFiles) ? csvFiles : [];
  const requestedRate = Number(profileInfo.nominalSampleRate);
  const nominalSampleRate = Number.isFinite(requestedRate) && requestedRate > 0
    ? requestedRate
    : 130;
  const diagnostics = createDiagnostics(files.length, nominalSampleRate);
  const orderedFiles = files
    .map((file, inputIndex) => ({ ...file, inputIndex, name: file?.name || `file-${inputIndex + 1}.csv` }))
    .sort(naturalNameCompare);

  const parsedFiles = orderedFiles.map((file, index) => {
    progressCallback?.(index / Math.max(1, orderedFiles.length));
    return parseFile(file, nominalSampleRate);
  });
  progressCallback?.(1);
  const mergedTimes = [];
  const mergedEcgs = [];
  const placedSegments = [];
  let previousPlaced = null;
  let relativeOriginNs = null;
  let latestEndNs = -Infinity;

  for (const parsed of parsedFiles) {
    const report = parsed.report;
    diagnostics.files.push(report);
    diagnostics.totalRows += report.totalRows;
    diagnostics.usableRows += report.usableRows;
    diagnostics.invalidRows += report.invalidRows;
    diagnostics.blankRows += report.blankRows;
    diagnostics.outOfOrderRows += report.outOfOrderRows;
    diagnostics.timestampResets += report.timestampResets;

    if (report.status !== "accepted") {
      diagnostics.skippedFileCount++;
      diagnostics.schemaErrors.push({
        file: report.name,
        error: report.error,
        schema: report.schema
      });
      continue;
    }

    diagnostics.parsedFileCount++;
    diagnostics.acceptedFileCount++;
    diagnostics.units[report.timestampUnit]++;
    diagnostics.unitCounts[report.timestampUnit]++;

    for (const segment of parsed.segments) {
      let offsetNs = 0;
      let placement = "preserved";
      if (segment.forceAppend && previousPlaced) {
        offsetNs = previousPlaced.endNs + previousPlaced.intervalNs - segment.startNs;
        placement = "concatenated-in-file-reset";
      } else if (!segment.absolute && placedSegments.length) {
        if (relativeOriginNs === null) {
          relativeOriginNs = segment.startNs;
          offsetNs = latestEndNs + segment.intervalNs - segment.startNs;
          report.crossFileResets++;
          diagnostics.timestampResets++;
          placement = "concatenated-relative-after-absolute";
        } else if (segment.startNs <= relativeOriginNs + Math.max(segment.intervalNs, 1e3)) {
          if (matchesExistingTimeline(segment, placedSegments)) {
            report.preservedOverlaps++;
            placement = "preserved-overlap";
          } else {
            offsetNs = latestEndNs + segment.intervalNs - segment.startNs;
            report.crossFileResets++;
            diagnostics.timestampResets++;
            placement = "concatenated-cross-file-reset";
          }
        }
      } else if (!segment.absolute && relativeOriginNs === null) {
        relativeOriginNs = segment.startNs;
      }

      if (offsetNs) {
        segment.times = segment.times.map((time) => Math.round(time + offsetNs));
        segment.startNs = segment.times[0];
        segment.endNs = segment.times[segment.times.length - 1];
        report.concatenatedSegments++;
      }
      segment.placement = placement;

      for (let index = 0; index < segment.times.length; index++) {
        mergedTimes.push(segment.times[index]);
        mergedEcgs.push(segment.ecgs[index]);
      }
      placedSegments.push(segment);
      previousPlaced = segment;
      latestEndNs = Math.max(latestEndNs, segment.endNs);
    }
  }

  diagnostics.rowCount = diagnostics.totalRows;
  diagnostics.outOfOrderCount = diagnostics.outOfOrderRows;
  diagnostics.resetCount = diagnostics.timestampResets;
  const usedUnits = Object.entries(diagnostics.units).filter(([, count]) => count > 0).map(([unit]) => unit);
  const detectedRates = diagnostics.files
    .map((file) => file.detectedSampleRate)
    .filter((rate) => Number.isFinite(rate) && rate > 0);
  diagnostics.timestampUnits = usedUnits;
  diagnostics.detectedSampleRate = median(detectedRates);
  diagnostics.mixedTimestampUnits = usedUnits.length > 1;
  diagnostics.mixedTimeBases = diagnostics.files.some((file) => file.status === "accepted" && file.absoluteTimeline)
    && diagnostics.files.some((file) => file.status === "accepted" && !file.absoluteTimeline);

  if (!mergedTimes.length) {
    const schemaSummary = diagnostics.schemaErrors
      .map((entry) => `${entry.file}: ${entry.error}`)
      .join("; ");
    throw new Error(
      `No usable ECG samples were found in the uploaded CSV data.${schemaSummary ? ` ${schemaSummary}` : ""} `
      + "Expected a time/timestamp/timestamp_ns/timestamp_us/timestamp_ms/sample_index column "
      + "and an ecg/ecg_uv/voltage column."
    );
  }

  let orderedTimes = mergedTimes;
  let orderedEcgs = mergedEcgs;
  for (let index = 1; index < orderedTimes.length; index++) {
    if (orderedTimes[index] < orderedTimes[index - 1]) {
      diagnostics.mergeReordered = true;
      const order = Array.from({ length: orderedTimes.length }, (_, itemIndex) => itemIndex)
        .sort((left, right) => orderedTimes[left] - orderedTimes[right] || left - right);
      orderedTimes = order.map((itemIndex) => orderedTimes[itemIndex]);
      orderedEcgs = order.map((itemIndex) => orderedEcgs[itemIndex]);
      break;
    }
  }

  const ecgTimes = [];
  const ecgs = [];
  for (let index = 0; index < orderedTimes.length; index++) {
    if (ecgTimes.length && orderedTimes[index] === ecgTimes[ecgTimes.length - 1]) {
      diagnostics.duplicateTimestamps++;
      continue;
    }
    ecgTimes.push(orderedTimes[index]);
    ecgs.push(orderedEcgs[index]);
  }

  diagnostics.duplicateCount = diagnostics.duplicateTimestamps;
  diagnostics.usableRowsAfterDeduplication = ecgTimes.length;

  return { ecgTimes, ecgs, diagnostics };
}
