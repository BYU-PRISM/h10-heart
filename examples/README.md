# Example recordings

Three de-identified Polar H10 recordings, enough to exercise every analysis
path in the app: a short seated rest, a full night of sleep, and a workout.

| Example | Files | Duration | Contains |
| --- | --- | --- | --- |
| `subject-a/rest.csv.gz` | 1 | 8.2 min | Clean resting ECG, HR 54–62 bpm |
| `subject-a/sleep-*.csv.gz` | 7 | 6.1 h | Overnight recording split into hourly chunks, as the Polar app exports it |
| `subject-b/workout.csv.gz` | 1 | 34.6 min | Hard run, HR ~145 avg / 181 peak |

`manifest.json` lists row counts, start instants and durations.

## Format

Each file gunzips to the CSV the Polar Sensor Logger writes:

```
time,ecg,hr,rr,marker
1625889697969255482,1.388
1625889697976954518,-0.002
1625889698322598494,0.179,52,1156
```

- `time` — epoch **nanoseconds**
- `ecg` — millivolts, sampled at ~129.9 Hz
- `hr` — beats/min, present only on rows where the strap reported one
- `rr` — R-R interval in milliseconds, same
- `marker` — unused by these recordings

Trailing empty columns are omitted, so rows have two to five fields. The
analysis code derives its own R peaks and R-R intervals from `ecg`; the `hr`
and `rr` columns are the strap's own values, kept for comparison.

## What was removed

These come from real recordings by two consenting subjects. `tools/deidentify.mjs`
built them from the private originals and removed the only two identifying
details those exports carry:

1. **Names**, which appear in the original file and folder names, are replaced
   by `subject-a` / `subject-b`.
2. **Recording dates**, which are encoded in the `time` column, are shifted back
   by a whole number of days per subject.

The shift is a whole number of days, so the local time of day is unchanged — a
sleep recording still starts at night, which the recording classifier depends
on — and all relative timing within and between a subject's recordings is
preserved exactly.

Nothing else was altered except ECG precision: the exporter prints whole
microvolts as raw binary floats (`0.026000000000000002`), and those are rounded
back to 3 decimals, which is lossless for this sensor and roughly halves the
file size. Analysis output is byte-identical to the originals.

No other files from the source recordings — names, ages, blood work, training
history, prior reports — are in this repository.

## Rebuilding

Only useful if you hold the private originals:

```bash
npm run examples:build -- --source /path/to/private/recordings
```
