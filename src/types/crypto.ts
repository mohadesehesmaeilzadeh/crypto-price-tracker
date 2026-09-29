import type { ChangeEventHandler } from "react";

export type CryptocurrencySymbol =
  | "BTC"
  | "ETH"
  | "USDT"
  | "USDC"
  | "SOL"
  | "XRP"
  | "ADA"
  | "DOGE"
  | "DOT"
  | "LINK"
  | "AVAX"
  | "LTC";

export type KrakenPair =
  | "xbtusd"
  | "ethusd"
  | "usdtusd"
  | "usdcusd"
  | "solusd"
  | "xrpusd"
  | "adausd"
  | "xdgusd"
  | "dotusd"
  | "linkusd"
  | "avaxusd"
  | "ltcusd";

export type KrakenWebSocketSymbol =
  | "BTC/USD"
  | "ETH/USD"
  | "USDT/USD"
  | "USDC/USD"
  | "SOL/USD"
  | "XRP/USD"
  | "ADA/USD"
  | "DOGE/USD"
  | "DOT/USD"
  | "LINK/USD"
  | "AVAX/USD"
  | "LTC/USD";

export type CryptocurrencyCategory =
  | "Major"
  | "Stablecoins"
  | "Layer 1"
  | "DeFi"
  | "Meme";

export type MarketCategoryFilter =
  | "All"
  | CryptocurrencyCategory;

export type MarketSortKey =
  | "name"
  | "price"
  | "change"
  | "volume";

export type MarketSortDirection = "asc" | "desc";

export interface CryptocurrencyIconMetadata {
  label: string;
  color: string;
}

export interface CryptocurrencyIdentifier {
  symbol: CryptocurrencySymbol;
  name: string;
  pair: KrakenPair;
  webSocketSymbol: KrakenWebSocketSymbol;
  category: CryptocurrencyCategory;
  icon?: CryptocurrencyIconMetadata;
}

export type PriceValue = string;
export type VolumeValue = string;

export interface MarketValues {
  price: PriceValue;
  high: PriceValue;
  low: PriceValue;
  volume: VolumeValue;
  change: PriceValue | null;
  changePercent: number | null;
}

export interface NormalizedMarketData
  extends MarketValues {
  symbol: CryptocurrencySymbol;
  name: string;
}

export interface MarketDataUpdate
  extends MarketValues {
  symbol: CryptocurrencySymbol;
  updatedAt: Date;
}

export interface WatchlistCardProps {
  isWatched: boolean;
  onToggleWatchlist: (
    symbol: CryptocurrencySymbol
  ) => void;
}

export type CryptoCardProps =
  NormalizedMarketData & WatchlistCardProps;

export interface CryptoListProps {
  cryptos: readonly NormalizedMarketData[];
  watchedSymbols: ReadonlySet<CryptocurrencySymbol>;
  onToggleWatchlist: (
    symbol: CryptocurrencySymbol
  ) => void;
}

export interface HistoricalPricesProps {
  marketData: readonly NormalizedMarketData[];
}

export interface SearchBarProps {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
}

export interface ApiLoadingState {
  loading: boolean;
  refreshing: boolean;
}

export type ApiErrorState = string | null;

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

export interface ConnectionStatusProps {
  status: ConnectionStatus;
}

export type ChartRange = "24H" | "7D" | "30D";

export interface ChartPoint {
  timestamp: number;
  price: number;
}

export type HistoricalDataStatus =
  | "loading"
  | "success"
  | "error"
  | "empty";

export interface PriceChartProps {
  points: readonly ChartPoint[];
  range: ChartRange;
  symbol: CryptocurrencySymbol;
  status: HistoricalDataStatus;
  error: string | null;
  onRetry: () => void;
}

export type MarketListView = "all" | "watchlist";

export type AlertCondition = "above" | "below";

export interface PriceAlert {
  id: string;
  symbol: CryptocurrencySymbol;
  condition: AlertCondition;
  targetPrice: number;
  enabled: boolean;
}

export type PriceAlertInput = Omit<PriceAlert, "id">;

export interface AlertNotification {
  id: string;
  alertId: string;
  symbol: CryptocurrencySymbol;
  condition: AlertCondition;
  targetPrice: number;
  currentPrice: number;
}

export interface Holding {
  id: string;
  symbol: CryptocurrencySymbol;
  quantity: number;
  averageBuyPrice: number;
}

export type HoldingInput = Omit<Holding, "id">;

export interface HoldingValuation {
  holding: Holding;
  currentPrice: number | null;
  investedAmount: number;
  currentValue: number | null;
  profitLossAmount: number | null;
  profitLossPercentage: number | null;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number | null;
  totalProfitLoss: number | null;
  totalProfitLossPercentage: number | null;
}

export interface PortfolioCalculation {
  holdings: readonly HoldingValuation[];
  summary: PortfolioSummary;
}
