import {
  SUPPORTED_CRYPTOCURRENCIES,
} from "../config/cryptocurrencies";
import type {
  CryptocurrencySymbol,
} from "../types/crypto";
import type { CSSProperties } from "react";

interface AssetIconProps {
  symbol: CryptocurrencySymbol;
  size?: "small" | "large";
}

function AssetIcon({
  symbol,
  size = "small",
}: AssetIconProps) {
  const asset = SUPPORTED_CRYPTOCURRENCIES.find(
    (crypto) => crypto.symbol === symbol
  );

  return (
    <span
      className={`asset-icon asset-icon--${size}`}
      style={{
        "--asset-color": asset?.icon?.color ?? "#64748b",
      } as CSSProperties}
      aria-hidden="true"
    >
      {asset?.icon?.label ?? symbol.slice(0, 1)}
    </span>
  );
}

export default AssetIcon;
