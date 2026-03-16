export { contactsSearchCommand } from './search.js';
export { contactsResearchCommand } from './research.js';
export { contactsPollCommand } from './poll.js';
export { contactsListCommand } from './list.js';

import { contactsSearchCommand } from './search.js';
import { contactsResearchCommand } from './research.js';
import { contactsPollCommand } from './poll.js';
import { contactsListCommand } from './list.js';
import type { CommandDefinition } from '../../core/types.js';

export const allContactsCommands: CommandDefinition[] = [
  contactsSearchCommand,
  contactsResearchCommand,
  contactsPollCommand,
  contactsListCommand,
];
