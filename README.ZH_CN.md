<div align="center">

# 🪙 crypto-icons

**2,100+ 加密货币图标 — 代币、网络、交易所 & 钱包**

SVG · 4 分类 · 3 风格 · CDN 直用 · npm 包

[![GitHub release](https://img.shields.io/github/v/release/GMWalletApp/crypto-icons?style=flat-square)](https://github.com/GMWalletApp/crypto-icons/releases)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

[English](./README.md)

</div>

---

## 图标分类

| 分类 | 数量 | 风格 |
|------|-----:|------|
| tokens（代币） | 1,842 | branded · mono · background |
| networks（网络） | 242 | branded · mono · background |
| exchanges（交易所） | 28 | branded · mono · background |
| wallets（钱包） | 52 | branded · mono · background |

图标数据来源于 [web3icons](https://github.com/0xa3k5/web3icons)，每日自动同步，支持自定义覆盖。

---

## CDN 直接使用（无需安装）

```
https://cdn.jsdmirror.com/gh/GMWalletApp/crypto-icons@main/assets/{category}/{variant}/{name}.svg
```

**参数说明：**
- `category` — `tokens` · `networks` · `exchanges` · `wallets`
- `variant` — `branded` · `mono` · `background`
- `name` — 小写图标名（如 `eth`、`bitcoin`、`metamask`）

**示例：**
```
https://cdn.jsdmirror.com/gh/GMWalletApp/crypto-icons@main/assets/tokens/branded/eth.svg
https://cdn.jsdmirror.com/gh/GMWalletApp/crypto-icons@main/assets/networks/mono/binance-smart-chain.svg
https://cdn.jsdmirror.com/gh/GMWalletApp/crypto-icons@main/assets/wallets/branded/metamask.svg
```

**镜像 CDN（npm 包内自动按序回退）：**
```
https://cdn.jsdmirror.com/gh/GMWalletApp/crypto-icons@main/...   （国内优先）
https://cdn.jsdelivr.net/gh/GMWalletApp/crypto-icons@main/...
https://fastly.jsdelivr.net/gh/GMWalletApp/crypto-icons@main/...
https://gcore.jsdelivr.net/gh/GMWalletApp/crypto-icons@main/...
```

---

## npm 包

### 安装

```bash
bun add @gmwalletapp/crypto-icons
# 或
bun add @gmwalletapp/crypto-icons-react
```

> **注意：** 发布于 GitHub Packages，需在 `.npmrc` 中配置：
> ```
> @gmwalletapp:registry=https://npm.pkg.github.com
> ```

---

### `@gmwalletapp/crypto-icons`（core）

框架无关的 URL 构建器，支持多 CDN 自动回退。

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

- 名称不区分大小写
- 自动从 CDN 加载别名表并解析（如 `bsc` → `binance-smart-chain`）

#### `loadIcon(category, name, options?)` — async，带 CDN 回退

```ts
import { loadIcon } from '@gmwalletapp/crypto-icons'

const { url } = await loadIcon('token', 'eth')
// 按顺序尝试各 CDN，返回第一个 200 OK 的 URL
```

#### `getIconColor(category, name)` — async

从 CDN 颜色数据中获取图标的主色调 RGB 值。

```ts
import { getIconColor } from '@gmwalletapp/crypto-icons'

const color = await getIconColor('token', 'eth')
// → { r: 138, g: 155, b: 226 }

const color2 = await getIconColor('network', 'bsc')
// → { r: 243, g: 186, b: 47 }
```

图标无颜色数据时返回 `null`。

#### `CDN_LIST`

```ts
import { CDN_LIST } from '@gmwalletapp/crypto-icons'
// 按回退顺序排列的 { name, base } 数组
```

---

### `@gmwalletapp/crypto-icons-react`

轻量 React 封装。

#### `<CryptoIcon>`

```tsx
import { CryptoIcon } from '@gmwalletapp/crypto-icons-react'

<CryptoIcon type="token"    name="ETH"      size={32} />
<CryptoIcon type="network"  name="bsc"      variant="mono" size={24} />
<CryptoIcon type="exchange" name="binance"  variant="background" />
<CryptoIcon type="wallet"   name="metamask" size={40} />
```

**Props：**

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `"token" \| "network" \| "exchange" \| "wallet"` | 必填 | 图标分类 |
| `name` | `string` | 必填 | 图标名称（不区分大小写） |
| `variant` | `"branded" \| "mono" \| "background"` | `"branded"` | 图标风格 |
| `size` | `number \| string` | — | 同时设置宽高 |
| ...img props | | | 所有原生 `<img>` 属性 |

#### `getCryptoIconUrl` / `useCryptoIconUrl`

```ts
import { getCryptoIconUrl, useCryptoIconUrl } from '@gmwalletapp/crypto-icons-react'

// React 组件外（async）
const url = await getCryptoIconUrl('token', 'eth', { variant: 'mono' })

// React Hook（异步解析，未完成时返回 undefined）
const url = useCryptoIconUrl('network', 'ethereum')
```

---

## 别名

别名配置位于 `aliases/`，运行时从 CDN 动态加载：

- `aliases/networks.json` — 如 `bsc` / `bnb` → `binance-smart-chain`，`arc-testnet` → `arc`
- `aliases/tokens.json`
- `aliases/exchanges.json`
- `aliases/wallets.json`

新增别名：编辑对应文件后提交即可。

---

## 自定义图标

将 SVG 文件放入 `assets/{category}/{variant}/{name}.svg`，并在 `custom/{category}.json` 中添加条目：

```json
[{ "id": "okpay", "name": "OKPay", "variants": ["branded", "mono", "background"] }]
```

自定义图标在每日同步中会被保留。

---

## 图标索引（Maps）

`maps/*.json` — 每个分类的完整图标列表，每次同步后自动重新生成：

```ts
import tokens from 'https://cdn.jsdmirror.com/gh/GMWalletApp/crypto-icons@main/maps/tokens.json'
```

---

## 颜色数据（Colors）

`colors/*.json` — 每个图标的主色调 RGB 值，供 `getIconColor()` 使用：

```
colors/tokens.json
colors/networks.json
colors/exchanges.json
colors/wallets.json
```

格式：`{ "eth": { "r": 138, "g": 155, "b": 226 }, ... }`

---

## 开源协议

MIT © GMWalletApp
