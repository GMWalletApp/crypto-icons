/**
 * sync-web3icons.ts
 *
 * Clones 0xa3k5/web3icons via sparse checkout (no API rate limits).
 *
 * Pulls:
 *   raw-svgs/{tokens,networks,exchanges,wallets}/{branded,mono,background}/
 *   packages/common/src/metadata/*.json
 *
 * Outputs:
 *   assets/{category}/{variant}/{id}.svg   <- committed to git
 *   maps/tokens.json / networks.json / exchanges.json / wallets.json
 *
 * Custom icons (e.g. okpay) placed in assets/ are never deleted — this
 * script only writes, never removes.
 *
 * Usage:
 *   bun scripts/sync-web3icons.ts          incremental
 *   bun scripts/sync-web3icons.ts --force  force re-sync all files
 */

import { existsSync, mkdirSync, copyFileSync, readdirSync, writeFileSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require("sharp") as typeof import("sharp").default;

const REPO_URL = "https://github.com/0xa3k5/web3icons.git";
const CLONE_DIR = "/tmp/web3icons-src";
const FORCE = process.argv.includes("--force");

const CATEGORIES = ["tokens", "networks", "exchanges", "wallets"] as const;
type Category = (typeof CATEGORIES)[number];
const VARIANTS = ["branded", "mono", "background"] as const;

// ─── shell helper ─────────────────────────────────────────────────────────────

function sh(cmd: string, args: string[], cwd?: string) {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")}\n${result.stderr}`);
  }
  return result.stdout;
}

// ─── clone / update ───────────────────────────────────────────────────────────

function cloneOrUpdate() {
  if (existsSync(join(CLONE_DIR, ".git"))) {
    console.log("  git pull (existing clone)...");
    sh("git", ["pull", "--depth=1", "--rebase"], CLONE_DIR);
  } else {
    console.log("  git clone (sparse, depth=1)...");
    mkdirSync(CLONE_DIR, { recursive: true });
    sh("git", ["clone", "--depth=1", "--filter=blob:none", "--no-checkout", REPO_URL, CLONE_DIR]);
    sh("git", ["sparse-checkout", "init", "--cone"], CLONE_DIR);
    sh(
      "git",
      [
        "sparse-checkout",
        "set",
        "raw-svgs",
        "packages/common/src/metadata",
      ],
      CLONE_DIR
    );
    sh("git", ["checkout"], CLONE_DIR);
  }
}

// ─── copy SVGs ────────────────────────────────────────────────────────────────

// Category name (plural) → singular type prefix used in filePath
const CAT_TO_TYPE: Record<string, string> = {
  tokens: "token",
  networks: "network",
  exchanges: "exchange",
  wallets: "wallet",
};
// Reverse: type prefix → category name
const TYPE_TO_CAT: Record<string, string> = Object.fromEntries(
  Object.entries(CAT_TO_TYPE).map(([cat, type]) => [type, cat])
);

/**
 * Copy SVGs from upstream web3icons, one category at a time.
 * Each category only gets SVGs from its own raw-svgs/{category}/ directory.
 */
function syncSVGs() {
  let totalCopied = 0;
  let totalSkipped = 0;

  for (const category of CATEGORIES) {
    for (const variant of VARIANTS) {
      const srcDir = join(CLONE_DIR, "raw-svgs", category, variant);
      const destDir = join("assets", category, variant);
      mkdirSync(destDir, { recursive: true });

      if (!existsSync(srcDir)) {
        console.warn(`  ⚠ not found: ${srcDir}`);
        continue;
      }

      const files = readdirSync(srcDir).filter((f) => f.endsWith(".svg"));
      let copied = 0;
      let skipped = 0;

      for (const file of files) {
        // normalize to lowercase so lookups are always case-insensitive
        const dest = join(destDir, file.toLowerCase());
        if (!FORCE && existsSync(dest)) {
          skipped++;
          continue;
        }
        copyFileSync(join(srcDir, file), dest);
        copied++;
      }

      totalCopied += copied;
      totalSkipped += skipped;
      console.log(
        `  ${category}/${variant.padEnd(12)} ${files.length} files  (↓${copied}  cache:${skipped})`
      );
    }
  }

  console.log(`\n  Total: ↓${totalCopied} copied, ${totalSkipped} cached`);
}

