import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { expandState } from '../../core/states.js';

const csvToArray = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined));

export const companiesSearchCommand: CommandDefinition = {
  name: 'companies_search',
  group: 'companies',
  subcommand: 'search',
  description:
    'Search Seamless.ai for companies using filters (name, domain, location, industry, size, revenue, technologies, keywords, and more)',
  examples: [
    'seamless companies search --company-name "Stripe"',
    'seamless companies search --company-name "Apple" --company-name-search-type exact',
    'seamless companies search --industry "SaaS,Fintech" --company-size "51-200"',
    'seamless companies search --company-domain "stripe.com,shopify.com"',
    'seamless companies search --company-country "US" --company-revenue "10M-50M" --limit 50',
    'seamless companies search --technologies "Salesforce,HubSpot" --technologies-is-or',
    'seamless companies search --company-state "CA,NY" --founded-on "2010-2020"',
    'seamless companies search --company-zip-code "94103,10001"',
    'seamless companies search --company-keyword "Series B,enterprise"',
  ],
  inputSchema: z.object({
    // Pagination
    limit: z.coerce.number().min(1).max(100).default(25).optional(),
    nextToken: z.string().optional(),

    // Company name
    companyName: csvToArray,
    companyNameSearchType: z.enum(['default', 'related', 'exact']).optional(),
    companyDomain: csvToArray,

    // Location
    companyState: csvToArray,
    companyCountry: csvToArray,
    companyZipCode: csvToArray,

    // Characteristics
    industry: csvToArray,
    companyKeyword: csvToArray,
    companySize: csvToArray,
    companyRevenue: csvToArray,
    foundedOn: csvToArray,

    // Technologies
    technologies: csvToArray,
    technologiesIsOr: z.boolean().optional(),
  }),
  cliMappings: {
    options: [
      // Pagination
      { field: 'limit', flags: '-l, --limit <n>', description: 'Results per page (1-100, default 25)' },
      { field: 'nextToken', flags: '--next-token <token>', description: 'Pagination token from previous search' },

      // Company name
      { field: 'companyName', flags: '--company-name <names>', description: 'Company name(s), comma-separated [max 100]' },
      { field: 'companyNameSearchType', flags: '--company-name-search-type <type>', description: 'Name match mode: default | related | exact' },
      { field: 'companyDomain', flags: '--company-domain <domains>', description: 'Domain(s), comma-separated (e.g. stripe.com) [max 100]' },

      // Location
      { field: 'companyState', flags: '--company-state <states>', description: 'US state(s), full name comma-separated (e.g. Nevada,Texas — NOT NV,TX) [max 10]' },
      { field: 'companyCountry', flags: '--company-country <countries>', description: 'Country/countries, comma-separated [max 10]' },
      { field: 'companyZipCode', flags: '--company-zip-code <zips>', description: 'Company zip/postal code(s), comma-separated [max 10]' },

      // Characteristics
      { field: 'industry', flags: '--industry <industries>', description: 'Industry/industries, comma-separated [max 5]' },
      { field: 'companyKeyword', flags: '--company-keyword <keywords>', description: 'Company keyword(s), comma-separated [max 10]' },
      { field: 'companySize', flags: '--company-size <sizes>', description: 'Employee count range(s), comma-separated (e.g. 51-200,201-500) [max 10]' },
      { field: 'companyRevenue', flags: '--company-revenue <ranges>', description: 'Annual revenue range(s), comma-separated [max 10]' },
      { field: 'foundedOn', flags: '--founded-on <years>', description: 'Founded year or range(s), comma-separated [max 4]' },

      // Technologies
      { field: 'technologies', flags: '--technologies <techs>', description: 'Technology/technologies used, comma-separated [max 10]' },
      { field: 'technologiesIsOr', flags: '--technologies-is-or', description: 'Match companies using ANY tech listed (OR). Default: must use ALL (AND)' },
    ],
  },
  endpoint: { method: 'POST', path: '/search/companies' },
  fieldMappings: {
    companyName: 'body', companyNameSearchType: 'body', companyDomain: 'body',
    companyState: 'body', companyCountry: 'body', companyZipCode: 'body',
    industry: 'body', companyKeyword: 'body', companySize: 'body', companyRevenue: 'body', foundedOn: 'body',
    technologies: 'body', technologiesIsOr: 'body',
    limit: 'body', nextToken: 'body',
  },
  handler: async (input, client) => {
    const body: Record<string, unknown> = {};

    // Arrays — plain JSON keys (no brackets), API accepts array values directly
    if (input.companyName?.length) body.companyName = input.companyName;
    if (input.companyDomain?.length) body.companyDomain = input.companyDomain;
    if (input.companyState?.length) body.companyState = input.companyState.map(expandState);
    if (input.companyCountry?.length) body.companyCountry = input.companyCountry;
    if (input.companyZipCode?.length) body.companyZipCode = input.companyZipCode;
    if (input.industry?.length) body.industry = input.industry;
    if (input.companyKeyword?.length) body.companyKeyword = input.companyKeyword;
    if (input.companySize?.length) body.companySize = input.companySize;
    if (input.companyRevenue?.length) body.companyRevenue = input.companyRevenue;
    if (input.foundedOn?.length) body.foundedOn = input.foundedOn;
    if (input.technologies?.length) body.technologies = input.technologies;

    // Scalars
    if (input.companyNameSearchType) body.companyNameSearchType = input.companyNameSearchType;
    if (input.technologiesIsOr !== undefined) body.technologiesIsOr = input.technologiesIsOr;
    if (input.limit !== undefined) body.limit = input.limit;
    if (input.nextToken) body.nextToken = input.nextToken;

    return client.post('/search/companies', body);
  },
};
