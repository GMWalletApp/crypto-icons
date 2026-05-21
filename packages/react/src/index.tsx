/**
 * @gmwalletapp/crypto-icons-react
 * React wrapper around @gmwalletapp/crypto-icons core
 *
 * Usage:
 *   <CryptoIcon type="token"    name="ETH"      variant="branded" />
 *   <CryptoIcon type="network"  name="bsc"       variant="mono" />
 *   <CryptoIcon type="exchange" name="binance"   variant="background" />
 *   <CryptoIcon type="wallet"   name="metamask" />
 */

import { useState, useEffect, type ImgHTMLAttributes } from "react";
import { getIconUrl } from "@gmwalletapp/crypto-icons";
import type { IconCategory, IconVariant, GetIconUrlOptions } from "@gmwalletapp/crypto-icons";

export type { IconCategory, IconVariant };

export interface CryptoIconProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  /** Icon category */
  type: IconCategory;
  /** Icon name — matched case-insensitively; aliases applied automatically */
  name: string;
  /** Icon style variant (default: "branded") */
  variant?: IconVariant;
  /** Shorthand size — sets both width and height */
  size?: number | string;
}

export function CryptoIcon({
  type,
  name,
  variant = "branded",
  size,
  width,
  height,
  style,
  alt,
  ...rest
}: CryptoIconProps) {
  const [src, setSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getIconUrl(type, name, { variant }).then((url: string) => {
      if (!cancelled) setSrc(url);
    });
    return () => { cancelled = true; };
  }, [type, name, variant]);

  const w = size !== undefined ? size : width;
  const h = size !== undefined ? size : height;

  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt ?? `${name} ${type} icon`}
      width={w}
      height={h}
      style={{ display: "inline-block", ...style }}
      {...rest}
    />
  );
}

/** Hook: resolves the CDN URL asynchronously */
export function useCryptoIconUrl(
  type: IconCategory,
  name: string,
  options: GetIconUrlOptions = {},
): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);
  const { variant = "branded" } = options;

  useEffect(() => {
    let cancelled = false;
    getIconUrl(type, name, { variant }).then((u: string) => {
      if (!cancelled) setUrl(u);
    });
    return () => { cancelled = true; };
  }, [type, name, variant]);

  return url;
}

/** Get icon URL without React (async) */
export function getCryptoIconUrl(
  type: IconCategory,
  name: string,
  options: GetIconUrlOptions = {},
): Promise<string> {
  return getIconUrl(type, name, options);
}

export default CryptoIcon;
