"use client";

import React from 'react';
import {
  isKnowledgeGraphResponse,
  isKnowledgeGraphError,
  isFinancialDashboardResponse,
  isFinancialDashboardError,
  isInteractiveEnvelope,
} from '@/lib/types';
import type {
  KnowledgeGraphResponse,
  FinancialDashboardResponse,
  InteractiveEnvelope,
  EnvelopeAction,
} from '@/lib/types';
import { KnowledgeGraphVisualization, KnowledgeGraphError } from './KnowledgeGraph';
import { FinancialDashboardVisualization, FinancialDashboardError } from './FinancialDashboard';
import { OptionListCard } from './interactive/OptionListCard';
import { MultiStepFormCard } from './interactive/MultiStepFormCard';
import { SummaryCard } from './interactive/SummaryCard';
import { ConfirmationCard } from './interactive/ConfirmationCard';

interface ComponentDispatcherProps {
  content: string | object;
  onAction?: (action: EnvelopeAction) => void;
  cardDisabled?: boolean;
  onStartOver?: () => void;
}

export function ComponentDispatcher({ content, onAction, cardDisabled, onStartOver }: ComponentDispatcherProps) {
  let parsedContent: any = content;

  if (typeof content === 'string') {
    try {
      parsedContent = JSON.parse(content);
    } catch {
      return (
        <div className="prose dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap text-sm bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto">
            {content}
          </pre>
        </div>
      );
    }
  }

  // Interactive envelopes — must check BEFORE generic JSON fallback
  if (isInteractiveEnvelope(parsedContent)) {
    const envelope = parsedContent as InteractiveEnvelope;
    const handleAction = (a: EnvelopeAction) => onAction?.(a);

    switch (envelope.ui_type) {
      case 'option_list':
        return <OptionListCard envelope={envelope} onAction={handleAction} disabled={cardDisabled} />;
      case 'multi_step_form':
        return <MultiStepFormCard envelope={envelope} onAction={handleAction} disabled={cardDisabled} />;
      case 'summary_card':
        return <SummaryCard envelope={envelope} onAction={handleAction} disabled={cardDisabled} />;
      case 'confirmation_card':
        return <ConfirmationCard envelope={envelope} onStartOver={onStartOver} />;
      default:
        break;
    }
  }

  // Knowledge Graph
  if (isKnowledgeGraphResponse(parsedContent)) {
    return <KnowledgeGraphVisualization data={parsedContent as KnowledgeGraphResponse} />;
  }
  if (isKnowledgeGraphError(parsedContent) && !isFinancialDashboardError(parsedContent)) {
    return (
      <KnowledgeGraphError
        error={parsedContent.error}
        suggestion={parsedContent.suggestion}
        availableTopics={parsedContent.available_topics}
      />
    );
  }

  // Financial Dashboard
  if (isFinancialDashboardResponse(parsedContent)) {
    return <FinancialDashboardVisualization data={parsedContent as FinancialDashboardResponse} />;
  }
  if (isFinancialDashboardError(parsedContent)) {
    return (
      <FinancialDashboardError
        error={parsedContent.error}
        suggestion={parsedContent.suggestion}
        availableReports={parsedContent.available_reports}
      />
    );
  }

  // Default: formatted JSON
  return (
    <div className="prose dark:prose-invert max-w-none">
      <details className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
        <summary className="cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-300">
          View structured data
        </summary>
        <pre className="mt-3 text-xs overflow-x-auto">
          {JSON.stringify(parsedContent, null, 2)}
        </pre>
      </details>
    </div>
  );
}
