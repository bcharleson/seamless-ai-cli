import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

// OAuth token exchange uses a different base path — handled directly in handler
const OAUTH_PATH = '/api/client/v1/oauth/accessToken';

export const oauthExchangeCommand: CommandDefinition = {
  name: 'oauth_exchange',
  group: 'oauth',
  subcommand: 'exchange',
  description:
    'Exchange an OAuth 2.0 authorization code for an access token and refresh token (authorization_code grant)',
  examples: [
    'seamless oauth exchange --client-id "xxx" --client-secret "yyy" --redirect-uri "https://myapp.com/callback" --code "auth_code_here"',
  ],
  inputSchema: z.object({
    clientId: z.string(),
    clientSecret: z.string(),
    redirectUri: z.string(),
    code: z.string(),
  }),
  cliMappings: {
    options: [
      { field: 'clientId', flags: '--client-id <id>', description: 'OAuth client ID (required)' },
      { field: 'clientSecret', flags: '--client-secret <secret>', description: 'OAuth client secret (required)' },
      { field: 'redirectUri', flags: '--redirect-uri <uri>', description: 'OAuth redirect URI (required)' },
      { field: 'code', flags: '--code <code>', description: 'Authorization code from OAuth callback (required)' },
    ],
  },
  endpoint: { method: 'POST', path: OAUTH_PATH },
  fieldMappings: {
    clientId: 'body',
    clientSecret: 'body',
    redirectUri: 'body',
    code: 'body',
  },
  handler: async (input, client) => {
    return client.post(OAUTH_PATH, {
      client_id: input.clientId,
      client_secret: input.clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: 'authorization_code',
      code: input.code,
    });
  },
};
