# Speech Detection App — Project Context & Architecture

> Purpose of this document: give an AI assistant (or new developer) enough context to
> navigate the codebase and produce an accurate system-architecture chart. Everything
> described here reflects the actual code; file paths are relative to the repo root.

## What the app is

A **pure frontend** React SPA that detects **synthetic (deepfake) speech** in real time.
It captures audio (microphone, system audio, or uploaded file), slices it into fixed-length
chunks, and sends each chunk to an **external inference API** for two parallel analyses:

1. **Deepfake detection** — one or more detector models return p(synthetic) per chunk.
2. **Whisper transcription + scam-pattern detection** — a sliding-window transcript with
   per-segment timestamps, scanned for scam keywords (English + Italian).

The UI renders: a waveform colored green→red by p(synthetic), a per-model moving-average
"Live Result" verdict, OS/in-app alerts, and a transcript whose sentence blocks are colored
and scored by the detector output that overlaps them in time.

**Important:** the `backend/` folder is a leftover and is NOT used. All inference happens in
an external API configured via `VITE_API_BASE_URL` (default `http://127.0.0.1:8000`).

## Tech stack & commands

- React 19 + TypeScript, Vite 8, MUI v7 (CSS-variables color scheme mode), React Router (HashRouter)
- No test suite. No state library — one React context + local component state.

```bash
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build (type-check + bundle)
npm run lint       # ESLint (has pre-existing baseline errors in theme/scaffold files)
npm run preview    # serve the production build
```

Deployed to GitHub Pages under sub-path `/speech-detection-app/` (`base` in `vite.config.ts`;
HashRouter avoids server-side routing). CI uses `npm install` (not `ci`) because the lockfile
is generated on Windows.

## Runtime topology

```
┌─────────────────────────── Browser (this repo) ───────────────────────────┐
│                                                                           │
│  Audio source                PcmStreamRecorder          UI panels         │
│  ┌──────────────┐   MediaStream  ┌────────────┐   ChunkResult[]           │
│  │ getUserMedia │───────────────▶│ ScriptProc.│──┐                        │
│  │ getDisplay-  │                │ 3s buffer  │  │  ┌─ WaveformPanel      │
│  │   Media      │                │ → WAV blob │  │  ├─ ResultsPanel       │
│  │ file upload  │                └────────────┘  │  ├─ ScamResultPanel    │
│  └──────────────┘                      │         │  │   └ SegmentedTrans. │
│                                        ▼         │  └─ alerts/Snackbar    │
│                          same WAV sent to BOTH:  │                        │
└────────────────────────────────┬─────────┬───────┼────────────────────────┘
                                 │         │       │ (state lives in pages)
                    WS /ws/predict         WS /ws/transcribe
                                 │         │
                    ┌────────────▼─────────▼────────────┐
                    │   External inference API (FastAPI-ish, not in repo)   │
                    │   REST: /models, /models/{id}/status|download,        │
                    │         /predict/file, /transcribe/file,              │
                    │         /whisper-models                               │
                    └────────────────────────────────────┘
```

Key invariant: **the chunk timeline is the shared clock.** Every recorded chunk is sent to
*both* WebSockets — even silent chunks — so that deepfake chunk index `n` and Whisper's
`window_start_sec` refer to the same absolute seconds. All cross-referencing (transcript
coloring, gradient strip) depends on this alignment.

## Directory map

```
src/
├── main.tsx                    # HashRouter + SessionProvider + theme bootstrap
├── App.tsx                     # all routes, wrapped in <Dashboard> shell layout
├── api/
│   ├── inference.ts            # deepfake API: predictFile(), getModels(),
│   │                           #   getModelStatus(), downloadModel(),
│   │                           #   createRealtimeSession() → WS /ws/predict
│   ├── whisper.ts              # transcription API: getWhisperModels(), transcribeFile(),
│   │                           #   createTranscribeSession() → WS /ws/transcribe; types
│   └── mockInference.ts        # InferenceResultItem/InferenceResponse types + mock stub
├── pages/                      # one component per route; own all capture/session state
│   ├── MicInferencePage.tsx        # live mic capture
│   ├── SystemAudioInferencePage.tsx# live system audio (getDisplayMedia or input device);
│   │                               #   ONLY page with the synthetic-speech alert system
│   ├── FileInferencePage.tsx       # upload file → split into chunks → REST per chunk
│   ├── ModelsPage.tsx              # model management (download state)
│   └── SettingsPage.tsx            # sliders/switches writing to SessionContext
├── context/
│   └── SessionContext.tsx      # global: session stats + SessionSettings (see below)
├── dashboard/components/
│   ├── ModelSelectorPanel.tsx  # checkbox multi-select; disables non-downloaded models
│   ├── WhisperSelectorPanel.tsx# whisper model/language/transcript toggle
│   ├── WaveformPanel.tsx       # canvas waveform, chunks colored by p(synthetic)
│   ├── ResultsPanel.tsx        # "Live Result" moving average per model; ChunkResult type
│   ├── ScamResultPanel.tsx     # transcript card + gradient strip + scam matches
│   └── SegmentedTranscript.tsx # per-segment colored boxes with % score
├── utils/
│   ├── pcmStreamRecorder.ts    # ScriptProcessorNode → fixed-duration Float32 chunks → WAV
│   ├── audioChunking.ts        # WAV encoding + file splitting
│   ├── silence.ts              # isSilentChunk(): RMS + peak gate (peak = 5× RMS threshold)
│   ├── aggregateChunks.ts      # moving average per model; toSyntheticProbability()
│   ├── intervalToChunkProb.ts  # time interval → overlap-weighted chunk score (transcript %)
│   ├── chunksToGradient.ts     # chunk scores → CSS gradient (strip above transcript)
│   ├── mergeScamResult.ts      # sliding-window transcript merge (defensive, see below)
│   └── colorScale.ts           # p → HSL color (0 = green/real, 1 = red/synthetic)
└── shared-theme/               # MUI theme customizations (light/dark via useColorScheme)
```

