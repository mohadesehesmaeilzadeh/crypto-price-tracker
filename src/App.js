import { useEffect, useState } from "react";

import "./App.css";

import { getTicker } from "./services/cryptoApi";
import CryptoList from "./components/CryptoList";
import SearchBar from "./components/SearchBar";

const cryptoPairs = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    pair: "xbtusd",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    pair: "ethusd",
  },
  {
    symbol: "SOL",
    name: "Solana",
    pair: "solusd",
  },
  {
    symbol: "ADA",
    name: "Cardano",
    pair: "adausd",
  },
];

function App() {
  const [cryptos, setCryptos] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCryptoPrices = async () => {
      try {
        setLoading(true);
        setError("");

        const results = await Promise.all(
          cryptoPairs.map(async (crypto) => {
            const data = await getTicker(crypto.pair);

            const ticker = Object.values(data.result)[0];

            return {
              symbol: crypto.symbol,
              name: crypto.name,
              price: ticker.c[0],
            };
          }),
        );

        setCryptos(results);
      } catch (error) {
        setError("Failed to load cryptocurrency prices.");
      } finally {
        setLoading(false);
      }
    };

    loadCryptoPrices();
  }, []);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const normalizedSearch = search.trim().toLowerCase();

  const filteredCryptos = cryptos.filter((crypto) => {
    return (
      crypto.name.toLowerCase().includes(normalizedSearch) ||
      crypto.symbol.toLowerCase().includes(normalizedSearch)
    );
  });

  if (loading) {
    return (
      <main className="app">
        <h1>Cryptocurrency Price Tracker</h1>

        <p>Loading cryptocurrency data...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app">
        <h1>Cryptocurrency Price Tracker</h1>

        <p className="error-message">{error}</p>
      </main>
    );
  }

  return (
    <main className="app">
      <h1>Cryptocurrency Price Tracker</h1>
      <p>Live cryptocurrency prices</p>
      <SearchBar value={search} onChange={handleSearchChange} />
      {filteredCryptos.length === 0 ? (
        <p className="no-results">No cryptocurrencies found.</p>
      ) : (
        <CryptoList cryptos={filteredCryptos} />
      )}{" "}
    </main>
  );
}

export default App;