/**
 * For entries whose upstream filePath references a different category
 * (e.g. network shibarium → token:SHIB), copy the SVG from the source
 * category into this category's asset directory and rewrite filePath to
 * own-type:id so consumers never need to look outside the category.
 *
 * Rule: icons must only come from their own category's source directory.
 * Cross-type references are resolved by copying the source SVG locally.
 */
function fixCrossTypeIcons(category: string, entries: TokenMeta[]): TokenMeta[] {
  const ownType = CAT_TO_TYPE[category];
  const crossEntries = entries.filter(
    (e) => typeof e.filePath === "string" && !e.filePath.startsWith(`${ownType}:`)
  );

  if (crossEntries.length === 0) return entries;

  let fixed = 0;
  for (const entry of crossEntries) {
    const [srcType, srcId] = (entry.filePath as string).split(":", 2);
    const srcCat = TYPE_TO_CAT[srcType];
    const oldFp = entry.filePath as string;
    if (!srcCat) continue;

    for (const variant of VARIANTS) {
      const destDir = join("assets", category, variant);
      mkdirSync(destDir, { recursive: true });
      const destFile = join(destDir, `${entry.id}.svg`);
      if (!FORCE && existsSync(destFile)) continue;

      // Try uppercase then lowercase filename in source category
      const srcDir = join(CLONE_DIR, "raw-svgs", srcCat, variant);
      let srcFile: string | null = null;
      for (const name of [srcId, srcId.toLowerCase()]) {
        const candidate = join(srcDir, `${name}.svg`);
        if (existsSync(candidate)) { srcFile = candidate; break; }
      }
      if (srcFile) copyFileSync(srcFile, destFile);
    }

    // Rewrite filePath to own-type:id
    entry.filePath = `${ownType}:${entry.id}`;
    fixed++;
    console.log(`  ↳ cross-type fix: ${category}/${entry.id} (${oldFp} → ${entry.filePath})`);
  }

  if (fixed > 0) console.log(`  Fixed ${fixed} cross-type icon(s) for ${category}`);
  return entries;
}

// ─── copy metadata ────────────────────────────────────────────────────────────

interface TokenMeta {
  id: string;
  symbol?: string;
  [key: string]: unknown;
}

function syncMetadata() {
  mkdirSync("maps", { recursive: true });

  for (const category of CATEGORIES) {
    const src = join(CLONE_DIR, "packages/common/src/metadata", `${category}.json`);
    const dest = join("maps", `${category}.json`);
    const upstream = JSON.parse(readFileSync(src, "utf8")) as TokenMeta[];

    // merge custom entries — custom/wallets.json etc. override by id
    const customPath = join("custom", `${category}.json`);
    const custom: TokenMeta[] = existsSync(customPath)
      ? (JSON.parse(readFileSync(customPath, "utf8")) as TokenMeta[])
      : [];

    let merged: TokenMeta[];
    if (custom.length > 0) {
      const customIds = new Set(custom.map((e) => e.id));
      // upstream entries not overridden by custom + all custom entries at the end
      merged = [...upstream.filter((e) => !customIds.has(e.id)), ...custom];
      console.log(`  maps/${category}.json  (${upstream.length} upstream + ${custom.length} custom = ${merged.length})`);
    } else {
      merged = upstream;
      console.log(`  maps/${category}.json  (${upstream.length} entries)`);
    }

    // Resolve cross-type filePath references: copy SVG from source category
    // into this category's asset dir, rewrite filePath to own-type:id.
    merged = fixCrossTypeIcons(category, merged);

    writeFileSync(dest, JSON.stringify(merged), "utf8");
  }
}

// ─── merge aliases ────────────────────────────────────────────────────────────
// Source of truth: aliases/{category}.json (committed)
// Output (generated): packages/core/src/aliases/{category}.json (gitignored)

