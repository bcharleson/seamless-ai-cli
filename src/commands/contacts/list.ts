import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const contactsListCommand: CommandDefinition = {
  name: 'contacts_list',
  group: 'contacts',
  subcommand: 'list',
  description:
    'List contacts researched and saved to your Seamless.ai org. Dates are REQUIRED by the API and must span ≤30 days. Defaults to the last 30 days if omitted.',
  examples: [
    'seamless contacts list',
    'seamless contacts list --limit 100 --page 2',
    'seamless contacts list --start-date 2024-11-01 --end-date 2024-11-30',
    'seamless contacts list --fields "firstName,lastName,email,phone,company"',
    'seamless contacts list --pretty',
  ],
  inputSchema: z.object({
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(500).default(50).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
  cliMappings: {
    options: [
      { field: 'page', flags: '-p, --page <n>', description: 'Page number (default 1)' },
      { field: 'limit', flags: '-l, --limit <n>', description: 'Results per page (1-500, default 50)' },
      { field: 'startDate', flags: '--start-date <date>', description: 'Range start YYYY-MM-DD (default: 30 days ago). Range must be ≤30 days.' },
      { field: 'endDate', flags: '--end-date <date>', description: 'Range end YYYY-MM-DD (default: today). Range must be ≤30 days.' },
    ],
  },
  endpoint: { method: 'GET', path: '/contacts' },
  fieldMappings: {
    page: 'query',
    limit: 'query',
    startDate: 'query',
    endDate: 'query',
  },
  handler: async (input, client) => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const endDate = input.endDate ?? today.toISOString().split('T')[0];
    const startDate = input.startDate ?? thirtyDaysAgo.toISOString().split('T')[0];

    const diffDays = (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000;
    if (diffDays > 30) {
      throw new Error(
        `Date range must be ≤30 days (got ${Math.ceil(diffDays)} days). Seamless.ai requires this on the list endpoint.`,
      );
    }

    const query: Record<string, any> = { startDate, endDate };
    if (input.page !== undefined) query.page = input.page;
    if (input.limit !== undefined) query.limit = input.limit;

    return client.get('/contacts', query);
  },
};
