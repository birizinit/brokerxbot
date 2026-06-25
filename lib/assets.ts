// Ativos operados pelo robô. A escolha é SEMPRE aleatória pelo bot — o usuário
// não seleciona o ativo. Cada operação sorteia um destes.

export interface Asset {
  symbol: string
  name: string
  logo: string
}

export const ASSETS: Asset[] = [
  { symbol: "BTCUSDT", name: "Bitcoin", logo: "/crypto/btc.png" },
  { symbol: "ETHUSDT", name: "Ethereum", logo: "/crypto/eth.png" },
  { symbol: "SOLUSDT", name: "Solana", logo: "/crypto/sol.png" },
  { symbol: "XRPUSDT", name: "XRP", logo: "/crypto/xrp.jpg" },
  { symbol: "BNBUSDT", name: "BNB", logo: "/crypto/bnb.png" },
  { symbol: "ADAUSDT", name: "Cardano", logo: "/crypto/ada.jpg" },
]

const BY_SYMBOL = new Map(ASSETS.map((a) => [a.symbol, a]))

/** Sorteia um ativo aleatório para a próxima operação. */
export function randomAsset(): Asset {
  return ASSETS[Math.floor(Math.random() * ASSETS.length)]
}

/** Busca os dados de um ativo pelo símbolo (fallback seguro). */
export function assetBySymbol(symbol: string): Asset {
  return BY_SYMBOL.get(symbol) ?? { symbol, name: symbol, logo: "" }
}
