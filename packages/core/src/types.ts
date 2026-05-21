/**
 * types.ts — shared types for @gmwalletapp/crypto-icons
 */

export type IconCategory = "token" | "network" | "exchange" | "wallet";
export type IconVariant = "branded" | "mono" | "background";

export interface GetIconUrlOptions {
  /** Icon style variant (default: "branded") */
  variant?: IconVariant;
}

export interface IconLoadResult {
  /** Resolved SVG URL (first CDN that responded 200, or primary as fallback) */
  url: string;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}
