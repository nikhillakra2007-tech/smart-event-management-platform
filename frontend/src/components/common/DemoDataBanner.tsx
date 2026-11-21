import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import {
  getDemoModeState,
  subscribeDemoMode,
  resetDemoMode,
} from '../../api/demoMode';
import { clearApiCache } from '../../api/client';

/**
 * Persistent banner shown whenever any data on screen came from the offline
 * sample-data fallback instead of the backend. The fallback keeps the
 * deployed demo explorable without a running backend, but it must never look
 * like live records.
 */
export const DemoDataBanner: React.FC = () => {
  const [state, setState] = useState(getDemoModeState());

  useEffect(() => subscribeDemoMode(setState), []);

  if (!state.mockDataActive) {
    return null;
  }

  const handleRetry = () => {
    clearApiCache();
    resetDemoMode();
    window.location.reload();
  };

  return (
    <div
      role="alert"
      className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3"
    >
      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" aria-hidden />
        <p className="text-xs sm:text-sm text-amber-200 leading-relaxed">
          <span className="font-semibold">Sample data mode.</span> The backend
          is unreachable, so this page is showing the built-in demo dataset
          (HackHive 2026 sample event), not live records. Actions taken now
          will not be saved.
        </p>
      </div>
      <button
        type="button"
        onClick={handleRetry}
        className="inline-flex items-center justify-center gap-1.5 self-start sm:self-auto rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/30 transition-colors"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
        Retry connection
      </button>
    </div>
  );
};
