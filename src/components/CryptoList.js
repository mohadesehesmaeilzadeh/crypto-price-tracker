import CryptoCard from "./CryptoCard";

function CryptoList({ cryptos }) {
  return (
    <div className="crypto-list">
      {cryptos.map((crypto) => (
        <CryptoCard
          key={crypto.symbol}
          symbol={crypto.symbol}
          name={crypto.name}
          price={crypto.price}
          high={crypto.high}
          low={crypto.low}
          volume={crypto.volume}
        />
      ))}
    </div>
  );
}

export default CryptoList;