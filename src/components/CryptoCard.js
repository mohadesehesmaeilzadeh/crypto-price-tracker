import { formatPrice } from "../utils/formatPrice";

function CryptoCard({ symbol, name, price }) {
  return (
    <div className="crypto-card">
      <h2>{name}</h2>

      <p>{symbol} / USD</p>

      <strong>
        {formatPrice(price)}
      </strong>
    </div>
  );
}

export default CryptoCard;