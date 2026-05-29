import type { NextConfig } from 'next';

const config: NextConfig = {
  serverExternalPackages: ['@modelcontextprotocol/sdk'],
  // Allow connecting to the local MCP Apps server on port 3002
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default config;
