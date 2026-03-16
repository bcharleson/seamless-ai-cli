import { Command } from 'commander';
import { registerAllCommands } from './commands/index.js';

const program = new Command();

program
  .name('seamless')
  .description('CLI and MCP server for the Seamless.ai B2B prospecting platform')
  .version('0.1.0')
  .option('--api-key <key>', 'Seamless.ai API key (overrides SEAMLESS_API_KEY env var and stored config)')
  .option('--output <format>', 'Output format: json (default) or pretty', 'json')
  .option('--pretty', 'Shorthand for --output pretty')
  .option('--quiet', 'Suppress output, exit codes only')
  .option('--fields <fields>', 'Comma-separated list of fields to include in output (supports dot notation)');

registerAllCommands(program);

program.parse();
