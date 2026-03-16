import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { SeamlessConfig } from './types.js';

const CONFIG_DIR = join(homedir(), '.seamless-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export async function loadConfig(): Promise<SeamlessConfig | null> {
  try {
    const content = await readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as SeamlessConfig;
  } catch {
    return null;
  }
}

export async function saveConfig(config: SeamlessConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', {
    mode: 0o600, // owner read/write only — protects the API key
  });
}

export async function deleteConfig(): Promise<void> {
  try {
    await rm(CONFIG_FILE);
  } catch {
    // File doesn't exist — that's fine
  }
}
