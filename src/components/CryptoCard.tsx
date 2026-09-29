import { memo } from "react";
import type {
  CryptoCardProps,
} from "../types/crypto";

import {
  formatPrice,
} from "../utils/formatPrice";

import {
  formatNumber,
} from "../utils/formatNumber";
import {
  SUPPORTED_CRYPTOCURRENCIES,
} from "../config/cryptocurrencies";
import AssetIcon from "./AssetIcon";

function CryptoCard({
  symbol,
  name,
  price,
  high,
  low,
  volume,
  change,
  changePercent,
  isWatched,
  onToggleWatchlist,
}: CryptoCardProps) {
  const metadata = SUPPORTED_CRYPTOCURRENCIES.find(
    (asset) => asset.symbol === symbol
  );
  const changeDirection =
    changePercent === null || changePercent === 0
      ? "neutral"
      : changePercent > 0
        ? "positive"
        : "negative";
  const formattedChange =
    changePercent === null
      ? "—"
      : `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`;

  return (
    <article
      className="crypto-card"
      aria-labelledby={`crypto-card-${symbol}`}
    >
      <div className="market-asset-cell">
        <AssetIcon symbol={symbol} />
        <div>
          <h3 id={`crypto-card-${symbol}`}>{name}</h3>
          <p>
            {symbol}
            <span className="asset-category">
              {metadata?.category}
            </span>
          </p>
        </div>
      </div>

      <div className="market-data-cell market-price-cell">
        <span className="market-cell-label">Price</span>
        <strong className="crypto-price">
          {formatPrice(price, metadata?.category === "Stablecoins")}
        </strong>
      </div>

      <div className="market-data-cell">
        <span className="market-cell-label">24h change</span>
        <strong className={`market-change market-change--${changeDirection}`}>
          <span aria-hidden="true">
            {changeDirection === "positive"
              ? "↑"
              : changeDirection === "negative"
                ? "↓"
                : "•"}
          </span>{" "}
          {formattedChange}
        </strong>
        {change !== null && (
          <small>{formatPrice(change)}</small>
        )}
      </div>

      <div className="market-data-cell">
        <span className="market-cell-label">24h high</span>
        <strong>{formatPrice(high)}</strong>
      </div>

      <div className="market-data-cell">
        <span className="market-cell-label">24h low</span>
        <strong>{formatPrice(low)}</strong>
      </div>

      <div className="market-data-cell">
        <span className="market-cell-label">24h volume</span>
        <strong>{formatNumber(volume)} {symbol}</strong>
      </div>

      <div className="market-watch-cell">
        <button
          type="button"
          className={
            isWatched
              ? "watchlist-button is-watched"
              : "watchlist-button"
          }
          aria-label={
            isWatched
              ? `Remove ${name} from watchlist`
              : `Add ${name} to watchlist`
          }
          aria-pressed={isWatched}
          title={
            isWatched
              ? "Remove from watchlist"
              : "Add to watchlist"
          }
          onClick={() => onToggleWatchlist(symbol)}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            aria-hidden="true"
          >
            <path d="m12 2.75 2.86 5.8 6.4.93-4.63 4.51 1.09 6.38L12 17.36l-5.72 3.01 1.09-6.38-4.63-4.51 6.4-.93L12 2.75Z" />
          </svg>
        </button>
      </div>
    </article>
  );
}

export default memo(CryptoCard);
