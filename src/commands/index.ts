import { Command } from 'commander';
import type { CommandDefinition, GlobalOptions } from '../core/types.js';
import { resolveApiKey } from '../core/auth.js';
import { SeamlessClient } from '../core/client.js';
import { output, outputError } from '../core/output.js';

// Auth commands (no API client needed)
import { registerLoginCommand } from './auth/login.js';
import { registerLogoutCommand } from './auth/logout.js';
import { registerStatusCommand } from './auth/status.js';

// MCP server command
import { registerMcpCommand } from './mcp/index.js';

// Command definitions
import { allContactsCommands } from './contacts/index.js';
import { allCompaniesCommands } from './companies/index.js';
import { allOauthCommands } from './oauth/index.js';

/** All command definitions — single source of truth for CLI + MCP */
export const allCommands: CommandDefinition[] = [
  ...allContactsCommands,
  ...allCompaniesCommands,
  ...allOauthCommands,
];

export function registerAllCommands(program: Command): void {
  registerLoginCommand(program);
  registerLogoutCommand(program);
  registerStatusCommand(program);
  registerMcpCommand(program);

  // Group commands by their `group` field
  const groups = new Map<string, CommandDefinition[]>();
  for (const cmd of allCommands) {
    if (!groups.has(cmd.group)) groups.set(cmd.group, []);
    groups.get(cmd.group)!.push(cmd);
  }

  for (const [groupName, commands] of groups) {
    const groupCmd = program
      .command(groupName)
      .description(`Manage ${groupName} on Seamless.ai`);

    for (const cmdDef of commands) {
      registerCommand(groupCmd, cmdDef);
    }

    groupCmd.on('command:*', (operands: string[]) => {
      const available = commands.map((c) => c.subcommand).join(', ');
      console.error(`error: unknown command '${operands[0]}' for '${groupName}'`);
      console.error(`Available commands: ${available}`);
      process.exitCode = 1;
    });
  }
}

function registerCommand(parent: Command, cmdDef: CommandDefinition): void {
  const cmd = parent
    .command(cmdDef.subcommand)
    .description(cmdDef.description);

  // Register positional arguments
  if (cmdDef.cliMappings.args) {
    for (const arg of cmdDef.cliMappings.args) {
      const argStr = arg.required ? `<${arg.name}>` : `[${arg.name}]`;
      cmd.argument(argStr, arg.field);
    }
  }

  // Register options
  if (cmdDef.cliMappings.options) {
    for (const opt of cmdDef.cliMappings.options) {
      cmd.option(opt.flags, opt.description ?? '');
    }
  }

  // Append examples to help text
  if (cmdDef.examples?.length) {
    cmd.addHelpText(
      'after',
      '\nExamples:\n' + cmdDef.examples.map((e) => `  $ ${e}`).join('\n'),
    );
  }

  cmd.action(async (...actionArgs: any[]) => {
    try {
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions & Record<string, any>;

      // --pretty shorthand
      if (globalOpts.pretty) {
        globalOpts.output = 'pretty';
      }

      // Resolve API key
      const apiKey = await resolveApiKey(globalOpts.apiKey);
      const client = new SeamlessClient({ apiKey });

      // Build input from positional args + options
      const input: Record<string, any> = {};

      if (cmdDef.cliMappings.args) {
        for (let i = 0; i < cmdDef.cliMappings.args.length; i++) {
          const argDef = cmdDef.cliMappings.args[i];
          if (actionArgs[i] !== undefined) {
            input[argDef.field] = actionArgs[i];
          }
        }
      }

      if (cmdDef.cliMappings.options) {
        for (const opt of cmdDef.cliMappings.options) {
          // Extract the long flag name and convert to camelCase
          const match = opt.flags.match(/--([a-z][a-z0-9-]*)/);
          if (match) {
            const optName = match[1].replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
            if (globalOpts[optName] !== undefined) {
              input[opt.field] = globalOpts[optName];
            }
          }
        }
      }

      // Validate with Zod schema
      const parsed = cmdDef.inputSchema.safeParse(input);
      if (!parsed.success) {
        const issues = parsed.error.issues ?? [];
        const missing = issues
          .filter((i: any) => {
            const fieldName = String(i.path?.[0] ?? '');
            return (input as Record<string, any>)[fieldName] === undefined;
          })
          .map((i: any) => {
            return (
              '--' +
              String(i.path?.[0] ?? '')
                .replace(/([a-z])([A-Z])/g, '$1-$2')
                .toLowerCase()
                .replace(/_/g, '-')
            );
          });

        if (missing.length > 0) {
          throw new Error(`Missing required option(s): ${missing.join(', ')}`);
        }
        const msg = issues
          .map((i: any) => `${i.path?.join('.')}: ${i.message}`)
          .join('; ');
        throw new Error(`Invalid input: ${msg}`);
      }

      const result = await cmdDef.handler(parsed.data, client);
      output(result, globalOpts);
    } catch (error) {
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions;
      outputError(error, globalOpts);
    }
  });
}
