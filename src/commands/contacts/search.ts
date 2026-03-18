import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

// Comma-separated string → string array (used throughout search filters)
const csvToArray = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined));

export const contactsSearchCommand: CommandDefinition = {
  name: 'contacts_search',
  group: 'contacts',
  subcommand: 'search',
  description:
    'Search Seamless.ai for contacts using filters (name, company, title, department, location, seniority, industry, technologies, keywords, and more)',
  examples: [
    'seamless contacts search --job-title "VP of Sales" --company-name "Acme Corp"',
    'seamless contacts search --department "Engineering" --seniority "Director,VP" --limit 25',
    'seamless contacts search --company-domain "stripe.com" --pretty',
    'seamless contacts search --industry "SaaS,Fintech" --company-size "51-200,201-500"',
    'seamless contacts search --company-name "Apple" --company-name-search-type exact',
    'seamless contacts search --technologies "Salesforce,HubSpot" --technologies-is-or',
    'seamless contacts search --full-name "John Smith" --contact-keyword "VP Sales"',
    'seamless contacts search --contact-zip-code "94103,10001" --location-type contact',
    'seamless contacts search --contact-state "CA" --location-type bothAND --company-size "201-500"',
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
    contactState: csvToArray,
    contactCountry: csvToArray,
    contactZipCode: csvToArray,
    locationType: z.enum(['bothOR', 'bothAND', 'company', 'contact']).optional(),

    // Professional
    fullName: csvToArray,
    jobTitle: csvToArray,
    department: csvToArray,
    seniority: csvToArray,
    contactKeyword: csvToArray,

    // Company characteristics
    industry: csvToArray,
    companyFoundedOn: csvToArray,
    companySize: csvToArray,
    companyRevenue: csvToArray,

    // Technologies
    technologies: csvToArray,
    technologiesIsOr: z.boolean().optional(),

    // Date filters
    lastModifiedAfter: z.string().optional(),
    lastModifiedBefore: z.string().optional(),
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
      { field: 'contactState', flags: '--contact-state <states>', description: 'Contact US state(s), full name comma-separated (e.g. Nevada,Texas — NOT NV,TX) [max 10]' },
      { field: 'contactCountry', flags: '--contact-country <countries>', description: 'Contact country/countries, comma-separated [max 10]' },
      { field: 'contactZipCode', flags: '--contact-zip-code <zips>', description: 'Contact zip/postal code(s), comma-separated [max 10]' },
      { field: 'locationType', flags: '--location-type <type>', description: 'Location match scope: bothOR | bothAND | company | contact' },

      // Professional
      { field: 'fullName', flags: '--full-name <names>', description: 'Full name(s) to search, comma-separated [max 10]' },
      { field: 'jobTitle', flags: '--job-title <titles>', description: 'Job title(s), comma-separated [max 10]' },
      { field: 'department', flags: '--department <depts>', description: 'Department(s), comma-separated (e.g. Engineering,Sales) [max 5]' },
      { field: 'seniority', flags: '--seniority <levels>', description: 'Seniority level(s), comma-separated (e.g. Director,VP,C-Suite) [max 5]' },
      { field: 'contactKeyword', flags: '--contact-keyword <keywords>', description: 'Contact keyword(s), comma-separated [max 10]' },

      // Company characteristics
      { field: 'industry', flags: '--industry <industries>', description: 'Industry/industries, comma-separated [max 5]' },
      { field: 'companyFoundedOn', flags: '--company-founded-on <ranges>', description: 'Company founded year/range(s), comma-separated [max 4]' },
      { field: 'companySize', flags: '--company-size <sizes>', description: 'Employee range(s), comma-separated (e.g. 51-200,201-500) [max 10]' },
      { field: 'companyRevenue', flags: '--company-revenue <ranges>', description: 'Revenue range(s), comma-separated [max 10]' },

      // Technologies
      { field: 'technologies', flags: '--technologies <techs>', description: 'Technology/technologies used, comma-separated [max 10]' },
      { field: 'technologiesIsOr', flags: '--technologies-is-or', description: 'Match contacts using ANY tech listed (OR). Default: must use ALL (AND)' },

      // Dates
      { field: 'lastModifiedAfter', flags: '--last-modified-after <date>', description: 'Filter contacts modified after date (ISO8601)' },
      { field: 'lastModifiedBefore', flags: '--last-modified-before <date>', description: 'Filter contacts modified before date (ISO8601)' },
    ],
  },
  endpoint: { method: 'POST', path: '/search/contacts' },
  fieldMappings: {
    companyName: 'body', companyNameSearchType: 'body', companyDomain: 'body',
    contactState: 'body', contactCountry: 'body', contactZipCode: 'body', locationType: 'body',
    fullName: 'body', jobTitle: 'body', department: 'body', seniority: 'body', contactKeyword: 'body',
    industry: 'body', companyFoundedOn: 'body', companySize: 'body', companyRevenue: 'body',
    technologies: 'body', technologiesIsOr: 'body',
    lastModifiedAfter: 'body', lastModifiedBefore: 'body',
    limit: 'body', nextToken: 'body',
  },
  handler: async (input, client) => {
    const body: Record<string, unknown> = {};

    // Arrays
    if (input.companyName?.length) body['companyName[]'] = input.companyName;
    if (input.companyDomain?.length) body['companyDomain[]'] = input.companyDomain;
    if (input.contactState?.length) body['contactState[]'] = input.contactState;
    if (input.contactCountry?.length) body['contactCountry[]'] = input.contactCountry;
    if (input.contactZipCode?.length) body['contactZipCode[]'] = input.contactZipCode;
    if (input.fullName?.length) body['fullName[]'] = input.fullName;
    if (input.jobTitle?.length) body['jobTitle[]'] = input.jobTitle;
    if (input.department?.length) body['department[]'] = input.department;
    if (input.seniority?.length) body['seniority[]'] = input.seniority;
    if (input.contactKeyword?.length) body['contactKeyword[]'] = input.contactKeyword;
    if (input.industry?.length) body['industry[]'] = input.industry;
    if (input.companyFoundedOn?.length) body['companyFoundedOn[]'] = input.companyFoundedOn;
    if (input.companySize?.length) body['companySize[]'] = input.companySize;
    if (input.companyRevenue?.length) body['companyRevenue[]'] = input.companyRevenue;
    if (input.technologies?.length) body['technologies[]'] = input.technologies;

    // Scalars
    if (input.companyNameSearchType) body.companyNameSearchType = input.companyNameSearchType;
    if (input.locationType) body.locationType = input.locationType;
    if (input.technologiesIsOr !== undefined) body.technologiesIsOr = input.technologiesIsOr;
    if (input.lastModifiedAfter) body.lastModifiedAfter = input.lastModifiedAfter;
    if (input.lastModifiedBefore) body.lastModifiedBefore = input.lastModifiedBefore;
    if (input.limit !== undefined) body.limit = input.limit;
    if (input.nextToken) body.nextToken = input.nextToken;

    return client.post('/search/contacts', body);
  },
};
