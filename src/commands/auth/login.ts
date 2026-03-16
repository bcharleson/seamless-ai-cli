import { Command } from 'commander';
import { SeamlessClient } from '../../core/client.js';
import { saveConfig } from '../../core/config.js';
import { output, outputError } from '../../core/output.js';
import type { GlobalOptions } from '../../core/types.js';

export function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Authenticate with your Seamless.ai API key')
    .option('--api-key <key>', 'API key (skips interactive prompt)')
    .action(async (opts) => {
      const globalOpts = program.opts() as GlobalOptions;

      try {
        let apiKey = opts.apiKey || process.env.SEAMLESS_API_KEY;

        if (!apiKey) {
          if (!process.stdin.isTTY) {
            outputError(
              new Error(
                'No API key provided. Use --api-key or set SEAMLESS_API_KEY',
              ),
              globalOpts,
            );
            return;
          }

          console.log('Get your API key from: https://login.seamless.ai/app/settings\n');

          const [major] = process.versions.node.split('.').map(Number);
          if (major < 20) {
            outputError(
              new Error(
                'Interactive login requires Node.js 20+. Use --api-key or set SEAMLESS_API_KEY instead.',
              ),
              globalOpts,
            );
            return;
          }
          const { password } = await import('@inquirer/prompts');
          apiKey = await password({
            message: 'Enter your Seamless.ai API key:',
            mask: '*',
          });
        }

        if (!apiKey) {
          outputError(new Error('No API key provided'), globalOpts);
          return;
        }

        // Validate by fetching org contacts (lightweight check)
        const client = new SeamlessClient({ apiKey });

        if (process.stdin.isTTY) {
          console.log('Validating API key...');
        }

        let valid = false;
        try {
          await client.get('/contacts', { page: 1, limit: 1 });
          valid = true;
        } catch (err: any) {
          // 401/403 = invalid key; other errors (credits, 5xx) still mean key is valid
          if (err.code === 'AUTH_ERROR') {
            outputError(new Error('Invalid API key — authentication failed'), globalOpts);
            return;
          }
          valid = true; // credits error or server error still means key exists
        }

        await saveConfig({ api_key: apiKey });

        const result = {
          status: 'authenticated',
          config_path: '~/.seamless-cli/config.json',
          api_key_preview: `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`,
        };

        if (process.stdin.isTTY) {
          console.log('\nAuthenticated successfully!');
          console.log(`API key saved to ~/.seamless-cli/config.json`);
          console.log(`Key: ${result.api_key_preview}`);
        } else {
          output(result, globalOpts);
        }
      } catch (error) {
        outputError(error, globalOpts);
      }
    });
}
