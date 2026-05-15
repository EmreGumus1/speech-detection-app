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
};

type SessionState = SessionStats & SessionSettings;

type SessionAction =
  | { type: 'RECORD_CHUNK'; prediction: 'synthetic' | 'real'; latencyMs: number }
  | { type: 'SET_SILENCE_TIMEOUT'; seconds: number };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const initialState: SessionState = {
  totalRuns: 0,
  syntheticDetections: 0,
  realDetections: 0,
  totalLatencyMs: 0,
  silenceTimeoutSec: 0,
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
    case 'SET_SILENCE_TIMEOUT':
      return { ...state, silenceTimeoutSec: action.seconds };
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
  setSilenceTimeout: (seconds: number) => void;
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

  const setSilenceTimeout = React.useCallback((seconds: number) => {
    dispatch({ type: 'SET_SILENCE_TIMEOUT', seconds });
  }, []);

  const value = React.useMemo<SessionContextValue>(
    () => ({
      stats: {
        totalRuns: state.totalRuns,
        syntheticDetections: state.syntheticDetections,
        realDetections: state.realDetections,
        totalLatencyMs: state.totalLatencyMs,
      },
      settings: { silenceTimeoutSec: state.silenceTimeoutSec },
      recordChunk,
      setSilenceTimeout,
    }),
    [state, recordChunk, setSilenceTimeout],
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
