# AI Agent Guide — Seamless.ai CLI

> This file helps AI agents (Claude, GPT, Cursor, Roz, and others) install, authenticate, and use the Seamless.ai CLI to search contacts and companies, run research/enrichment, and retrieve org data.

---

## Quick Start

```bash
# Install globally
npm install -g seamless-ai-cli

# Set API key — no interactive prompts needed
export SEAMLESS_API_KEY="your-api-key-here"

# Verify
seamless status

# Search contacts
seamless contacts search --seniority "VP" --industry "SaaS" --limit 10
```

**Requirements:** Node.js 18+

---

## Authentication

**Always use environment variables** — never interactive prompts:

```bash
export SEAMLESS_API_KEY="your-api-key-here"
```

Or pass per-command:

```bash
seamless contacts list --api-key "your-api-key-here"
```

API key: Settings → API Key in the Seamless.ai dashboard.

---

## Output Format

All commands output **JSON to stdout** — structured and ready to parse:

```bash
# Default: compact JSON
seamless contacts search --company-name "Stripe"
# → {"data":[{"searchResultId":"abc123","name":"John Doe","company":"Stripe","title":"VP Engineering",...}],"supplementalData":{"isMore":true,"total":143,"perPage":25,"nextToken":"..."}}

# Pretty-printed
seamless contacts search --company-name "Stripe" --pretty

# Select specific fields (dot notation supported)
seamless contacts list --fields "firstName,lastName,email,contactLocation.city"

# Exit code only, no output
seamless contacts list --quiet
```

**Exit codes:** `0` = success, `1` = error.

**Errors go to stderr as JSON:**
```json
{"error":"No API key found. Set SEAMLESS_API_KEY or run: seamless login","code":"AUTH_ERROR"}
```

---

## Discovering Commands

```bash
seamless --help
seamless contacts --help
seamless companies --help
seamless oauth --help
seamless contacts search --help   # shows all options + examples
```

---

## All Commands

### contacts search

Search 1.9B+ contacts. All array options accept comma-separated values.

```bash
# Basic filters
seamless contacts search --company-name "Stripe"
seamless contacts search --seniority "VP,Director" --industry "SaaS,Fintech"
seamless contacts search --company-domain "stripe.com" --department "Engineering"
seamless contacts search --technologies "HubSpot" --company-size "51-200" --limit 50

# Name search types (important for disambiguation)
seamless contacts search --company-name "Apple" --company-name-search-type exact
seamless contacts search --company-name "Sales" --company-name-search-type related

# Location — contact vs company location
seamless contacts search --contact-state "CA,NY" --location-type contact
seamless contacts search --contact-zip-code "94103,94107" --location-type contact
seamless contacts search --contact-state "CA" --location-type bothAND  # contact in CA AND company in CA

# People filters
seamless contacts search --full-name "John Smith"
seamless contacts search --contact-keyword "RevOps,Revenue Operations"
seamless contacts search --job-title "Head of Growth,VP Marketing"

# Technology matching — OR (any) vs AND (all must be used)
seamless contacts search --technologies "Salesforce,HubSpot" --technologies-is-or   # uses any
seamless contacts search --technologies "Salesforce,HubSpot"                         # uses all (default)

# Company characteristics
seamless contacts search --company-founded-on "2015-2020" --company-revenue "1M-10M"
seamless contacts search --company-size "201-500" --industry "Fintech"

# Date filters
seamless contacts search --last-modified-after "2024-01-01" --seniority "C-Suite"

# Pagination
seamless contacts search --seniority "VP" --limit 50
seamless contacts search --seniority "VP" --limit 50 --next-token "<token-from-supplementalData.nextToken>"
```

**All options:**

| Option | Description | Limit |
|--------|-------------|-------|
| `--company-name <names>` | Company name(s) | max 100 |
| `--company-name-search-type <type>` | `default` \| `related` \| `exact` | — |
| `--company-domain <domains>` | Domain(s) e.g. `stripe.com` | max 100 |
| `--contact-state <states>` | US state abbreviations | max 10 |
| `--contact-country <countries>` | Country names | max 10 |
| `--contact-zip-code <zips>` | Postal codes | max 10 |
| `--location-type <type>` | `bothOR` \| `bothAND` \| `company` \| `contact` | — |
| `--full-name <names>` | Contact full name(s) | max 10 |
| `--job-title <titles>` | Job title(s) | max 10 |
| `--department <depts>` | Department(s) | max 5 |
| `--seniority <levels>` | Seniority level(s) | max 5 |
| `--contact-keyword <keywords>` | Contact keyword(s) | max 10 |
| `--industry <industries>` | Industry/industries | max 5 |
| `--company-founded-on <ranges>` | Founded year/range(s) | max 4 |
| `--company-size <ranges>` | Employee count range(s) | max 10 |
| `--company-revenue <ranges>` | Revenue range(s) | max 10 |
| `--technologies <techs>` | Technologies used | max 10 |
| `--technologies-is-or` | Match ANY tech (OR). Default: ALL (AND) | — |
| `--last-modified-after <date>` | ISO8601 date | — |
| `--last-modified-before <date>` | ISO8601 date | — |
| `-l, --limit <n>` | Per page (1-100, default 25) | — |
| `--next-token <token>` | Pagination token | — |

