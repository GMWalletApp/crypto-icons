<div align="center">

# 🪙 crypto-icons

**2,100+ Cryptocurrency Icons — Tokens, Networks, Exchanges & Wallets**

SVG · 4 categories · 3 variants · CDN-ready · npm packages

[![GitHub release](https://img.shields.io/github/v/release/GMWalletApp/crypto-icons?style=flat-square)](https://github.com/GMWalletApp/crypto-icons/releases)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

[中文文档](./README.ZH_CN.md)

</div>

---

## Icon Categories

| Category  | Count | Variants |
|-----------|------:|---------|
| tokens    | 1,842 | branded · mono · background |
| networks  |   242 | branded · mono · background |
| exchanges |    28 | branded · mono · background |
| wallets   |    52 | branded · mono · background |

Icons sourced from [web3icons](https://github.com/0xa3k5/web3icons), synced daily, with custom overrides.

---

## CDN Usage (no install)

```
https://cdn.jsdmirror.com/gh/GMWalletApp/crypto-icons@main/assets/{category}/{variant}/{name}.svg
```

**Parameters:**
- `category` — `tokens` · `networks` · `exchanges` · `wallets`
- `variant` — `branded` · `mono` · `background`
- `name` — lowercase icon name (e.g. `eth`, `bitcoin`, `metamask`)

**Examples:**
```
https://cdn.jsdmirror.com/gh/GMWalletApp/crypto-icons@main/assets/tokens/branded/eth.svg
https://cdn.jsdmirror.com/gh/GMWalletApp/crypto-icons@main/assets/networks/mono/binance-smart-chain.svg
https://cdn.jsdmirror.com/gh/GMWalletApp/crypto-icons@main/assets/wallets/branded/metamask.svg
```

**Mirror CDNs (automatic fallback in npm package):**
```
https://cdn.jsdmirror.com/gh/GMWalletApp/crypto-icons@main/...   (China-optimized)
https://cdn.jsdelivr.net/gh/GMWalletApp/crypto-icons@main/...
https://fastly.jsdelivr.net/gh/GMWalletApp/crypto-icons@main/...
https://gcore.jsdelivr.net/gh/GMWalletApp/crypto-icons@main/...
```

---

## npm Packages

### Install

```bash
bun add @gmwalletapp/crypto-icons
# or
bun add @gmwalletapp/crypto-icons-react
```

> **Note:** Published to GitHub Packages. Add to `.npmrc`:
> ```
> @gmwalletapp:registry=https://npm.pkg.github.com
> ```

---

### `@gmwalletapp/crypto-icons` (core)

Framework-agnostic URL builder with multi-CDN fallback.

#### `getIconUrl(category, name, options?)` — async

```ts
import { getIconUrl } from '@gmwalletapp/crypto-icons'

const url = await getIconUrl('token', 'ETH')
// → https://cdn.jsdmirror.com/.../assets/tokens/branded/eth.svg

const url2 = await getIconUrl('network', 'BSC', { variant: 'mono' })
// → https://cdn.jsdmirror.com/.../assets/networks/mono/binance-smart-chain.svg

const url3 = await getIconUrl('wallet', 'MetaMask', { variant: 'background' })
// → https://cdn.jsdmirror.com/.../assets/wallets/background/metamask.svg
```

- Names are case-insensitive
- Aliases resolved automatically (e.g. `bsc` → `binance-smart-chain`, fetched from CDN)

#### `loadIcon(category, name, options?)` — async, with CDN fallback

```ts
import { loadIcon } from '@gmwalletapp/crypto-icons'

const { url } = await loadIcon('token', 'eth')
// Tries CDNs in order, returns first 200 OK
```

#### `getIconColor(category, name)` — async

Returns the dominant RGB color of an icon, fetched from CDN color maps.

```ts
import { getIconColor } from '@gmwalletapp/crypto-icons'

const color = await getIconColor('token', 'eth')
// → { r: 138, g: 155, b: 226 }

const color2 = await getIconColor('network', 'bsc')
// → { r: 243, g: 186, b: 47 }
```

Returns `null` if no color data is available.

#### `CDN_LIST`

```ts
import { CDN_LIST } from '@gmwalletapp/crypto-icons'
// Array of { name, base } in fallback order
```

---

### `@gmwalletapp/crypto-icons-react`

Thin React wrapper.

#### `<CryptoIcon>`

```tsx
import { CryptoIcon } from '@gmwalletapp/crypto-icons-react'

<CryptoIcon type="token"    name="ETH"      size={32} />
<CryptoIcon type="network"  name="bsc"      variant="mono" size={24} />
<CryptoIcon type="exchange" name="binance"  variant="background" />
<CryptoIcon type="wallet"   name="metamask" size={40} />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `"token" \| "network" \| "exchange" \| "wallet"` | required | Icon category |
| `name` | `string` | required | Icon name (case-insensitive) |
| `variant` | `"branded" \| "mono" \| "background"` | `"branded"` | Icon style |
| `size` | `number \| string` | — | Sets width & height together |
| ...img props | | | All native `<img>` attributes |

#### `getCryptoIconUrl` / `useCryptoIconUrl`

```ts
import { getCryptoIconUrl, useCryptoIconUrl } from '@gmwalletapp/crypto-icons-react'

// Outside React (async)
const url = await getCryptoIconUrl('token', 'eth', { variant: 'mono' })

// Inside React hook (resolves asynchronously, returns undefined until ready)
const url = useCryptoIconUrl('network', 'ethereum')
```

---

## Aliases

Common aliases are pre-configured in `aliases/`, fetched from CDN at runtime:

- `aliases/networks.json` — e.g. `bsc` / `bnb` → `binance-smart-chain`, `arc-testnet` → `arc`
- `aliases/tokens.json`
- `aliases/exchanges.json`
- `aliases/wallets.json`

To add an alias, edit the relevant file and commit.

---

## Custom Icons

Place SVG files in `assets/{category}/{variant}/{name}.svg` and add the icon entry to `custom/{category}.json`:

```json
[{ "id": "okpay", "name": "OKPay", "variants": ["branded", "mono", "background"] }]
```

Custom icons are preserved across daily syncs.

---

## Icon Maps

`maps/*.json` — full icon listings per category, regenerated on each sync:

```ts
import tokens from 'https://cdn.jsdmirror.com/gh/GMWalletApp/crypto-icons@main/maps/tokens.json'
```

---

## Color Maps

`colors/*.json` — dominant RGB color per icon, used by `getIconColor()`:

```
colors/tokens.json
colors/networks.json
colors/exchanges.json
colors/wallets.json
```

Format: `{ "eth": { "r": 138, "g": 155, "b": 226 }, ... }`

---

## License

MIT © GMWalletApp
