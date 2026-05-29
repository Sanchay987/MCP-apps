"use client";

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type {
  KnowledgeGraphResponse,
  KnowledgeGraphNode,
  KnowledgeGraphEdge
} from '@/lib/types';

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-white dark:bg-slate-900">
      <div className="text-slate-500">Loading graph visualization...</div>
    </div>
  ),
});

interface KnowledgeGraphProps {
  data: KnowledgeGraphResponse;
}

// Color mapping for different node types
const NODE_TYPE_COLORS: Record<string, string> = {
  organization: '#3b82f6',  // blue
  client: '#10b981',        // green
  service: '#8b5cf6',       // purple
  team: '#f59e0b',          // amber
  asset: '#06b6d4',         // cyan
  compliance: '#ec4899',    // pink
  risk: '#ef4444',          // red
  mitigation: '#22c55e',    // green
  standard: '#6366f1',      // indigo
  regulation: '#8b5cf6',    // violet
  regulator: '#f97316',     // orange
  methodology: '#14b8a6',   // teal
  procedure: '#a855f7',     // purple
  deliverable: '#84cc16',   // lime
  default: '#64748b'        // slate
};

export function KnowledgeGraphVisualization({ data }: KnowledgeGraphProps) {
  const graphRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<KnowledgeGraphNode | null>(null);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());

  // Resize handler
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = Math.min(600, window.innerHeight * 0.7);
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Transform data to force-graph format
  const graphData = {
    nodes: data.nodes.map(node => ({
      id: node.id,
      name: node.label,
      type: node.type,
      description: node.description,
      properties: node.properties,
      val: 3, // Node size
      color: NODE_TYPE_COLORS[node.type] || NODE_TYPE_COLORS.default
    })),
    links: data.edges.map((edge, idx) => ({
      source: edge.source,
      target: edge.target,
      label: edge.relationship,
      properties: edge.properties,
      id: `${edge.source}-${edge.target}-${idx}`
    }))
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(data.nodes.find(n => n.id === node.id) || null);

    // Highlight connected nodes and links
    const connectedNodeIds = new Set<string>();
    const connectedLinkIds = new Set<string>();

    data.edges.forEach((edge, idx) => {
      if (edge.source === node.id || edge.target === node.id) {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
        connectedLinkIds.add(`${edge.source}-${edge.target}-${idx}`);
      }
    });

    setHighlightNodes(connectedNodeIds);
    setHighlightLinks(connectedLinkIds);
  };

  const handleBackgroundClick = () => {
    setSelectedNode(null);
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
  };

  return (
    <div className="knowledge-graph-container border rounded-lg bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {data.metadata.topic}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {data.metadata.node_count} entities · {data.metadata.edge_count} relationships
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Query time: {data.metadata.query_time_ms}ms
          </div>
        </div>
      </div>

      {/* Graph Visualization */}
      <div ref={containerRef} className="relative bg-white dark:bg-slate-900">
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          nodeLabel="name"
          nodeRelSize={6}
          linkLabel="label"
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={0.8}
          linkCurvature={0.15}
          linkColor={(link: any) =>
            highlightLinks.has(link.id) ? '#3b82f6' : '#94a3b8'
          }
          linkWidth={(link: any) => highlightLinks.has(link.id) ? 3 : 1}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            const isHighlighted = highlightNodes.has(node.id);

            // Draw node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI);
            ctx.fillStyle = node.color;
            ctx.fill();

            if (isHighlighted) {
              ctx.strokeStyle = '#3b82f6';
              ctx.lineWidth = 2 / globalScale;
              ctx.stroke();
            }

            // Draw label
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isHighlighted ? '#1e40af' : '#475569';
            ctx.fillText(label, node.x, node.y + node.val + fontSize);
          }}
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      </div>

      {/* Selected Node Info Panel */}
      {selectedNode && (
        <div className="p-4 border-t bg-white dark:bg-slate-800 max-h-48 overflow-y-auto">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                {selectedNode.label}
              </h4>
              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
                {selectedNode.type}
              </span>
            </div>
            <button
              onClick={handleBackgroundClick}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            {selectedNode.description}
          </p>

          {Object.keys(selectedNode.properties).length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Properties
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selectedNode.properties).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{key}:</span>{' '}
                    <span className="text-slate-900 dark:text-white font-medium">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="p-3 border-t bg-slate-50 dark:bg-slate-800/50">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          Node Types:
        </p>
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(data.nodes.map(n => n.type))).map(type => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: NODE_TYPE_COLORS[type] || NODE_TYPE_COLORS.default }}
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                {type.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function KnowledgeGraphError({ error, suggestion, availableTopics }: {
  error: string;
  suggestion?: string;
  availableTopics?: string[];
}) {
  return (
    <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
      <div className="flex items-start gap-3">
        <div className="text-red-600 dark:text-red-400 text-xl">⚠️</div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
            {error}
          </h4>
          {suggestion && (
            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
              {suggestion}
            </p>
          )}
          {availableTopics && availableTopics.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">
                Available topics:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availableTopics.map(topic => (
                  <span
                    key={topic}
                    className="px-2 py-0.5 text-xs rounded bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200"
                  >
                    {topic.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