**Response:**
```json
{
  "data": [
    { "searchResultId": "abc123", "name": "John Doe", "company": "Stripe", "title": "VP Engineering", "location": "San Francisco, CA" }
  ],
  "supplementalData": { "isMore": true, "total": 143, "perPage": 25, "nextToken": "eyJ..." }
}
```

---

### contacts research

Submit contacts for deep enrichment. Returns `requestIds` — poll with `contacts poll`.

```bash
# From search result IDs (most common)
seamless contacts research --search-result-ids "abc123,def456"

# From name:company pairs
seamless contacts research --contacts "John Smith:Stripe,Jane Doe:Shopify"

# From LinkedIn URLs
seamless contacts research --linkedin-urls "https://linkedin.com/in/johndoe"

# Job-change flag
seamless contacts research --search-result-ids "abc123" --is-job-change
```

**Response:** `{ "requestIds": ["req_xyz789"] }`

---

### contacts poll

Poll enrichment status. Use `--wait` for blocking mode (recommended for agents).

```bash
seamless contacts poll --request-ids "req_xyz789"
seamless contacts poll --request-ids "req_xyz789" --wait
seamless contacts poll --request-ids "req_xyz789" --wait --poll-interval 3 --max-attempts 40
```

Progress writes to **stderr** (not stdout) — JSON output remains clean.

**Response when complete:**
```json
{
  "success": true,
  "data": [{
    "status": "complete",
    "contact": {
      "firstName": "John", "lastName": "Doe",
      "email": "john.doe@stripe.com", "phone": "+1-555-0100",
      "personalEmail": "johndoe@gmail.com",
      "lIProfileUrl": "https://linkedin.com/in/johndoe",
      "contactLocation": { "city": "San Francisco", "state": "CA", "country": "US" },
      "jobHistory": [{ "company": "Stripe", "title": "VP Engineering", "startDate": "2021-01" }]
    }
  }]
}
```

---

### contacts list

List researched contacts in your org.

```bash
seamless contacts list
seamless contacts list --limit 200 --page 2
seamless contacts list --start-date 2024-01-01 --end-date 2024-12-31
seamless contacts list --fields "firstName,lastName,email,phone"
```

---

### companies search

Search 121M+ companies. All array options accept comma-separated values.

```bash
seamless companies search --industry "SaaS" --company-size "51-200"
seamless companies search --company-name "Apple" --company-name-search-type exact
seamless companies search --company-domain "stripe.com,shopify.com"
seamless companies search --technologies "Salesforce" --technologies-is-or
seamless companies search --company-revenue "10M-50M" --company-country "US"
seamless companies search --founded-on "2010-2020" --company-state "CA,NY"
seamless companies search --company-zip-code "94103"
seamless companies search --company-keyword "Series B,enterprise SaaS"
```

**All options:**

| Option | Description | Limit |
|--------|-------------|-------|
| `--company-name <names>` | Company name(s) | max 100 |
| `--company-name-search-type <type>` | `default` \| `related` \| `exact` | — |
| `--company-domain <domains>` | Domain(s) | max 100 |
| `--company-state <states>` | US state(s) | max 10 |
| `--company-country <countries>` | Country/countries | max 10 |
| `--company-zip-code <zips>` | Zip/postal code(s) | max 10 |
| `--industry <industries>` | Industry/industries | max 5 |
| `--company-keyword <keywords>` | Company keyword(s) | max 10 |
| `--company-size <ranges>` | Employee count range(s) | max 10 |
| `--company-revenue <ranges>` | Revenue range(s) | max 10 |
| `--founded-on <years>` | Founded year/range(s) | max 4 |
| `--technologies <techs>` | Technologies used | max 10 |
| `--technologies-is-or` | Match ANY tech (OR). Default: ALL (AND) | — |
| `-l, --limit <n>` | Per page (1-100, default 25) | — |
| `--next-token <token>` | Pagination token | — |

---

### companies research

Submit companies for enrichment.

```bash
seamless companies research --search-result-ids "abc123,def456"
seamless companies research --domains "stripe.com,shopify.com"
seamless companies research --company-names "Stripe,Shopify"
```

---

### companies poll

```bash
seamless companies poll --request-ids "req_abc123" --wait
seamless companies poll --request-ids "req_abc123,req_def456" --pretty
```

