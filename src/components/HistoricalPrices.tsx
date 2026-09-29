import { useState } from "react";

import {
  SUPPORTED_CRYPTOCURRENCIES,
} from "../config/cryptocurrencies";
import { useHistoricalPrices } from "../hooks/useHistoricalPrices";
import type {
  ChartRange,
  CryptocurrencySymbol,
  HistoricalPricesProps,
} from "../types/crypto";
import PriceChart from "./PriceChart";
import AssetIcon from "./AssetIcon";
import { formatPrice } from "../utils/formatPrice";
import { formatNumber } from "../utils/formatNumber";

const CHART_RANGES: readonly ChartRange[] = [
  "24H",
  "7D",
  "30D",
];

function HistoricalPrices({
  marketData,
}: HistoricalPricesProps) {
  const [selectedSymbol, setSelectedSymbol] =
    useState<CryptocurrencySymbol>("BTC");
  const [range, setRange] =
    useState<ChartRange>("24H");
  const selectedCrypto =
    SUPPORTED_CRYPTOCURRENCIES.find(
      ({ symbol }) => symbol === selectedSymbol
    ) ?? SUPPORTED_CRYPTOCURRENCIES[0];
  const { points, status, error, retry } =
    useHistoricalPrices(
      selectedCrypto.pair,
      range
    );
  const selectedMarket = marketData.find(
    ({ symbol }) => symbol === selectedSymbol
  );
  const changeDirection =
    selectedMarket?.changePercent === null ||
    selectedMarket?.changePercent === undefined ||
    selectedMarket.changePercent === 0
      ? "neutral"
      : selectedMarket.changePercent > 0
        ? "positive"
        : "negative";

  return (
    <section
      className="historical-prices"
      aria-labelledby="price-history-heading"
    >
      <div className="chart-header">
        <div className="chart-asset-heading">
          <AssetIcon symbol={selectedCrypto.symbol} size="large" />
          <div>
            <span className="section-kicker">Asset detail</span>
            <h2 id="price-history-heading">
              {selectedCrypto.name}
            </h2>
            <p>
              {selectedCrypto.symbol} / USD · {selectedCrypto.category}
            </p>
          </div>
        </div>

        <div
          className="chart-range-selector"
          role="group"
          aria-label="Historical price range"
        >
          {CHART_RANGES.map((chartRange) => (
            <button
              key={chartRange}
              type="button"
              className={
                range === chartRange
                  ? "chart-control is-active"
                  : "chart-control"
              }
              aria-pressed={range === chartRange}
              onClick={() => setRange(chartRange)}
            >
              {chartRange}
            </button>
          ))}
        </div>
      </div>

      <div className="asset-detail-stats">
        <div className="asset-detail-price">
          <span>Live price</span>
          <strong>
            {selectedMarket
              ? formatPrice(
                  selectedMarket.price,
                  selectedCrypto.category === "Stablecoins"
                )
              : "Unavailable"}
          </strong>
        </div>
        <div>
          <span>24h movement</span>
          <strong className={`market-change market-change--${changeDirection}`}>
            {selectedMarket?.changePercent === null ||
            selectedMarket?.changePercent === undefined
              ? "—"
              : `${selectedMarket.changePercent > 0 ? "+" : ""}${selectedMarket.changePercent.toFixed(2)}%`}
          </strong>
        </div>
        <div>
          <span>24h high</span>
          <strong>
            {selectedMarket
              ? formatPrice(selectedMarket.high)
              : "Unavailable"}
          </strong>
        </div>
        <div>
          <span>24h low</span>
          <strong>
            {selectedMarket
              ? formatPrice(selectedMarket.low)
              : "Unavailable"}
          </strong>
        </div>
        <div>
          <span>24h volume</span>
          <strong>
            {selectedMarket
              ? `${formatNumber(selectedMarket.volume)} ${selectedCrypto.symbol}`
              : "Unavailable"}
          </strong>
        </div>
      </div>

      <div
        className="chart-asset-selector"
        role="group"
        aria-label="Cryptocurrency"
      >
        {SUPPORTED_CRYPTOCURRENCIES.map(
          ({ symbol, name }) => (
            <button
              key={symbol}
              type="button"
              className={
                selectedSymbol === symbol
                  ? "chart-control is-active"
                  : "chart-control"
              }
              aria-label={`${name} (${symbol})`}
              aria-pressed={
                selectedSymbol === symbol
              }
              onClick={() =>
                setSelectedSymbol(symbol)
              }
            >
              {symbol}
            </button>
          )
        )}
      </div>

      <PriceChart
        points={points}
        range={range}
        symbol={selectedCrypto.symbol}
        status={status}
        error={error}
        onRetry={retry}
      />
    </section>
  );
}

export default HistoricalPrices;
