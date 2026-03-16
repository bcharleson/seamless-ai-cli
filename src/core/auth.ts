import { loadConfig } from './config.js';
import { AuthError } from './errors.js';

/**
 * Resolves the Seamless.ai API key using 3-tier priority:
 *   1. --api-key CLI flag (highest priority)
 *   2. SEAMLESS_API_KEY environment variable
 *   3. Stored config at ~/.seamless-cli/config.json
 */
export async function resolveApiKey(flagKey?: string): Promise<string> {
  // 1. --api-key flag
  if (flagKey) return flagKey;

  // 2. SEAMLESS_API_KEY environment variable
  const envKey = process.env.SEAMLESS_API_KEY;
  if (envKey) return envKey;

  // 3. Stored config
  const config = await loadConfig();
  if (config?.api_key) return config.api_key;

  throw new AuthError(
    'No API key found. Set SEAMLESS_API_KEY, use --api-key, or run: seamless login',
  );
}
