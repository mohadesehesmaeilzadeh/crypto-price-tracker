function CryptoCard({ symbol, price }) {
  return (
    <div className="crypto-card">
      <h2>{symbol}</h2>

      <p>{price}</p>
    </div>
  );
}

export default CryptoCard;