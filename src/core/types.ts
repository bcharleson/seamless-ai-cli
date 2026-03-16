import { z } from 'zod';

export interface CliMapping {
  args?: Array<{
    field: string;
    name: string;
    required?: boolean;
  }>;
  options?: Array<{
    field: string;
    flags: string;
    description?: string;
  }>;
}

export interface CommandDefinition<TInput extends z.ZodObject<any> = z.ZodObject<any>> {
  /** Unique identifier — used as the MCP tool name. e.g., "contacts_search" */
  name: string;

  /** CLI group. e.g., "contacts" */
  group: string;

  /** CLI subcommand name. e.g., "search" */
  subcommand: string;

  /** Human-readable description (used in --help AND MCP tool description) */
  description: string;

  /** Detailed examples for --help output */
  examples?: string[];

  /** Zod schema defining all inputs */
  inputSchema: TInput;

  /** Maps Zod fields to CLI constructs (args and options) */
  cliMappings: CliMapping;

  /** HTTP method and path template */
  endpoint: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
    path: string;
  };

  /** Where each input field goes in the HTTP request */
  fieldMappings: Record<string, 'path' | 'query' | 'body'>;

  /** Whether this is a paginated list endpoint */
  paginated?: boolean;

  /** The handler function */
  handler: (input: z.infer<TInput>, client: SeamlessClient) => Promise<unknown>;
}

export interface SeamlessClient {
  request<T>(options: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
    path: string;
    query?: Record<string, string | number | boolean | string[] | undefined>;
    body?: unknown;
  }): Promise<T>;

  get<T>(path: string, query?: Record<string, any>): Promise<T>;
  post<T>(path: string, body?: unknown, query?: Record<string, any>): Promise<T>;
}

// ─── Seamless.ai API Response Types ──────────────────────────────────────────

export interface SeamlessSupplementalData {
  isMore: boolean;
  total: number;
  perPage: number;
  nextToken?: string;
}

export interface SeamlessSearchResponse<T> {
  data: T[];
  supplementalData: SeamlessSupplementalData;
}

export interface SeamlessContactSearchResult {
  searchResultId: string;
  name?: string;
  company?: string;
  title?: string;
  location?: string;
}

export interface SeamlessCompanySearchResult {
  searchResultId: string;
  name?: string;
  domain?: string;
  location?: string;
  industries?: string[];
  revenue?: string;
}

export interface SeamlessContact {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  personalEmail?: string;
  phone?: string;
  company?: string;
  title?: string;
  contactLocation?: SeamlessContactLocation;
  companyLocation?: SeamlessCompanyLocation;
  lIProfileUrl?: string;
  jobHistory?: SeamlessJobHistory[];
}

export interface SeamlessContactLocation {
  city?: string;
  state?: string;
  postCode?: string;
  country?: string;
  timezone?: string;
}

export interface SeamlessCompanyLocation {
  street1?: string;
  street2?: string;
  street3?: string;
  city?: string;
  state?: string;
  postCode?: string;
  country?: string;
}

export interface SeamlessJobHistory {
  company?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
}

export interface SeamlessCompany {
  name?: string;
  domain?: string;
  location?: SeamlessCompanyLocation;
  industries?: string[];
  staffCount?: number;
  annualRevenue?: string;
  linkedInProfileUrl?: string;
  sicCode?: string;
  foundedOn?: string;
  technologies?: string[];
}

export interface SeamlessResearchResponse {
  requestIds: string[];
}

export interface SeamlessResearchPollResult {
  status: 'pending' | 'complete' | 'error';
  contact?: SeamlessContact;
  contacts?: SeamlessContact[];
  company?: SeamlessCompany;
  companies?: SeamlessCompany[];
  [key: string]: unknown;
}

export interface SeamlessResearchPollResponse {
  success: boolean;
  data: SeamlessResearchPollResult[];
}

export interface SeamlessConfig {
  api_key: string;
}

export interface GlobalOptions {
  apiKey?: string;
  output?: 'json' | 'pretty';
  quiet?: boolean;
  fields?: string;
  pretty?: boolean;
}
