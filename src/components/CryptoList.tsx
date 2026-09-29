import { memo } from "react";
import type {
  CryptoListProps,
} from "../types/crypto";

import CryptoCard from "./CryptoCard";

function CryptoList({
  cryptos,
  watchedSymbols,
  onToggleWatchlist,
}: CryptoListProps) {
  return (
    <div className="crypto-list">
      <div className="market-table-header" aria-hidden="true">
        <span>Asset</span>
        <span>Live price</span>
        <span>24h change</span>
        <span>24h high</span>
        <span>24h low</span>
        <span>Volume</span>
        <span>Favorite</span>
      </div>
      {cryptos.map((crypto) => (
        <CryptoCard
          key={crypto.symbol}
          symbol={crypto.symbol}
          name={crypto.name}
          price={crypto.price}
          high={crypto.high}
          low={crypto.low}
          volume={crypto.volume}
          change={crypto.change}
          changePercent={crypto.changePercent}
          isWatched={watchedSymbols.has(
            crypto.symbol
          )}
          onToggleWatchlist={onToggleWatchlist}
        />
      ))}
    </div>
  );
}

export default memo(CryptoList);
