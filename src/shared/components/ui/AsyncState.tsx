import React from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

interface AsyncStateProps {
  state: 'loading' | 'empty' | 'error';
  title: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

const AsyncState: React.FC<AsyncStateProps> = ({
  state,
  title,
  message,
  onRetry,
  compact = false,
}) => {
  const wrapperClass = compact
    ? 'py-8 px-4 text-center'
    : 'py-12 px-6 text-center rounded-2xl border border-slate-200 bg-white';

  return (
    <div className={wrapperClass} role={state === 'error' ? 'alert' : 'status'}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        {state === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
        {state === 'empty' && <Inbox className="h-6 w-6" />}
        {state === 'error' && <AlertCircle className="h-6 w-6 text-red-500" />}
      </div>
      <p className="text-sm font-black uppercase tracking-wide text-slate-800">{title}</p>
      {message && <p className="mt-1 text-sm text-slate-500">{message}</p>}
      {state === 'error' && onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-xl border border-slate-300 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700 hover:bg-slate-50"
        >
          Reintentar
        </button>
      )}
    </div>
  );
};

export default AsyncState;
