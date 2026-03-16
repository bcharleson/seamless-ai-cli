import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

const OAUTH_PATH = '/api/client/v1/oauth/accessToken';

export const oauthRefreshCommand: CommandDefinition = {
  name: 'oauth_refresh',
  group: 'oauth',
  subcommand: 'refresh',
  description:
    'Refresh an expired OAuth access token using a refresh token (refresh_token grant)',
  examples: [
    'seamless oauth refresh --client-id "xxx" --client-secret "yyy" --redirect-uri "https://myapp.com/callback" --refresh-token "refresh_token_here"',
    'seamless oauth refresh --client-id "xxx" --client-secret "yyy" --redirect-uri "https://myapp.com/callback" --refresh-token "token" --pretty',
  ],
  inputSchema: z.object({
    clientId: z.string(),
    clientSecret: z.string(),
    redirectUri: z.string(),
    refreshToken: z.string(),
  }),
  cliMappings: {
    options: [
      { field: 'clientId', flags: '--client-id <id>', description: 'OAuth client ID (required)' },
      { field: 'clientSecret', flags: '--client-secret <secret>', description: 'OAuth client secret (required)' },
      { field: 'redirectUri', flags: '--redirect-uri <uri>', description: 'OAuth redirect URI (required)' },
      { field: 'refreshToken', flags: '--refresh-token <token>', description: 'Refresh token to exchange (required)' },
    ],
  },
  endpoint: { method: 'POST', path: OAUTH_PATH },
  fieldMappings: {
    clientId: 'body',
    clientSecret: 'body',
    redirectUri: 'body',
    refreshToken: 'body',
  },
  handler: async (input, client) => {
    return client.post(OAUTH_PATH, {
      client_id: input.clientId,
      client_secret: input.clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: 'refresh_token',
      refresh_token: input.refreshToken,
    });
  },
};
