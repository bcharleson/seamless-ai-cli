import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const contactsResearchCommand: CommandDefinition = {
  name: 'contacts_research',
  group: 'contacts',
  subcommand: 'research',
  description:
    'Submit contacts for deep research (enrichment). Accepts search result IDs from `contacts search`, or raw contact data (name + company). Returns requestIds to poll with `contacts poll`.',
  examples: [
    'seamless contacts research --search-result-ids "abc123,def456"',
    'seamless contacts research --contacts "John Smith:Acme Corp,Jane Doe:Stripe"',
    'seamless contacts research --search-result-ids "abc123" --is-job-change',
    'seamless contacts research --linkedin-urls "https://linkedin.com/in/johndoe"',
  ],
  inputSchema: z.object({
    searchResultIds: z
      .string()
      .optional()
      .transform((v) =>
        v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      ),
    // "Name:Company" format, comma-separated for multiple
    contacts: z
      .string()
      .optional()
      .transform((v) => {
        if (!v) return undefined;
        return v.split(',').map((entry) => {
          const [name, company] = entry.split(':').map((s) => s.trim());
          return { name: name ?? entry.trim(), company: company };
        });
      }),
    linkedInUrls: z
      .string()
      .optional()
      .transform((v) =>
        v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      ),
    isJobChange: z.boolean().optional().default(false),
  }),
  cliMappings: {
    options: [
      {
        field: 'searchResultIds',
        flags: '--search-result-ids <ids>',
        description: 'Comma-separated searchResultId(s) from `contacts search`',
      },
      {
        field: 'contacts',
        flags: '--contacts <pairs>',
        description: 'Comma-separated "Name:Company" pairs for raw research',
      },
      {
        field: 'linkedInUrls',
        flags: '--linkedin-urls <urls>',
        description: 'Comma-separated LinkedIn profile URL(s)',
      },
      {
        field: 'isJobChange',
        flags: '--is-job-change',
        description: 'Flag to indicate this is a job-change research request',
      },
    ],
  },
  endpoint: { method: 'POST', path: '/contacts/research' },
  fieldMappings: {
    searchResultIds: 'body',
    contacts: 'body',
    linkedInUrls: 'body',
    isJobChange: 'body',
  },
  handler: async (input, client) => {
    const body: Record<string, unknown> = {};

    if (input.searchResultIds?.length) {
      body['searchResultIds[]'] = input.searchResultIds;
    }

    if (input.contacts?.length) {
      body['contacts[]'] = input.contacts;
    }

    if (input.linkedInUrls?.length) {
      // LinkedIn URLs map to contacts with linkedInProfileUrl
      const existing = (body['contacts[]'] as any[]) ?? [];
      body['contacts[]'] = [
        ...existing,
        ...input.linkedInUrls.map((url: string) => ({ linkedInProfileUrl: url })),
      ];
    }

    if (input.isJobChange) {
      body.isJobChange = true;
    }

    if (!body['searchResultIds[]'] && !body['contacts[]']) {
      throw new Error(
        'Provide --search-result-ids, --contacts, or --linkedin-urls to research',
      );
    }

    return client.post('/contacts/research', body);
  },
};
