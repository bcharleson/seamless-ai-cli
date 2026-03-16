import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { allCommands } from '../commands/index.js';
import { resolveApiKey } from '../core/auth.js';
import { SeamlessClient } from '../core/client.js';

export async function startMcpServer(): Promise<void> {
  const apiKey = await resolveApiKey();
  const client = new SeamlessClient({ apiKey });

  const server = new McpServer({
    name: 'seamless-ai',
    version: '0.1.0',
  });

  // Register every CommandDefinition as an MCP tool
  for (const cmdDef of allCommands) {
    const shape = cmdDef.inputSchema.shape;

    server.registerTool(
      cmdDef.name,
      {
        description: cmdDef.description,
        inputSchema: shape,
      },
      async (args: Record<string, unknown>) => {
        try {
          // Parse through the schema first to apply transforms (csvToArray, coerce, etc.)
          const parsed = cmdDef.inputSchema.safeParse(args);
          const input = parsed.success ? parsed.data : args;

          const result = await cmdDef.handler(input, client);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  error: error.message ?? String(error),
                  code: error.code ?? 'UNKNOWN_ERROR',
                }),
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(
    `Seamless.ai MCP server started. ${allCommands.length} tools registered.`,
  );
}
