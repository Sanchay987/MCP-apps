"use client";

import React, { useState } from 'react';
import { ComponentDispatcher } from '@/components/generative-ui/ComponentDispatcher';

// Import mock data for testing
const MOCK_CLOUD_SECURITY = {
  "nodes": [
    {
      "id": "kpmg",
      "label": "KPMG",
      "type": "organization",
      "description": "Global professional services firm",
      "properties": {
        "industry": "Professional Services",
        "focus": "Audit, Tax, Advisory"
      }
    },
    {
      "id": "client_techcorp",
      "label": "TechCorp Inc",
      "type": "client",
      "description": "Fortune 500 technology company",
      "properties": {
        "industry": "Technology",
        "region": "North America",
        "revenue": "$5B"
      }
    },
    {
      "id": "cloud_security_svc",
      "label": "Cloud Security Assessment",
      "type": "service",
      "description": "Comprehensive cloud infrastructure security audit",
      "properties": {
        "duration": "6 months",
        "status": "active",
        "risk_level": "high"
      }
    },
    {
      "id": "team_security",
      "label": "Security Advisory Team",
      "type": "team",
      "description": "Specialized cloud security consultants",
      "properties": {
        "size": "12 members",
        "expertise": "Cloud, IAM, Compliance"
      }
    },
    {
      "id": "aws_infrastructure",
      "label": "AWS Infrastructure",
      "type": "asset",
      "description": "Client's Amazon Web Services environment",
      "properties": {
        "accounts": "47",
        "regions": "5",
        "services": "EC2, S3, RDS, Lambda"
      }
    },
    {
      "id": "compliance_soc2",
      "label": "SOC 2 Type II",
      "type": "compliance",
      "description": "Security compliance framework",
      "properties": {
        "status": "in_progress",
        "target_date": "Q3 2026"
      }
    },
    {
      "id": "risk_data_exposure",
      "label": "Data Exposure Risk",
      "type": "risk",
      "description": "Identified vulnerability in S3 bucket configurations",
      "properties": {
        "severity": "critical",
        "impact": "high",
        "likelihood": "medium"
      }
    },
    {
      "id": "mitigation_iam",
      "label": "IAM Policy Hardening",
      "type": "mitigation",
      "description": "Strengthen identity and access management controls",
      "properties": {
        "priority": "high",
        "estimated_effort": "4 weeks"
      }
    }
  ],
  "edges": [
    {
      "source": "kpmg",
      "target": "client_techcorp",
      "relationship": "serves",
      "properties": {
        "since": "2024",
        "engagement_type": "advisory"
      }
    },
    {
      "source": "kpmg",
      "target": "team_security",
      "relationship": "employs",
      "properties": {
        "department": "Advisory"
      }
    },
    {
      "source": "team_security",
      "target": "cloud_security_svc",
      "relationship": "delivers",
      "properties": {
        "role": "lead"
      }
    },
    {
      "source": "cloud_security_svc",
      "target": "client_techcorp",
      "relationship": "provided_to",
      "properties": {
        "contract_value": "$2.5M"
      }
    },
    {
      "source": "client_techcorp",
      "target": "aws_infrastructure",
      "relationship": "owns",
      "properties": {
        "management": "full"
      }
    },
    {
      "source": "cloud_security_svc",
      "target": "aws_infrastructure",
      "relationship": "assesses",
      "properties": {
        "scope": "full_audit"
      }
    },
    {
      "source": "cloud_security_svc",
      "target": "compliance_soc2",
      "relationship": "targets",
      "properties": {
        "objective": "certification"
      }
    },
    {
      "source": "team_security",
      "target": "risk_data_exposure",
      "relationship": "identified",
      "properties": {
        "date": "2026-04-15"
      }
    },
    {
      "source": "risk_data_exposure",
      "target": "aws_infrastructure",
      "relationship": "affects",
      "properties": {
        "component": "S3 buckets"
      }
    },
    {
      "source": "mitigation_iam",
      "target": "risk_data_exposure",
      "relationship": "mitigates",
      "properties": {
        "effectiveness": "high"
      }
    },
    {
      "source": "team_security",
      "target": "mitigation_iam",
      "relationship": "implements",
      "properties": {
        "start_date": "2026-05-01"
      }
    }
  ],
  "metadata": {
    "topic": "Cloud Security",
    "node_count": 8,
    "edge_count": 11,
    "generated_at": "2026-05-18T12:00:00Z",
    "query_time_ms": 45
  },
  "query": "cloud security",
  "timestamp": "2026-05-18T12:00:00.123456+00:00Z"
};