function mergeAliases() {
  const outDir = join("packages/core/src/aliases");
  mkdirSync(outDir, { recursive: true });

  for (const category of CATEGORIES) {
    const basePath = join("aliases", `${category}.json`);
    const outPath = join(outDir, `${category}.json`);

    const base: Record<string, string> = existsSync(basePath)
      ? JSON.parse(readFileSync(basePath, "utf8"))
      : {};

    writeFileSync(outPath, JSON.stringify(base), "utf8");
    console.log(`  aliases/${category}.json  (${Object.keys(base).length} entries)`);
  }
}

// ─── extract colors ───────────────────────────────────────────────────────────
// For each category, read assets/{category}/branded/*.svg and extract the
// dominant color via sharp (rasterize to 16×16, removeAlpha, stats).
// Output: maps/colors.json  { "tokens/eth": "#627eea", ... }

interface RGBColor { r: number; g: number; b: number; }

async function extractColors() {
  // Each category gets its own colors/{category}.json file.
  // Keys are the bare icon name (lowercase), matching the SVG filename stem.
  mkdirSync("colors", { recursive: true });
  let totalUpdated = 0;

  for (const category of CATEGORIES) {
    const colorFile = join("colors", `${category}.json`);
    const existing: Record<string, RGBColor> = existsSync(colorFile)
      ? JSON.parse(readFileSync(colorFile, "utf8"))
      : {};

    // Normalize any legacy uppercase keys to lowercase
    const colors: Record<string, RGBColor> = Object.fromEntries(
      Object.entries(existing).map(([k, v]) => [k.toLowerCase(), v])
    );
    let updated = 0;

    // Collect all icon names across variants (branded > background > mono)
    const variantOrder = ["branded", "background", "mono"] as const;
    const allNames = new Set<string>();
    for (const variant of variantOrder) {
      const dir = join("assets", category, variant);
      if (existsSync(dir)) {
        for (const f of readdirSync(dir)) {
          if (f.endsWith(".svg")) allNames.add(f.replace(/\.svg$/, "").toLowerCase());
        }
      }
    }

    for (const name of allNames) {
      // Skip if already extracted (use --force to re-extract all)
      if (!FORCE && colors[name]) continue;

      // Prefer branded, fall back to background, then mono
      let svgPath: string | null = null;
      for (const variant of variantOrder) {
        const candidate = join("assets", category, variant, `${name}.svg`);
        if (existsSync(candidate)) { svgPath = candidate; break; }
      }
      if (!svgPath) continue;
      try {
        const buf = readFileSync(svgPath);
        // Rasterize to RGBA, average the color of non-transparent pixels.
        // Using dominant color from stats() is unreliable because the most
        // frequent color is usually the transparent background (black after
        // removeAlpha). Instead we compute the mean RGB of pixels with alpha > 64.
        const { data } = await sharp(buf, { density: 144 })
          .resize(32, 32, { fit: "contain" })
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        let r = 0, g = 0, bl = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 64) { r += data[i]; g += data[i + 1]; bl += data[i + 2]; count++; }
        }
        if (count > 0) {
          colors[name] = {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(bl / count),
          };
          updated++;
        }
      } catch {
        // SVG may have features sharp can't rasterize — skip silently
      }
    }

    writeFileSync(colorFile, JSON.stringify(colors), "utf8");
    console.log(`  colors/${category}.json  (${Object.keys(colors).length} total, ${updated} new)`);
    totalUpdated += updated;
  }

  console.log(`  Total colors updated: ${totalUpdated}`);
}

// ─── main ─────────────────────────────────────────────────────────────────────

console.log(`\n🌐  web3icons sync  [force=${FORCE}]\n`);

console.log("📥  Clone / update source repo...");
cloneOrUpdate();

console.log("\n📋  Metadata...");
syncMetadata();

console.log("\n🎨  SVGs...");
syncSVGs();

console.log("\n🔗  Aliases...");
mergeAliases();

console.log("\n🎨  Colors...");
await extractColors();

console.log("\n✅  Done!\n");
