import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// URL of the Python FastAPI engine (set in env when launching)
const ENGINE_URL = process.env.HUMMBL_ENGINE_URL || 'http://localhost:8080';

// Create the server instance
const server = new McpServer({
  name: 'hummbl-engine',
  version: '1.0.0',
});

// Tool: consult_council
server.tool(
  'consult_council',
  'Ask the Python engine to consult the council.',
  {
    topic: z.string(),
    member: z.string(),
  },
  async (args) => {
    const res = await fetch(`${ENGINE_URL}/consult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    const data = await res.json();
    return {
      content: [{ type: 'text', text: JSON.stringify(data) }],
    };
  },
);

// Tool: run_constitutional_audit
server.tool(
  'run_constitutional_audit',
  'Run a constitutional audit on provided draft text.',
  {
    draft_text: z.string(),
  },
  async (args) => {
    const res = await fetch(`${ENGINE_URL}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    const data = await res.json();
    return {
      content: [{ type: 'text', text: JSON.stringify(data) }],
    };
  },
);

// Start listening on stdio
const transport = new StdioServerTransport();
server.connect(transport);
