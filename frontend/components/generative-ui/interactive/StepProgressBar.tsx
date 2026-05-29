"use client";

interface Props {
  currentStep: number;
  totalSteps?: number;
}

export function StepProgressBar({ currentStep, totalSteps = 5 }: Props) {
  return (
    <div className="flex items-center gap-1.5 px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <div key={step} className="flex items-center gap-1.5 flex-1 last:flex-none">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300
                ${isCurrent
                  ? 'bg-blue-600 text-white ring-2 ring-blue-200 dark:ring-blue-900 scale-110'
                  : isCompleted
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
            >
              {isCompleted ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step
              )}
            </div>
            {step < totalSteps && (
              <div className={`flex-1 h-0.5 rounded-full transition-all duration-300
                ${isCompleted ? 'bg-blue-400 dark:bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
