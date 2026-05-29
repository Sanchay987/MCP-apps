"use client";

import { useState } from 'react';
import type { InteractiveEnvelope, EnvelopeAction } from '@/lib/types';
import { StepProgressBar } from './StepProgressBar';

interface CheckboxOption {
  id: string;
  label: string;
  weight?: number;
}

interface FormField {
  type: 'checkbox_group';
  id: string;
  label: string;
  options: CheckboxOption[];
}

interface Props {
  envelope: InteractiveEnvelope;
  onAction: (action: EnvelopeAction) => void;
  disabled?: boolean;
}

export function MultiStepFormCard({ envelope, onAction, disabled }: Props) {
  const { title, subtitle, payload, actions, state } = envelope;
  const fields: FormField[] = payload.fields ?? [];

  const [checked, setChecked] = useState<Record<string, string[]>>(
    Object.fromEntries(fields.map((f) => [f.id, []]))
  );

  const toggle = (fieldId: string, optionId: string) => {
    setChecked((prev) => {
      const current = prev[fieldId] ?? [];
      return {
        ...prev,
        [fieldId]: current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      };
    });
  };

  const handleContinue = (continueAction: EnvelopeAction) => {
    const mergedArgs: Record<string, any> = {};
    for (const [k, v] of Object.entries(continueAction.target_args)) {
      if (v === '__form_values__') {
        mergedArgs[k] = checked[fields[0]?.id] ?? [];
      } else {
        mergedArgs[k] = v;
      }
    }
    onAction({ ...continueAction, target_args: mergedArgs });
  };

  const selectedCount = Object.values(checked).flat().length;

  return (
    <div className="card-fade-in rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm w-full border-l-4 border-l-purple-500">
      <StepProgressBar currentStep={state.step} />

      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white text-base">{title}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {selectedCount > 0 && (
          <span className="ml-3 shrink-0 text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
            {selectedCount} selected
          </span>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {fields.map((field) => (
          <div key={field.id}>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{field.label}</p>
            <div className="space-y-2">
              {field.options.map((opt) => {
                const isChecked = (checked[field.id] ?? []).includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150
                      ${isChecked
                        ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-500'
                        : 'border-slate-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-600'
                      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={disabled}
                      onChange={() => toggle(field.id, opt.id)}
                      className="mt-0.5 w-4 h-4 accent-purple-600 shrink-0"
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm text-slate-800 dark:text-slate-100">{opt.label}</span>
                      {opt.weight && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ml-2 shrink-0
                          ${opt.weight >= 4
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : opt.weight >= 3
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          w{opt.weight}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-4 flex gap-2 border-t border-slate-100 dark:border-slate-700 pt-4">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => handleContinue(a)}
            disabled={disabled}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${a.kind === 'primary'
                ? 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-200 disabled:opacity-50'
              } disabled:cursor-not-allowed`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
