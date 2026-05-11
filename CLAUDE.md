# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start Vite dev server
npm run build      # type-check + production build (tsc -b && vite build)
npm run lint       # ESLint across all files
npm run preview    # preview production build locally
```

No test suite is configured.

## Architecture

**Pure frontend app.** The `backend/` folder is a leftover and is not used. All inference is handled by an external API configured via the `VITE_API_BASE_URL` environment variable (defaults to `http://127.0.0.1:8000`).

**Routing** — `HashRouter` wraps the app (`src/main.tsx`). `src/App.tsx` declares all routes under a single `<Dashboard>` shell layout. Pages live in `src/pages/`.

**API layer** — `src/api/inference.ts` is the only file that talks to the backend:
- `predictFile()` — multipart POST to `/predict/file`
- `getModels()` — GET `/models`
- `createRealtimeSession()` — WebSocket to `/ws/predict?model_id=...`; returns a thin wrapper with `send(blob)` / `close()`.

`src/api/mockInference.ts` contains type definitions (`InferenceResultItem`, `InferenceResponse`) and a `mockPredictAudio()` stub used when a real backend isn't available.

**Real-time audio pipeline** — Mic and system-audio pages use `src/utils/pcmStreamRecorder.ts`, which captures raw PCM via `ScriptProcessorNode`, buffers it into fixed-duration chunks (3 s), encodes each chunk as WAV via `src/utils/audioChunking.ts`, and calls `createRealtimeSession().send()`. On stop, `getCombinedWav()` merges all samples for playback.

**Results display** — `src/dashboard/components/ResultsPanel.tsx` accepts `ChunkResult[]` and shows a moving average across chunks plus a per-chunk timeline. The confidence value from the backend is `max(p_fake, 1 - p_fake)`; the panel reverses this to recover `p(synthetic)` for display.

**Model list** — Currently hard-coded in `src/dashboard/components/ModelSelectorPanel.tsx` (`availableModels` array). The `/models` endpoint exists but is not yet wired to this panel.

**Theming** — MUI v7 with dark/light mode. Customisations are in `src/shared-theme/customizations/`. The app is deployed to GitHub Pages under the sub-path `/speech-detection-app/` (`base` in `vite.config.ts`).