## Data flow, step by step (live pages)

1. **Capture** — page obtains a `MediaStream`, passes it to `createPcmStreamRecorder(stream,
   settings.chunkDurationSec, onChunk)`.
2. **Chunking** — recorder buffers raw PCM; every N seconds emits `(wavBlob, duration,
   samples, sampleRate)`.
3. **Silence gate** — `isSilentChunk(samples, settings.silenceRmsThreshold)`. The flag is
   pushed with the samples onto `pendingSamplesRef` (a FIFO queue) and the WAV is sent to
   both WebSockets regardless (clock alignment).
4. **Deepfake response** — `/ws/predict` returns `{ duration_sec, results: [{model_id,
   model_name, prediction, confidence, inference_time_ms}] }` per chunk. The page shifts the
   pending queue to reattach `samples` + `isSilent`, then appends a `ChunkResult`. Silent or
   errored chunks keep their timeline slot but get `results: []` (renders gray, excluded
   from all scoring). Messages without `results`/`error` are ignored WITHOUT shifting the
   queue (alignment guard).
5. **Whisper response** — `/ws/transcribe` emits either warmup progress or a
   `TranscribeResult` covering a sliding window (`window_start_sec`..`window_end_sec`,
   `segments[]` with window-relative timestamps). `mergeScamResult` accumulates these.
6. **Render** — panels derive everything from `chunks: ChunkResult[]` and the merged
   `TranscribeResult`.

### Confidence encoding (easy to get wrong)

The backend returns `confidence = max(p_fake, 1 − p_fake)`. The frontend recovers
p(synthetic) via `toSyntheticProbability()`: `prediction === 'synthetic' ? confidence
: 1 − confidence`. All displays work in p(synthetic) space (0 = real/green, 1 = fake/red).

### Multi-model semantics

- **Live Result / alerts:** per-model — `aggregateChunks` groups by `model_id`; the alert
  fires when ANY model's windowed average ≥ threshold.
- **Waveform color & transcript %:** blended — plain mean across selected models per chunk,
  then (for transcript) overlap-weighted across the chunks a segment spans
  (`intervalToChunkProb`).

### Transcript merge (`mergeScamResult.ts`)

Whisper re-transcribes overlapping sliding windows, so successive emissions contain the same
audio re-heard with refined timestamps. The merge keeps segments in absolute time and
replaces an accumulated segment **only when incoming segments re-cover > 50% of its time
span**; `window_start_sec` is clamped monotonic. Design goal: a mis-reported window or a
"re-heard as silence" pass can keep stale text but can never delete history.

## Settings (`SessionContext.tsx` → Settings page)

All session-scoped (reset on reload). `settings.*` consumed by pages:

| Setting | Default | Effect | Applied |
|---|---|---|---|
| `chunkDurationSec` | 3 s | recorder chunk length (mic + system pages) | next capture |
| `liveWindowChunks` | 10 | moving-average window (both live pages) | live |
| `alertThreshold` | 0.6 | alert trigger on windowed average | live |
| `alertCooldownSec` | 5 s | min interval between repeated alerts | live |
| `alertsDefaultOn` | true | initial state of the Alerts switch | page mount |
| `silenceRmsThreshold` | 0.008 | silence gate (peak gate = 5×) | next capture |
| `silenceTimeoutSec` | 0 (off) | auto-stop after continuous silence | live |

File page keeps a fixed 3 s split but honors the silence threshold.

## Navigation tips for common questions

- "Why is the waveform gray / no verdict?" → silence gating (`silence.ts`) or empty
  `results` from backend; ResultsPanel shows an explicit SILENCE state.
- "Where do alert notifications come from?" → effect at the top of
  `SystemAudioInferencePage` (Snackbar + `Notification` API).
- "Where is the color scale defined?" → `colorScale.ts` (HSL hue 120→0) and the same
  formula inline in `WaveformPanel`.
- "Who owns state?" → each page owns its capture session (refs for WS/recorder/queue,
  state for chunks); only stats + settings are global (SessionContext).
- Branch note: `main` is current; `OlderVersion` is a historical branch predating a
  collaborator's rewrite.