---

### companies list

```bash
seamless companies list
seamless companies list --limit 200 --start-date 2024-06-01
seamless companies list --fields "name,domain,staffCount,annualRevenue"
```

---

### oauth exchange

Exchange an OAuth authorization code for tokens (for app developers using OAuth 2.0).

```bash
seamless oauth exchange \
  --client-id "your-client-id" \
  --client-secret "your-client-secret" \
  --redirect-uri "https://myapp.com/callback" \
  --code "auth_code_from_callback"
```

**Response:** `{ "access_token": "...", "refresh_token": "...", "expires_at": 1712000000 }`

---

### oauth refresh

Refresh an expired access token.

```bash
seamless oauth refresh \
  --client-id "your-client-id" \
  --client-secret "your-client-secret" \
  --redirect-uri "https://myapp.com/callback" \
  --refresh-token "your-refresh-token"
```

---

## Research Workflow (Recommended Pattern for Agents)

```bash
# 1. Search for contacts matching ICP
SEARCH=$(seamless contacts search --seniority "VP" --industry "SaaS" --limit 10)
IDS=$(echo $SEARCH | jq -r '.data[].searchResultId' | tr '\n' ',' | sed 's/,$//')

# 2. Submit for enrichment
RESEARCH=$(seamless contacts research --search-result-ids "$IDS")
REQUEST_IDS=$(echo $RESEARCH | jq -r '.requestIds[]' | tr '\n' ',' | sed 's/,$//')

# 3. Block until complete
seamless contacts poll --request-ids "$REQUEST_IDS" --wait --pretty
```

---

## Pagination Pattern

**Search** uses `nextToken`:
```bash
RESULT=$(seamless contacts search --seniority "VP" --limit 50)
TOKEN=$(echo $RESULT | jq -r '.supplementalData.nextToken')
# If .supplementalData.isMore == true:
seamless contacts search --seniority "VP" --limit 50 --next-token "$TOKEN"
```

**Org list** uses `--page`:
```bash
seamless contacts list --page 1 --limit 500
seamless contacts list --page 2 --limit 500
```

---

## MCP Server

```bash
SEAMLESS_API_KEY="your-key" seamless mcp
```

**Claude Desktop / Claude Code config:**
```json
{
  "mcpServers": {
    "seamless": {
      "command": "seamless",
      "args": ["mcp"],
      "env": { "SEAMLESS_API_KEY": "your-api-key-here" }
    }
  }
}
```

**Available MCP tools (10 total):**

| Tool | Description |
|------|-------------|
| `contacts_search` | Search contacts — all filters including `locationType`, `technologiesIsOr`, `companyNameSearchType` |
| `contacts_research` | Submit contacts for enrichment |
| `contacts_poll` | Poll contact research (supports `wait: true`) |
| `contacts_list` | List org contacts with date filters |
| `companies_search` | Search companies — all filters including `companyKeyword`, `technologiesIsOr` |
| `companies_research` | Submit companies for enrichment |
| `companies_poll` | Poll company research (supports `wait: true`) |
| `companies_list` | List org companies with date filters |
| `oauth_exchange` | Exchange OAuth authorization code for tokens |
| `oauth_refresh` | Refresh an expired OAuth access token |

---

## Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| `AUTH_ERROR` | Invalid or missing API key | Set `SEAMLESS_API_KEY` or run `seamless login` |
| `INSUFFICIENT_CREDITS` | No Seamless.ai credits remaining | Add credits in account settings |
| `RATE_LIMIT` | ~100 req/60s exceeded | Auto-retried up to 3x with backoff |
| `VALIDATION_ERROR` | Bad request parameters | Check `--help` for correct options |
| `NOT_FOUND` | Resource not found | Verify IDs are correct |
| `TIMEOUT` | Request timed out | Retry — transient network issue |
| `NETWORK_ERROR` | Cannot reach API | Check connectivity |

---

## Key Behaviors for Agents

1. **JSON to stdout by default** — parse directly, no stripping needed
2. **Errors on stderr** — stdout is always valid JSON on success
3. **`--wait` on poll** — blocks until research done; progress written to stderr only
4. **`--quiet`** — exit code only, no stdout (fire-and-forget use case)
5. **Rate limit auto-retry** — 429s retried automatically with exponential backoff
6. **Comma-separated for all array inputs** — `"VP,Director"` works everywhere
7. **`searchResultId` required for research** — always search first to get these IDs
8. **`--technologies-is-or`** — critical for ICP fit: OR = broader net, AND (default) = tighter match
9. **`--location-type`** — use `contact` to filter by where the person lives, `company` for HQ location, `bothAND` for both
10. **`--company-name-search-type exact`** — essential when searching brand names that could be ambiguous
