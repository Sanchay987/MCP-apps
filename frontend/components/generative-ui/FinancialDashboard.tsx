"use client";

import React from 'react';
import type {
  FinancialDashboardResponse,
  RevenueByService,
  KeyMetric,
  RegionalPerformance,
  Alert
} from '@/lib/types';

interface FinancialDashboardProps {
  data: FinancialDashboardResponse;
}

// Status color mapping
const STATUS_COLORS = {
  excellent: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  good: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  warning: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  poor: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
};

const ALERT_COLORS = {
  success: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200',
  warning: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200',
  info: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
  error: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
};

const TREND_ICONS = {
  up: '↗',
  down: '↘',
  stable: '→'
};

/**
 * Financial Dashboard Visualization - Second Generative UI Example
 *
 * This component demonstrates that the Generative UI pattern works
 * for different data types, not just graphs. It renders structured
 * financial data as an interactive dashboard with cards and metrics.
 */
export function FinancialDashboardVisualization({ data }: FinancialDashboardProps) {
  const formatCurrency = (value: number): string => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number, unit: string): string => {
    if (unit === 'USD') {
      return formatCurrency(value);
    } else if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === 'score') {
      return value.toFixed(0);
    } else if (unit === 'clients') {
      return value.toFixed(0);
    }
    return `${value.toFixed(1)} ${unit}`;
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{data.client}</h2>
            <p className="text-blue-100 text-sm">{data.period}</p>
            {data.engagement_id && (
              <p className="text-blue-100 text-xs mt-1">ID: {data.engagement_id}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-100 mb-1">Net Income</p>
            <p className="text-3xl font-bold">{formatCurrency(data.summary.net_income)}</p>
            <p className="text-sm text-blue-100 mt-1">
              {data.summary.profit_margin.toFixed(1)}% margin
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-5 shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(data.summary.total_revenue)}
          </p>
          {data.summary.growth_rate !== undefined && (
            <p className={`text-sm mt-2 ${data.summary.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.summary.growth_rate >= 0 ? '↗' : '↘'} {Math.abs(data.summary.growth_rate).toFixed(1)}% growth
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-5 shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(data.summary.total_expenses)}
          </p>
          <p className="text-sm mt-2 text-slate-600 dark:text-slate-400">
            Operating costs
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-5 shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Profit Margin</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {data.summary.profit_margin.toFixed(1)}%
          </p>
          {data.summary.budget_variance !== undefined && (
            <p className={`text-sm mt-2 ${data.summary.budget_variance >= 0 ? 'text-green-600' : 'text-amber-600'}`}>
              {data.summary.budget_variance >= 0 ? '↗' : '↘'} {Math.abs(data.summary.budget_variance).toFixed(1)}% vs budget
            </p>
          )}
        </div>
      </div>

      {/* Revenue by Service */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Revenue by Service
        </h3>
        <div className="space-y-3">
          {data.revenue_by_service.map((service, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {service.service}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {TREND_ICONS[service.trend]}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(service.revenue)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                    ({service.percentage}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${service.percentage}%` }}
                />
              </div>
              {service.growth !== undefined && (
                <p className={`text-xs ${service.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {service.growth >= 0 ? '↗' : '↘'} {Math.abs(service.growth).toFixed(1)}% growth
                  {service.hours_billed && ` • ${service.hours_billed.toLocaleString()} hours billed`}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Key Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.key_metrics.map((metric, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${STATUS_COLORS[metric.status]}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase mb-1 opacity-75">
                    {metric.metric}
                  </p>
                  <p className="text-2xl font-bold">
                    {formatNumber(metric.value, metric.unit)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    metric.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {metric.change >= 0 ? '↗' : '↘'} {Math.abs(metric.change).toFixed(1)}%
                  </span>
                </div>
              </div>
              <p className="text-xs mt-2 opacity-75 capitalize">
                Status: {metric.status}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Regional Performance */}
      {data.regional_performance && data.regional_performance.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Regional Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.regional_performance.map((region, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                  {region.region}
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(region.revenue)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {region.percentage}% of total
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ↗ {region.growth.toFixed(1)}% growth
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${ALERT_COLORS[alert.type]}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                </div>
                <span className="text-xs uppercase font-semibold ml-3 opacity-75">
                  {alert.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Metadata */}
      <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4">
        <div className="flex items-center justify-between">
          <span>Source: {data.metadata.data_source}</span>
          <span>Currency: {data.metadata.currency}</span>
          <span>Generated: {new Date(data.metadata.generated_at).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

interface FinancialDashboardErrorProps {
  error: string;
  suggestion?: string;
  availableReports?: string[];
}

export function FinancialDashboardError({
  error,
  suggestion,
  availableReports
}: FinancialDashboardErrorProps) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {error}
          </h3>
          {suggestion && (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              {suggestion}
            </p>
          )}
          {availableReports && availableReports.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-2">
                Available reports:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {availableReports.map((report, idx) => (
                  <li key={idx} className="text-xs text-amber-700 dark:text-amber-300">
                    {report.replace(/_/g, ' ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