const MOCK_AUDIT = {
  "nodes": [
    {
      "id": "kpmg_audit",
      "label": "KPMG Audit Practice",
      "type": "organization",
      "description": "Global audit and assurance services",
      "properties": {
        "clients": "5000+",
        "methodology": "KPMG Audit Execution Guide"
      }
    },
    {
      "id": "ifrs_standards",
      "label": "IFRS Standards",
      "type": "standard",
      "description": "International Financial Reporting Standards",
      "properties": {
        "version": "2026",
        "jurisdiction": "global"
      }
    },
    {
      "id": "risk_assessment",
      "label": "Risk Assessment Framework",
      "type": "methodology",
      "description": "Systematic approach to identifying audit risks",
      "properties": {
        "components": "Inherent, Control, Detection"
      }
    },
    {
      "id": "substantive_testing",
      "label": "Substantive Testing",
      "type": "procedure",
      "description": "Detailed testing of transactions and balances",
      "properties": {
        "types": "Analytical, Detail"
      }
    },
    {
      "id": "control_testing",
      "label": "Control Testing",
      "type": "procedure",
      "description": "Evaluation of internal control effectiveness",
      "properties": {
        "frequency": "annual"
      }
    },
    {
      "id": "audit_opinion",
      "label": "Audit Opinion",
      "type": "deliverable",
      "description": "Independent auditor's report on financial statements",
      "properties": {
        "types": "Unqualified, Qualified, Adverse, Disclaimer"
      }
    }
  ],
  "edges": [
    {
      "source": "kpmg_audit",
      "target": "ifrs_standards",
      "relationship": "applies",
      "properties": {
        "scope": "all_engagements"
      }
    },
    {
      "source": "kpmg_audit",
      "target": "risk_assessment",
      "relationship": "uses",
      "properties": {
        "phase": "planning"
      }
    },
    {
      "source": "risk_assessment",
      "target": "substantive_testing",
      "relationship": "informs",
      "properties": {
        "basis": "assessed_risk"
      }
    },
    {
      "source": "risk_assessment",
      "target": "control_testing",
      "relationship": "informs",
      "properties": {
        "basis": "control_reliance"
      }
    },
    {
      "source": "substantive_testing",
      "target": "audit_opinion",
      "relationship": "supports",
      "properties": {
        "evidence_type": "substantive"
      }
    },
    {
      "source": "control_testing",
      "target": "audit_opinion",
      "relationship": "supports",
      "properties": {
        "evidence_type": "control"
      }
    }
  ],
  "metadata": {
    "topic": "Audit Methodology",
    "node_count": 6,
    "edge_count": 6,
    "generated_at": "2026-05-18T12:00:00Z",
    "query_time_ms": 32
  }
};

const MOCK_ERROR = {
  "error": "Topic not found",
  "query": "blockchain",
  "available_topics": ["cloud_security", "audit_methodology", "tax_compliance"],
  "suggestion": "Try one of: cloud_security, audit_methodology, tax_compliance",
  "timestamp": "2026-05-18T12:00:00.123456+00:00Z"
};

export default function TestGraphPage() {
  const [selectedDemo, setSelectedDemo] = useState<'cloud' | 'audit' | 'error'>('cloud');

  const demoData = {
    cloud: MOCK_CLOUD_SECURITY,
    audit: MOCK_AUDIT,
    error: MOCK_ERROR
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Knowledge Graph Visualization Test
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Testing the Component Dispatcher with mock MCP server responses
          </p>
        </div>

        {/* Demo Selector */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setSelectedDemo('cloud')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedDemo === 'cloud'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Cloud Security (8 nodes, 11 edges)
          </button>
          <button
            onClick={() => setSelectedDemo('audit')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedDemo === 'audit'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Audit Methodology (6 nodes, 6 edges)
          </button>
          <button
            onClick={() => setSelectedDemo('error')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedDemo === 'error'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Error Response
          </button>
        </div>

        {/* Graph Visualization */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6">
          <ComponentDispatcher content={demoData[selectedDemo]} />
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
            How to Use
          </h2>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span><strong>Click nodes</strong> to see details and highlight connected entities</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span><strong>Drag nodes</strong> to rearrange the layout</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span><strong>Scroll</strong> to zoom in/out</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span><strong>Hover links</strong> to see relationship types</span>
            </li>
          </ul>

          <div className="mt-4 pt-4 border-t dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <strong>Note:</strong> This is a test page using mock data. In production, the Component Dispatcher
              will receive structured data from the MCP server and automatically render the appropriate visualization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
