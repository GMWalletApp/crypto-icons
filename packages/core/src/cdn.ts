/**
 * cdn.ts — CDN URL builder with multi-CDN fallback
 *
 * CDN priority (China-optimized first):
 *   jsdmirror → jsdelivr → fastly.jsdelivr → gcore.jsdelivr
 */

import type { IconCategory, IconVariant, GetIconUrlOptions, IconLoadResult } from "./types";
import { CDN_LIST, CATEGORY_DIR, resolveFilename } from "./utils";

/** Build a CDN URL (uses primary CDN, alias-resolved) */
export async function getIconUrl(
  category: IconCategory,
  name: string,
  options: GetIconUrlOptions = {},
): Promise<string> {
  const { variant = "branded" } = options;
  const file = await resolveFilename(category, name);
  return `${CDN_LIST[0].base}/assets/${CATEGORY_DIR[category]}/${variant}/${file}.svg`;
}

/** Try each CDN in order, return first that responds 200 */
export async function loadIcon(
  category: IconCategory,
  name: string,
  options: GetIconUrlOptions = {},
): Promise<IconLoadResult> {
  const { variant = "branded" } = options;
  const file = await resolveFilename(category, name);
  const assetPath = `assets/${CATEGORY_DIR[category]}/${variant}/${file}.svg`;

  for (const cdn of CDN_LIST) {
    const url = `${cdn.base}/${assetPath}`;
    try {
      const res = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) {
        return { url };
      }
    } catch {
      continue;
    }
  }

  // fallback to primary without verification
  return { url: `${CDN_LIST[0].base}/${assetPath}` };
}
