/**
 * utils.ts — alias resolution via CDN (multi-CDN fallback, memory-cached)
 *
 * Alias data lives at:
 *   {CDN_BASE}/aliases/{category}.json
 *
 * Each file is a map of { [alias]: canonical }
 */

import type { IconCategory } from "./types";

export const CATEGORY_DIR: Record<IconCategory, string> = {
  token:    "tokens",
  network:  "networks",
  exchange: "exchanges",
  wallet:   "wallets",
};

export const CDN_LIST: Array<{ name: string; base: string }> = [
  { name: "jsdmirror",       base: "https://cdn.jsdmirror.com/gh/GMWalletApp/crypto-icons@latest" },
  { name: "jsdelivr",        base: "https://cdn.jsdelivr.net/gh/GMWalletApp/crypto-icons@latest" },
  { name: "fastly.jsdelivr", base: "https://fastly.jsdelivr.net/gh/GMWalletApp/crypto-icons@latest" },
  { name: "gcore.jsdelivr",  base: "https://gcore.jsdelivr.net/gh/GMWalletApp/crypto-icons@latest" },
];

// In-memory cache: category → alias map
const aliasCache = new Map<IconCategory, Record<string, string>>();

async function fetchAliasMap(category: IconCategory): Promise<Record<string, string>> {
  if (aliasCache.has(category)) return aliasCache.get(category)!;

  const file = `aliases/${CATEGORY_DIR[category]}.json`;
  for (const cdn of CDN_LIST) {
    const url = `${cdn.base}/${file}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json() as Record<string, string>;
        aliasCache.set(category, data);
        return data;
      }
    } catch {
      continue;
    }
  }

  // CDN unreachable — return empty, no alias resolution
  return {};
}

/** Resolve name → canonical filename (lowercase, alias-aware, spaces→dashes) */
export async function resolveFilename(category: IconCategory, name: string): Promise<string> {
  const key = name.trim().toLowerCase().replace(/\s+/g, "-");
  const aliases = await fetchAliasMap(category);
  return (aliases[key] ?? key).toLowerCase();
}
