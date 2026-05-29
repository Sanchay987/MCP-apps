"use client";

import { useState, useEffect } from 'react';
import type { InteractiveEnvelope, EnvelopeAction } from '@/lib/types';
import { StepProgressBar } from './StepProgressBar';
import { KnowledgeGraphVisualization } from '../KnowledgeGraph';

interface Props {
  envelope: InteractiveEnvelope;
  onAction: (action: EnvelopeAction) => void;
  disabled?: boolean;
}

const RATING_CONFIG: Record<string, { badge: string; border: string; dot: string }> = {
  HIGH: {
    badge:  'bg-red-100   dark:bg-red-900/30   text-red-700   dark:text-red-300   border-red-300   dark:border-red-700',
    border: 'border-l-red-500',
    dot:    'bg-red-500',
  },
  MEDIUM: {
    badge:  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    border: 'border-l-amber-500',
    dot:    'bg-amber-500',
  },
  LOW: {
    badge:  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
    border: 'border-l-green-500',
    dot:    'bg-green-500',
  },
};

export function SummaryCard({ envelope, onAction, disabled }: Props) {
  const { title, subtitle, payload, actions, state } = envelope;
  const {
    client,
    engagement,
    risk_rating,
    risk_score,
    rationale,
    flagged_factors,
    knowledge_graph_topic,
  } = payload;

  const [kgData, setKgData] = useState<any>(null);
  const [kgLoading, setKgLoading] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

  useEffect(() => {
    if (showGraph && !kgData && knowledge_graph_topic) {
      setKgLoading(true);
      fetch('/api/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'query_enterprise_knowledge_graph', args: { topic: knowledge_graph_topic } }),
      })
        .then((r) => r.json())
        .then((d) => { setKgData(d); setKgLoading(false); })
        .catch(() => setKgLoading(false));
    }
  }, [showGraph, kgData, knowledge_graph_topic]);

  const cfg = RATING_CONFIG[risk_rating] ?? RATING_CONFIG['LOW'];

  return (
    <div className={`card-fade-in rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm w-full border-l-4 ${cfg.border}`}>
      <StepProgressBar currentStep={state.step} />

      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <p className="font-semibold text-slate-900 dark:text-white text-base">{title}</p>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Meta row */}
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Client</p>
            <p className="font-medium text-slate-800 dark:text-slate-100">{client}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Engagement</p>
            <p className="font-medium text-slate-800 dark:text-slate-100">{engagement}</p>
          </div>
        </div>

        {/* Rating badge */}
        <div className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${cfg.badge}`}>
          <span className={`w-3 h-3 rounded-full shrink-0 animate-pulse ${cfg.dot}`} />
          <div>
            <p className="font-bold text-lg leading-none">{risk_rating} RISK</p>
            <p className="text-xs mt-1 opacity-80">Composite score: {risk_score}</p>
          </div>
        </div>

        {/* Rationale */}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{rationale}</p>

        {/* Flagged factors */}
        {Array.isArray(flagged_factors) && flagged_factors.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Flagged risk factors</p>
            <ul className="space-y-1.5">
              {flagged_factors.map((f: string, i: number) => (
                <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Knowledge graph drill-in */}
        {knowledge_graph_topic && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowGraph((v) => !v)}
              className="w-full text-left px-4 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 flex items-center justify-between transition-colors"
            >
              <span>View {engagement} Knowledge Graph</span>
              <svg className={`w-4 h-4 transition-transform duration-200 ${showGraph ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showGraph && (
              <div>
                {kgLoading ? (
                  <div className="flex items-center justify-center h-24 text-slate-400 text-sm">Loading graph…</div>
                ) : kgData?.nodes ? (
                  <KnowledgeGraphVisualization data={kgData} />
                ) : (
                  <div className="text-xs text-slate-400 p-4">Could not load graph data.</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-4 flex gap-2 border-t border-slate-100 dark:border-slate-700 pt-4">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => onAction(a)}
            disabled={disabled}
            title={a.description}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${a.kind === 'primary'
                ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                : a.kind === 'danger'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 disabled:opacity-50'
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

