import * as React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SessionStats = {
  totalRuns: number;
  syntheticDetections: number;
  realDetections: number;
  totalLatencyMs: number;
};

export type SessionSettings = {
  /** Seconds of silence before auto-stopping recording. 0 = disabled. */
  silenceTimeoutSec: number;
  /** Seconds of audio to record before sending each chunk for inference. */
  chunkDurationSec: number;
  /** Number of recent chunks in the moving-average window for the live verdict. */
  liveWindowChunks: number;
  /** Alert when the moving average of p(synthetic) is at or above this (0–1). */
  alertThreshold: number;
  /** Minimum seconds between repeated synthetic-speech alerts. */
  alertCooldownSec: number;
  /** RMS level below which a chunk counts as silence (peak gate is 5× this). */
  silenceRmsThreshold: number;
  /** Initial state of the "Alerts" switch on capture pages. */
  alertsDefaultOn: boolean;
};

type SessionState = SessionStats & SessionSettings;

type SessionAction =
  | { type: 'RECORD_CHUNK'; prediction: 'synthetic' | 'real'; latencyMs: number }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<SessionSettings> };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: SessionSettings = {
  silenceTimeoutSec: 0,
  chunkDurationSec: 3,
  liveWindowChunks: 10,
  alertThreshold: 0.6,
  alertCooldownSec: 5,
  silenceRmsThreshold: 0.008,
  alertsDefaultOn: true,
};

const initialState: SessionState = {
  totalRuns: 0,
  syntheticDetections: 0,
  realDetections: 0,
  totalLatencyMs: 0,
  ...DEFAULT_SETTINGS,
};

function reducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'RECORD_CHUNK':
      return {
        ...state,
        totalRuns: state.totalRuns + 1,
        syntheticDetections:
          action.prediction === 'synthetic'
            ? state.syntheticDetections + 1
            : state.syntheticDetections,
        realDetections:
          action.prediction === 'real'
            ? state.realDetections + 1
            : state.realDetections,
        totalLatencyMs: state.totalLatencyMs + action.latencyMs,
      };
    case 'UPDATE_SETTINGS':
      return { ...state, ...action.patch };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type SessionContextValue = {
  stats: SessionStats;
  settings: SessionSettings;
  recordChunk: (prediction: 'synthetic' | 'real', latencyMs: number) => void;
  updateSettings: (patch: Partial<SessionSettings>) => void;
};

const SessionContext = React.createContext<SessionContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  const recordChunk = React.useCallback(
    (prediction: 'synthetic' | 'real', latencyMs: number) => {
      dispatch({ type: 'RECORD_CHUNK', prediction, latencyMs });
    },
    [],
  );

  const updateSettings = React.useCallback((patch: Partial<SessionSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', patch });
  }, []);

  const value = React.useMemo<SessionContextValue>(
    () => ({
      stats: {
        totalRuns: state.totalRuns,
        syntheticDetections: state.syntheticDetections,
        realDetections: state.realDetections,
        totalLatencyMs: state.totalLatencyMs,
      },
      settings: {
        silenceTimeoutSec: state.silenceTimeoutSec,
        chunkDurationSec: state.chunkDurationSec,
        liveWindowChunks: state.liveWindowChunks,
        alertThreshold: state.alertThreshold,
        alertCooldownSec: state.alertCooldownSec,
        silenceRmsThreshold: state.silenceRmsThreshold,
        alertsDefaultOn: state.alertsDefaultOn,
      },
      recordChunk,
      updateSettings,
    }),
    [state, recordChunk, updateSettings],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSession(): SessionContextValue {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
