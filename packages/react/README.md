# @gmwalletapp/crypto-icons-react

React component for Web3 icons — tokens, networks, exchanges, wallets.  
Icons are served via CDN (jsDelivr → GitHub) from the `develop` branch of this repo. **Zero bundle size for icon data.**

## Install

```bash
npm install @gmwalletapp/crypto-icons-react
# or
bun add @gmwalletapp/crypto-icons-react
```

## Usage

```tsx
import { CryptoIcon } from '@gmwalletapp/crypto-icons-react'

// Token — by symbol (case-insensitive)
<CryptoIcon type="token" name="ETH" size={32} />
<CryptoIcon type="token" name="usdc" variant="mono" size={24} />

// Network — by id or shortName (case-insensitive)
<CryptoIcon type="network" name="ethereum" variant="branded" size={32} />
<CryptoIcon type="network" name="zkSync" variant="mono" size={32} />
<CryptoIcon type="network" name="arbitrum" size={32} />  {/* alias supported */}
<CryptoIcon type="network" name="bsc" size={32} />       {/* alias supported */}

// Exchange
<CryptoIcon type="exchange" name="binance" variant="background" size={32} />

// Wallet
<CryptoIcon type="wallet" name="metamask" size={32} />

// With fallback
<CryptoIcon type="token" name="UNKNOWN" fallbackSrc="/icons/generic-token.svg" size={32} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `"token" \| "network" \| "exchange" \| "wallet"` | required | Icon category |
| `name` | `string` | required | Symbol / id / shortName / alias (case-insensitive) |
| `variant` | `"branded" \| "mono" \| "background"` | `"branded"` | Icon style |
| `size` | `number \| string` | — | Sets both width & height |
| `fallbackSrc` | `string` | — | Fallback image on 404 |
| `cdnBase` | `string` | jsDelivr URL | Override CDN base |
| `...img` | `ImgHTMLAttributes` | — | All standard `<img>` props |

## Utilities

```ts
import { getCryptoIconUrl, useCryptoIconUrl } from '@gmwalletapp/crypto-icons-react'

// Outside React
const url = getCryptoIconUrl('token', 'ETH', 'mono')

// Inside React component
const url = useCryptoIconUrl('network', 'arbitrum', 'branded')
```

## Network name aliases

Networks support `id`, `shortName`, and common aliases:

| You pass | Resolves to |
|----------|-------------|
| `"ETH"` / `"ethereum"` | `ethereum` |
| `"zkSync"` / `"zksync era"` | `zksync` |
| `"arbitrum"` / `"Arbitrum One"` | `arbitrum-one` |
| `"BSC"` / `"bnb"` | `binance-smart-chain` |
| `"matic"` / `"polygon"` | `polygon` |
| `"avax"` / `"avalanche"` | `avalanche` |
| `"sol"` / `"solana"` | `solana` |

## CDN URL format

```
https://cdn.jsdelivr.net/gh/GMWalletApp/crypto-icons@latest/assets/{category}/{variant}/{name}.svg
```

- tokens → `SYMBOL.svg` (uppercase)
- networks / exchanges / wallets → `kebab-case.svg`
