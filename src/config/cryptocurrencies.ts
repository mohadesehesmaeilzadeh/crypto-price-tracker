import type {
  CryptocurrencySymbol,
  CryptocurrencyIdentifier,
  KrakenWebSocketSymbol,
} from "../types/crypto";

export const SUPPORTED_CRYPTOCURRENCIES = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    pair: "xbtusd",
    webSocketSymbol: "BTC/USD",
    category: "Major",
    icon: { label: "₿", color: "#f59e0b" },
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    pair: "ethusd",
    webSocketSymbol: "ETH/USD",
    category: "Major",
    icon: { label: "Ξ", color: "#627eea" },
  },
  {
    symbol: "USDT",
    name: "Tether",
    pair: "usdtusd",
    webSocketSymbol: "USDT/USD",
    category: "Stablecoins",
    icon: { label: "T", color: "#26a17b" },
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    pair: "usdcusd",
    webSocketSymbol: "USDC/USD",
    category: "Stablecoins",
    icon: { label: "$", color: "#2775ca" },
  },
  {
    symbol: "SOL",
    name: "Solana",
    pair: "solusd",
    webSocketSymbol: "SOL/USD",
    category: "Layer 1",
    icon: { label: "S", color: "#14f195" },
  },
  {
    symbol: "XRP",
    name: "XRP",
    pair: "xrpusd",
    webSocketSymbol: "XRP/USD",
    category: "Major",
    icon: { label: "X", color: "#64748b" },
  },
  {
    symbol: "ADA",
    name: "Cardano",
    pair: "adausd",
    webSocketSymbol: "ADA/USD",
    category: "Layer 1",
    icon: { label: "A", color: "#3468d4" },
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    pair: "xdgusd",
    webSocketSymbol: "DOGE/USD",
    category: "Meme",
    icon: { label: "Ð", color: "#c2a633" },
  },
  {
    symbol: "DOT",
    name: "Polkadot",
    pair: "dotusd",
    webSocketSymbol: "DOT/USD",
    category: "Layer 1",
    icon: { label: "D", color: "#e6007a" },
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    pair: "linkusd",
    webSocketSymbol: "LINK/USD",
    category: "DeFi",
    icon: { label: "L", color: "#375bd2" },
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    pair: "avaxusd",
    webSocketSymbol: "AVAX/USD",
    category: "Layer 1",
    icon: { label: "A", color: "#e84142" },
  },
  {
    symbol: "LTC",
    name: "Litecoin",
    pair: "ltcusd",
    webSocketSymbol: "LTC/USD",
    category: "Major",
    icon: { label: "Ł", color: "#8c8c8c" },
  },
] as const satisfies readonly CryptocurrencyIdentifier[];

export const KRAKEN_WEBSOCKET_SYMBOLS:
readonly KrakenWebSocketSymbol[] =
  SUPPORTED_CRYPTOCURRENCIES.map(
    ({ webSocketSymbol }) => webSocketSymbol
  );

export function findCryptocurrencyByWebSocketSymbol(
  webSocketSymbol: string
): CryptocurrencyIdentifier | undefined {
  return SUPPORTED_CRYPTOCURRENCIES.find(
    (crypto) =>
      crypto.webSocketSymbol === webSocketSymbol
  );
}

export function isSupportedCryptocurrencySymbol(
  value: unknown
): value is CryptocurrencySymbol {
  return (
    typeof value === "string" &&
    SUPPORTED_CRYPTOCURRENCIES.some(
      ({ symbol }) => symbol === value
    )
  );
}
