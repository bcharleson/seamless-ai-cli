import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const contactsPollCommand: CommandDefinition = {
  name: 'contacts_poll',
  group: 'contacts',
  subcommand: 'poll',
  description:
    'Poll the status of contact research requests. Pass the requestIds returned by `contacts research`. Use --wait to automatically retry until all requests complete.',
  examples: [
    'seamless contacts poll --request-ids "req_abc123,req_def456"',
    'seamless contacts poll --request-ids "req_abc123" --wait',
    'seamless contacts poll --request-ids "req_abc123" --wait --poll-interval 3',
    'seamless contacts poll --request-ids "req_abc123" --fields "status,contact.email,contact.phone"',
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
        description: 'Comma-separated requestId(s) from `contacts research` (required)',
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
  endpoint: { method: 'GET', path: '/contacts/research/poll' },
  fieldMappings: {
    requestIds: 'query',
  },
  handler: async (input, client) => {
    const poll = () =>
      client.get('/contacts/research/poll', {
        requestIds: input.requestIds,
      });

    if (!input.wait) {
      return poll();
    }

    // Auto-polling mode: keep going until all statuses are non-pending
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

    // Return final state even if still pending
    return poll();
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
