export { companiesSearchCommand } from './search.js';
export { companiesResearchCommand } from './research.js';
export { companiesPollCommand } from './poll.js';
export { companiesListCommand } from './list.js';

import { companiesSearchCommand } from './search.js';
import { companiesResearchCommand } from './research.js';
import { companiesPollCommand } from './poll.js';
import { companiesListCommand } from './list.js';
import type { CommandDefinition } from '../../core/types.js';

export const allCompaniesCommands: CommandDefinition[] = [
  companiesSearchCommand,
  companiesResearchCommand,
  companiesPollCommand,
  companiesListCommand,
];
