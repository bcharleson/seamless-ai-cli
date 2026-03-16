import { startMcpServer } from './mcp/server.js';

// Direct MCP entry point — use in MCP config:
// { "command": "node", "args": ["/path/to/dist/mcp.js"] }
// or: { "command": "seamless", "args": ["mcp"] }

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

startMcpServer().catch((error) => {
  console.error('Failed to start MCP server:', error.message ?? error);
  process.exit(1);
});
