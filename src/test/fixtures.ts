import type {
  CryptocurrencySymbol,
  KrakenPair,
  MarketDataUpdate,
  MarketValues,
} from "../types/crypto";

export const MARKET_VALUES_BY_PAIR: Record<
  KrakenPair,
  MarketValues
> = {
  xbtusd: {
    price: "100",
    high: "110",
    low: "90",
    volume: "10",
    change: null,
    changePercent: null,
  },
  ethusd: {
    price: "200",
    high: "210",
    low: "190",
    volume: "20",
    change: null,
    changePercent: null,
  },
  usdtusd: {
    price: "1",
    high: "1.001",
    low: "0.999",
    volume: "1000",
    change: null,
    changePercent: null,
  },
  usdcusd: {
    price: "1",
    high: "1.001",
    low: "0.999",
    volume: "900",
    change: null,
    changePercent: null,
  },
  solusd: {
    price: "300",
    high: "310",
    low: "290",
    volume: "30",
    change: null,
    changePercent: null,
  },
  xrpusd: {
    price: "2",
    high: "2.1",
    low: "1.9",
    volume: "50",
    change: null,
    changePercent: null,
  },
  adausd: {
    price: "400",
    high: "410",
    low: "390",
    volume: "40",
    change: null,
    changePercent: null,
  },
  xdgusd: {
    price: "0.2",
    high: "0.21",
    low: "0.19",
    volume: "60",
    change: null,
    changePercent: null,
  },
  dotusd: {
    price: "5",
    high: "5.2",
    low: "4.8",
    volume: "70",
    change: null,
    changePercent: null,
  },
  linkusd: {
    price: "15",
    high: "16",
    low: "14",
    volume: "80",
    change: null,
    changePercent: null,
  },
  avaxusd: {
    price: "20",
    high: "21",
    low: "19",
    volume: "90",
    change: null,
    changePercent: null,
  },
  ltcusd: {
    price: "80",
    high: "82",
    low: "78",
    volume: "100",
    change: null,
    changePercent: null,
  },
};

export function createMarketUpdate(
  symbol: CryptocurrencySymbol,
  price: number,
  updatedAt = new Date(
    "2026-09-27T12:00:00.000Z"
  )
): MarketDataUpdate {
  return {
    symbol,
    price: String(price),
    high: String(price),
    low: String(price),
    volume: "1",
    change: null,
    changePercent: null,
    updatedAt,
  };
}
