"use client";

import type { InteractiveEnvelope } from '@/lib/types';
import { StepProgressBar } from './StepProgressBar';

interface Props {
  envelope: InteractiveEnvelope;
  onStartOver?: () => void;
}

export function ConfirmationCard({ envelope, onStartOver }: Props) {
  const { title, subtitle, payload, state } = envelope;
  const { message, icon, decision, rating, client } = payload;

  return (
    <div className="card-fade-in rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm w-full border-l-4 border-l-teal-500">
      <StepProgressBar currentStep={state.step} />

      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <p className="font-semibold text-slate-900 dark:text-white text-base">{title}</p>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="px-5 py-6 flex flex-col items-center text-center gap-4">
        {icon === 'success' ? (
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
            </svg>
          </div>
        )}

        <div>
          <p className="text-sm text-slate-700 dark:text-slate-200 max-w-sm leading-relaxed">{message}</p>
          {rating && client && (
            <p className="text-xs text-slate-400 mt-2">
              {client} — <span className="font-medium">{rating} risk</span> — {decision === 'approved' ? 'Approved' : 'Escalated'}
            </p>
          )}
        </div>

        {onStartOver && (
          <button
            onClick={onStartOver}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 transition-opacity hover:opacity-80"
          >
            ↩ Start a new assessment
          </button>
        )}
      </div>
    </div>
  );
}
