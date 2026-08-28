import CryptoCard from "./CryptoCard";

function CryptoList({ cryptos }) {
  return (
    <div className="crypto-list">
      {cryptos.map((crypto) => (
        <CryptoCard
          key={crypto.symbol}
          symbol={crypto.symbol}
          price={crypto.price}
        />
      ))}
    </div>
  );
}

export default CryptoList;