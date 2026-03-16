import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const companiesPollCommand: CommandDefinition = {
  name: 'companies_poll',
  group: 'companies',
  subcommand: 'poll',
  description:
    'Poll the status of company research requests. Pass the requestIds returned by `companies research`. Use --wait to automatically retry until all requests complete.',
  examples: [
    'seamless companies poll --request-ids "req_abc123,req_def456"',
    'seamless companies poll --request-ids "req_abc123" --wait',
    'seamless companies poll --request-ids "req_abc123" --wait --poll-interval 5',
    'seamless companies poll --request-ids "req_abc123" --fields "status,results.domain,results.staffCount"',
  ],
  inputSchema: z.object({
    requestIds: z
      .string()
      .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
    wait: z.boolean().optional().default(false),
    pollInterval: z.coerce.number().min(1).max(60).default(5).optional(),
    maxAttempts: z.coerce.number().min(1).max(120).default(24).optional(),
  }),
  cliMappings: {
    options: [
      {
        field: 'requestIds',
        flags: '--request-ids <ids>',
        description: 'Comma-separated requestId(s) from `companies research` (required)',
      },
      {
        field: 'wait',
        flags: '--wait',
        description: 'Keep polling until all requests complete (default: single poll)',
      },
      {
        field: 'pollInterval',
        flags: '--poll-interval <seconds>',
        description: 'Seconds between poll attempts when --wait is set (default 5)',
      },
      {
        field: 'maxAttempts',
        flags: '--max-attempts <n>',
        description: 'Max poll attempts when --wait is set (default 24 = ~2 min)',
      },
    ],
  },
  endpoint: { method: 'GET', path: '/companies/research/poll' },
  fieldMappings: {
    requestIds: 'query',
  },
  handler: async (input, client) => {
    const poll = () =>
      client.get('/companies/research/poll', {
        requestIds: input.requestIds,
      });

    if (!input.wait) {
      return poll();
    }

    const maxAttempts = input.maxAttempts ?? 24;
    const intervalMs = (input.pollInterval ?? 5) * 1000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = (await poll()) as any;
      const data: any[] = result?.data ?? [];
      const allDone = data.every((r: any) => r.status !== 'pending');

      if (allDone || data.length === 0) {
        return result;
      }

      const pending = data.filter((r: any) => r.status === 'pending').length;
      process.stderr.write(
        `[poll ${attempt + 1}/${maxAttempts}] ${pending}/${data.length} still pending...\n`,
      );

      if (attempt < maxAttempts - 1) {
        await sleep(intervalMs);
      }
    }

    return poll();
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
