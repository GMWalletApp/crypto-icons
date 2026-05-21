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

    if (custom.length > 0) {
      const customIds = new Set(custom.map((e) => e.id));
      // upstream entries not overridden by custom + all custom entries at the end
      const merged = [...upstream.filter((e) => !customIds.has(e.id)), ...custom];
      writeFileSync(dest, JSON.stringify(merged, null, 2), "utf8");
      console.log(`  maps/${category}.json  (${upstream.length} upstream + ${custom.length} custom = ${merged.length})`);
    } else {
      writeFileSync(dest, JSON.stringify(upstream, null, 2), "utf8");
      console.log(`  maps/${category}.json  (${upstream.length} entries)`);
    }
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

    writeFileSync(outPath, JSON.stringify(base, null, 2), "utf8");
    console.log(`  aliases/${category}.json  (${Object.keys(base).length} entries)`);
  }
}

// ─── extract colors ───────────────────────────────────────────────────────────
// For each category, read assets/{category}/branded/*.svg and extract the
// dominant color via sharp (rasterize to 16×16, removeAlpha, stats).
// Output: maps/colors.json  { "tokens/eth": "#627eea", ... }

interface RGBColor { r: number; g: number; b: number; }

async function extractColors() {
  const colorsPath = join("maps", "colors.json");
  const existing: Record<string, RGBColor> = existsSync(colorsPath)
    ? JSON.parse(readFileSync(colorsPath, "utf8"))
    : {};

  // Normalize any legacy uppercase keys to lowercase
  const colors: Record<string, RGBColor> = Object.fromEntries(
    Object.entries(existing).map(([k, v]) => [k.toLowerCase(), v])
  );
  let updated = 0;

  for (const category of CATEGORIES) {
    const brandedDir = join("assets", category, "branded");
    if (!existsSync(brandedDir)) continue;

    const files = readdirSync(brandedDir).filter((f) => f.endsWith(".svg"));
    for (const file of files) {
      const name = file.replace(/\.svg$/, "").toLowerCase();
      const key = `${category}/${name}`;

      // Skip if already extracted and SVG hasn't been modified
      if (!FORCE && existing[key]) continue;

      const svgPath = join(brandedDir, file);
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
          colors[key] = {
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
    console.log(`  ${category.padEnd(12)} ${files.length} icons`);
  }

  writeFileSync(colorsPath, JSON.stringify(colors, null, 2), "utf8");
  console.log(`  maps/colors.json  (${Object.keys(colors).length} total, ${updated} updated)`);
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
