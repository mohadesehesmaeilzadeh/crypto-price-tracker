import {
  formatPrice,
} from "../utils/formatPrice";

import {
  formatNumber,
} from "../utils/formatNumber";

function CryptoCard({
  symbol,
  name,
  price,
  high,
  low,
  volume,
}) {
  return (
    <div className="crypto-card">
      <div className="crypto-card-header">
        <div>
          <h2>{name}</h2>

          <p>{symbol} / USD</p>
        </div>

        <strong className="crypto-price">
          {formatPrice(price)}
        </strong>
      </div>

      <div className="crypto-details">
        <p>
          <span>24h High</span>

          <strong>
            {formatPrice(high)}
          </strong>
        </p>

        <p>
          <span>24h Low</span>

          <strong>
            {formatPrice(low)}
          </strong>
        </p>

        <p>
          <span>24h Volume</span>

          <strong>
            {formatNumber(volume)} {symbol}
          </strong>
        </p>
      </div>
    </div>
  );
}

export default CryptoCard;