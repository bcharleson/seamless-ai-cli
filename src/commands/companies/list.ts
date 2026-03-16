import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const companiesListCommand: CommandDefinition = {
  name: 'companies_list',
  group: 'companies',
  subcommand: 'list',
  description:
    'List companies that have been researched and saved to your Seamless.ai org. Supports date range filtering and pagination.',
  examples: [
    'seamless companies list',
    'seamless companies list --limit 100 --page 2',
    'seamless companies list --start-date 2024-01-01 --end-date 2024-12-31',
    'seamless companies list --fields "name,domain,staffCount,annualRevenue,industries"',
    'seamless companies list --pretty',
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
      { field: 'startDate', flags: '--start-date <date>', description: 'Filter by research date start (ISO8601)' },
      { field: 'endDate', flags: '--end-date <date>', description: 'Filter by research date end (ISO8601)' },
    ],
  },
  endpoint: { method: 'GET', path: '/companies' },
  fieldMappings: {
    page: 'query',
    limit: 'query',
    startDate: 'query',
    endDate: 'query',
  },
  handler: async (input, client) => {
    const query: Record<string, any> = {};
    if (input.page !== undefined) query.page = input.page;
    if (input.limit !== undefined) query.limit = input.limit;
    if (input.startDate) query.startDate = input.startDate;
    if (input.endDate) query.endDate = input.endDate;

    return client.get('/companies', query);
  },
};
