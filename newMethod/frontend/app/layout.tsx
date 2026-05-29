import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'newMethod — MCP Apps',
  description: 'KPMG MCP Apps Standard (SEP-1865) — server-driven UI demo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
