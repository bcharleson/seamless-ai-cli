import { Command } from 'commander';
import { loadConfig, getConfigPath } from '../../core/config.js';
import { resolveApiKey } from '../../core/auth.js';
import { output, outputError } from '../../core/output.js';
import type { GlobalOptions } from '../../core/types.js';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show current authentication status')
    .action(async () => {
      const globalOpts = program.opts() as GlobalOptions;

      try {
        let apiKey: string | undefined;

        try {
          apiKey = await resolveApiKey(globalOpts.apiKey);
        } catch {
          // No key available
        }

        if (!apiKey) {
          const result = {
            authenticated: false,
            config_path: getConfigPath(),
            message: 'Not authenticated. Run: seamless login',
          };

          if (process.stdin.isTTY) {
            console.log('Not authenticated.');
            console.log('Run: seamless login');
          } else {
            output(result, globalOpts);
          }
          return;
        }

        const config = await loadConfig();
        const tokenSource = globalOpts.apiKey
          ? 'flag'
          : process.env.SEAMLESS_API_KEY
            ? 'env'
            : 'config';

        const result = {
          authenticated: true,
          api_key_preview: `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`,
          token_source: tokenSource,
          config_path: getConfigPath(),
          config_exists: config !== null,
        };

        if (process.stdin.isTTY) {
          console.log('Authenticated');
          console.log(`API key: ${result.api_key_preview}`);
          console.log(`Source:  ${result.token_source}`);
          console.log(`Config:  ${result.config_path}`);
        } else {
          output(result, globalOpts);
        }
      } catch (error) {
        outputError(error, globalOpts);
      }
    });
}
