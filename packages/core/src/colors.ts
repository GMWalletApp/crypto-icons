/**
 * colors.ts — fetch dominant icon colors from CDN (multi-CDN fallback)
 *
 * Color data lives at:
 *   {CDN_BASE}/colors/{category}.json
 *
 * Keys use the same canonical filename as SVG assets (alias-resolved, lowercase).
 */

import type { IconCategory, RGBColor } from "./types";
import { CDN_LIST, CATEGORY_DIR, resolveFilename } from "./utils";

// In-memory cache: category → full color map
const cache = new Map<IconCategory, Record<string, RGBColor>>();

async function fetchColorMap(category: IconCategory): Promise<Record<string, RGBColor> | null> {
  if (cache.has(category)) return cache.get(category)!;

  const file = `colors/${CATEGORY_DIR[category]}.json`;
  for (const cdn of CDN_LIST) {
    const url = `${cdn.base}/${file}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json() as Record<string, RGBColor>;
        cache.set(category, data);
        return data;
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Get the dominant RGB color for an icon.
 * Uses the same alias resolution as getIconUrl — e.g. "bsc" → "binance-smart-chain".
 * Returns null if the icon has no color data or CDN is unreachable.
 */
export async function getIconColor(
  category: IconCategory,
  name: string,
): Promise<RGBColor | null> {
  const key = await resolveFilename(category, name);
  const map = await fetchColorMap(category);
  if (!map) return null;
  return map[key] ?? null;
}
