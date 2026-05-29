# MCP Apps - Frontend with Generative UI

Frontend application for the KPMG MCP Apps POC, featuring Generative UI components.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000/test-graph to see the Knowledge Graph visualization.

## Structure

- `app/test-graph/` - Test page with mock data
- `components/generative-ui/` - Generative UI components
  - `ComponentDispatcher.tsx` - Routes structured data to components
  - `KnowledgeGraph.tsx` - Graph visualization
- `lib/types.ts` - TypeScript definitions

## Testing

Visit `/test-graph` to test with three mock datasets:
1. Cloud Security (8 nodes, 11 edges)
2. Audit Methodology (6 nodes, 6 edges)
3. Error Response

