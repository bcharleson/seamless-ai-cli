# seamless-ai-cli

**JSON-first, agent-native CLI and MCP server for the [Seamless.ai](https://seamless.ai) B2B prospecting platform.**

Search 1.9B+ contacts and 121M+ companies, run AI research/enrichment, and retrieve your org's data — all from the terminal or via any MCP-compatible AI agent.

---

## Installation

```bash
npm install -g seamless-ai-cli
```

**Requirements:** Node.js 18+

---

## Authentication

Get your API key from: **Settings → API Key** in your Seamless.ai account.

### Option 1 — Environment variable (recommended for agents)
```bash
export SEAMLESS_API_KEY="your-api-key-here"
```

### Option 2 — Login command (saves to `~/.seamless-cli/config.json`)
```bash
seamless login
# or non-interactively:
seamless login --api-key "your-api-key-here"
```

### Option 3 — Per-command flag
```bash
seamless contacts list --api-key "your-api-key-here"
```

**Priority order:** `--api-key` flag > `SEAMLESS_API_KEY` env > `~/.seamless-cli/config.json`

---

## Quick Start

```bash
# Search for contacts at a specific company
seamless contacts search --company-name "Stripe" --department "Engineering"

# Search for VP-level contacts in SaaS
seamless contacts search --seniority "VP" --industry "SaaS" --limit 25

# Research a contact from search results (returns requestId)
seamless contacts research --search-result-ids "abc123,def456"

# Poll research results (auto-wait until complete)
seamless contacts poll --request-ids "req_abc123" --wait

# List your org's saved contacts
seamless contacts list --limit 100

# Search companies in fintech with 50-200 employees
seamless companies search --industry "Fintech" --company-size "51-200"

# Research companies by domain
seamless companies research --domains "stripe.com,shopify.com"

# Get pretty-printed output
seamless contacts search --company-domain "stripe.com" --pretty
```

---

## Output Format

All commands output **compact JSON to stdout** by default — ideal for piping and agent consumption.

```bash
# Default: compact JSON
seamless contacts list
# → {"data":[{"firstName":"John","lastName":"Doe","email":"john@stripe.com",...}],...}

# Pretty-printed
seamless contacts list --pretty

# Select specific fields (supports dot notation)
seamless contacts list --fields "firstName,lastName,email,contactLocation.city"

# Suppress output (exit code only — 0 = success, 1 = error)
seamless contacts list --quiet
```

**Errors go to stderr:**
```json
{"error":"No API key found. Set SEAMLESS_API_KEY or run: seamless login","code":"AUTH_ERROR"}
```

---

## Commands

### Auth

| Command | Description |
|---------|-------------|
| `seamless login` | Authenticate and save API key |
| `seamless logout` | Remove stored credentials |
| `seamless status` | Show current authentication status |

---

### contacts search

Search Seamless.ai's 1.9B+ contact database with powerful filters.

```bash
seamless contacts search [options]
```

| Option | Description |
|--------|-------------|
| `--company-name <names>` | Company name(s), comma-separated |
| `--company-domain <domains>` | Domain(s), e.g. `stripe.com,shopify.com` |
| `--job-title <titles>` | Job title(s), comma-separated |
| `--department <depts>` | Department(s): Engineering, Sales, Marketing, etc. |
| `--seniority <levels>` | Seniority: Director, VP, C-Suite, Manager, etc. |
| `--industry <industries>` | Industry/industries, comma-separated |
| `--contact-state <states>` | US state(s): CA, TX, NY, etc. |
| `--contact-country <countries>` | Country/countries, comma-separated |
| `--company-size <ranges>` | Employee ranges: `51-200`, `201-500`, `501-1000` |
| `--company-revenue <ranges>` | Revenue ranges, comma-separated |
| `--technologies <techs>` | Technologies used: Salesforce, HubSpot, etc. |
| `--last-modified-after <date>` | ISO8601 date filter |
| `--last-modified-before <date>` | ISO8601 date filter |
| `-l, --limit <n>` | Results per page (1-100, default 25) |
| `--next-token <token>` | Pagination token from previous search |

**Examples:**
```bash
seamless contacts search --seniority "VP,Director" --industry "SaaS"
seamless contacts search --company-domain "stripe.com" --department "Engineering"
seamless contacts search --technologies "HubSpot" --company-size "51-200,201-500" --limit 50
```

**Response includes:** `data[]` with `searchResultId`, `name`, `company`, `title`, `location` — plus `supplementalData.nextToken` for pagination.

---

### contacts research

Submit contacts for deep AI enrichment. Returns `requestIds` — poll with `contacts poll`.

```bash
seamless contacts research [options]
```

| Option | Description |
|--------|-------------|
| `--search-result-ids <ids>` | Comma-separated `searchResultId`s from `contacts search` |
| `--contacts <pairs>` | `"Name:Company"` pairs, comma-separated |
| `--linkedin-urls <urls>` | LinkedIn profile URL(s), comma-separated |
| `--is-job-change` | Flag as job-change research |

**Examples:**
```bash
# From search results (most common)
seamless contacts research --search-result-ids "abc123,def456"

# From raw data
seamless contacts research --contacts "John Smith:Stripe,Jane Doe:Shopify"

# From LinkedIn
seamless contacts research --linkedin-urls "https://linkedin.com/in/johndoe"
```

---

### contacts poll

Poll research request status. Use `--wait` to block until complete.

```bash
seamless contacts poll --request-ids <ids> [options]
```

| Option | Description |
|--------|-------------|
| `--request-ids <ids>` | Comma-separated `requestId`s (required) |
| `--wait` | Auto-poll until all requests complete |
| `--poll-interval <s>` | Seconds between polls when `--wait` is set (default 5) |
| `--max-attempts <n>` | Max poll attempts (default 24 ≈ 2 minutes) |

**Researched contact data includes:** `email`, `phone`, `personalEmail`, `contactLocation`, `jobHistory[]`, `lIProfileUrl`, and more.

---

### contacts list

List researched contacts saved to your org.

```bash
seamless contacts list [options]
```

| Option | Description |
|--------|-------------|
| `-p, --page <n>` | Page number (default 1) |
| `-l, --limit <n>` | Results per page (1-500, default 50) |
| `--start-date <date>` | Filter by research date start (ISO8601) |
| `--end-date <date>` | Filter by research date end (ISO8601) |

---

### companies search

Search 121M+ companies with rich filters.

```bash
seamless companies search [options]
```

| Option | Description |
|--------|-------------|
| `--company-name <names>` | Company name(s), comma-separated |
| `--company-domain <domains>` | Domain(s), comma-separated |
| `--company-state <states>` | US state(s), comma-separated |
| `--company-country <countries>` | Country/countries, comma-separated |
| `--industry <industries>` | Industry/industries, comma-separated |
| `--company-size <ranges>` | Employee count ranges |
| `--company-revenue <ranges>` | Annual revenue ranges |
| `--technologies <techs>` | Technologies used |
| `--founded-on <years>` | Founded year(s) or range(s) |
| `-l, --limit <n>` | Results per page (1-100, default 25) |
| `--next-token <token>` | Pagination token from previous search |

---

### companies research

Submit companies for deep AI enrichment. Returns `requestIds`.

```bash
seamless companies research [options]
```

| Option | Description |
|--------|-------------|
| `--search-result-ids <ids>` | `searchResultId`s from `companies search` |
| `--domains <domains>` | Company domain(s), comma-separated |
| `--company-names <names>` | Company name(s), comma-separated |

---

### companies poll

Poll company research status.

```bash
seamless companies poll --request-ids <ids> [options]
```

Same options as `contacts poll`.

---

### companies list

List researched companies saved to your org.

```bash
seamless companies list [options]
```

Same options as `contacts list`.

---

## Pagination

Search results use `nextToken`-based pagination:

```bash
# First page
seamless contacts search --seniority "VP" --limit 50 --pretty
# → supplementalData.nextToken = "eyJwYWdl..."

# Next page
seamless contacts search --seniority "VP" --limit 50 --next-token "eyJwYWdl..."
```

Org list endpoints (`contacts list`, `companies list`) use page-based pagination with `--page`.

---

## Research Workflow

The research flow is asynchronous — submit → poll:

```bash
# 1. Search for contacts
seamless contacts search --company-name "Stripe" --seniority "VP" --pretty
# → Note the searchResultId for each result

# 2. Submit for research (enrichment)
seamless contacts research --search-result-ids "abc123,def456"
# → {"requestIds":["req_xyz789"]}

# 3. Poll until complete (--wait handles the retry loop)
seamless contacts poll --request-ids "req_xyz789" --wait
# → Full contact data with email, phone, job history, etc.
```

---

## MCP Server (AI Agent Integration)

Run as an MCP server for direct AI agent integration:

```bash
# Start MCP server (stdio transport)
seamless mcp

# Or use the direct binary
node /path/to/dist/mcp.js
```

### Claude Desktop / Claude Code config

```json
{
  "mcpServers": {
    "seamless": {
      "command": "seamless",
      "args": ["mcp"],
      "env": {
        "SEAMLESS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `contacts_search` | Search contacts with filters |
| `contacts_research` | Submit contacts for enrichment |
| `contacts_poll` | Poll contact research status |
| `contacts_list` | List org contacts |
| `companies_search` | Search companies with filters |
| `companies_research` | Submit companies for enrichment |
| `companies_poll` | Poll company research status |
| `companies_list` | List org companies |

---

## Rate Limits

Seamless.ai allows approximately **100 requests per 60 seconds** per endpoint. The client automatically:
- Respects `X-RateLimit-Reset` and `Retry-After` headers
- Retries up to 3 times with exponential backoff on 429, 500, 502, 503, 504
- Reports remaining credits via `X-PublicAPI-Credits` header in API responses

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SEAMLESS_API_KEY` | Seamless.ai API key |

---

## License

MIT
