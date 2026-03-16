import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const companiesResearchCommand: CommandDefinition = {
  name: 'companies_research',
  group: 'companies',
  subcommand: 'research',
  description:
    'Submit companies for deep research (enrichment). Accepts search result IDs from `companies search`, or raw company data (domain and/or name). Returns requestIds to poll with `companies poll`.',
  examples: [
    'seamless companies research --search-result-ids "abc123,def456"',
    'seamless companies research --domains "stripe.com,shopify.com"',
    'seamless companies research --company-names "Stripe,Shopify"',
    'seamless companies research --domains "acme.com" --company-names "Acme Corp"',
  ],
  inputSchema: z.object({
    searchResultIds: z
      .string()
      .optional()
      .transform((v) =>
        v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      ),
    domains: z
      .string()
      .optional()
      .transform((v) =>
        v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      ),
    companyNames: z
      .string()
      .optional()
      .transform((v) =>
        v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      ),
  }),
  cliMappings: {
    options: [
      {
        field: 'searchResultIds',
        flags: '--search-result-ids <ids>',
        description: 'Comma-separated searchResultId(s) from `companies search`',
      },
      {
        field: 'domains',
        flags: '--domains <domains>',
        description: 'Comma-separated company domain(s) to research (e.g. stripe.com)',
      },
      {
        field: 'companyNames',
        flags: '--company-names <names>',
        description: 'Comma-separated company name(s) to research',
      },
    ],
  },
  endpoint: { method: 'POST', path: '/companies/research' },
  fieldMappings: {
    searchResultIds: 'body',
    domains: 'body',
    companyNames: 'body',
  },
  handler: async (input, client) => {
    const body: Record<string, unknown> = {};

    if (input.searchResultIds?.length) {
      body['searchResultIds[]'] = input.searchResultIds;
    }

    // Merge domains and companyNames into companies[] array
    if (input.domains?.length || input.companyNames?.length) {
      const companiesArr: Array<{ domain?: string; companyName?: string }> = [];

      const maxLen = Math.max(
        input.domains?.length ?? 0,
        input.companyNames?.length ?? 0,
      );

      for (let i = 0; i < maxLen; i++) {
        const entry: { domain?: string; companyName?: string } = {};
        if (input.domains?.[i]) entry.domain = input.domains[i];
        if (input.companyNames?.[i]) entry.companyName = input.companyNames[i];
        companiesArr.push(entry);
      }

      body['companies[]'] = companiesArr;
    }

    if (!body['searchResultIds[]'] && !body['companies[]']) {
      throw new Error(
        'Provide --search-result-ids, --domains, or --company-names to research',
      );
    }

    return client.post('/companies/research', body);
  },
};
