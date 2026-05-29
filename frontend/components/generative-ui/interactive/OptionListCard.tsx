"use client";

import type { InteractiveEnvelope, EnvelopeAction } from '@/lib/types';
import { StepProgressBar } from './StepProgressBar';

interface Props {
  envelope: InteractiveEnvelope;
  onAction: (action: EnvelopeAction) => void;
  disabled?: boolean;
}

export function OptionListCard({ envelope, onAction, disabled }: Props) {
  const { title, subtitle, actions, state } = envelope;

  return (
    <div className="card-fade-in rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm w-full border-l-4 border-l-blue-500">
      <StepProgressBar currentStep={state.step} />

      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <p className="font-semibold text-slate-900 dark:text-white text-base">{title}</p>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => onAction(a)}
            disabled={disabled}
            className={`w-full text-left px-5 py-3.5 flex items-center justify-between group transition-colors
              ${disabled
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'
              }`}
          >
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">{a.label}</p>
              {a.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.description}</p>
              )}
            </div>
            <svg
              className={`w-4 h-4 shrink-0 ml-3 transition-colors ${disabled ? 'text-slate-300' : 'text-slate-400 group-hover:text-blue-500'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
