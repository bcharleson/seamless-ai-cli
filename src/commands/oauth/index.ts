export { oauthExchangeCommand } from './exchange.js';
export { oauthRefreshCommand } from './refresh.js';

import { oauthExchangeCommand } from './exchange.js';
import { oauthRefreshCommand } from './refresh.js';
import type { CommandDefinition } from '../../core/types.js';

export const allOauthCommands: CommandDefinition[] = [
  oauthExchangeCommand,
  oauthRefreshCommand,
];
