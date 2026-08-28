import {
  useCallback,
  useEffect,
  useState,
} from "react";

import "./App.css";

import CryptoList from "./components/CryptoList";
import SearchBar from "./components/SearchBar";

import { getTicker } from "./services/cryptoApi";

const AUTO_REFRESH_INTERVAL = 30000;

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

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const loadCryptoPrices = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const results = await Promise.all(
          cryptoPairs.map(async (crypto) => {
            const data = await getTicker(
              crypto.pair
            );

            const ticker = Object.values(
              data.result
            )[0];

            return {
              symbol: crypto.symbol,
              name: crypto.name,
              price: ticker.c[0],
              high: ticker.h[1],
              low: ticker.l[1],
              volume: ticker.v[1],
            };
          })
        );

        setCryptos(results);

        setLastUpdated(new Date());
      } catch (error) {
        console.error(
          "Failed to fetch crypto prices:",
          error
        );

        setError(
          "Failed to load cryptocurrency prices."
        );
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadCryptoPrices();

    const intervalId = setInterval(() => {
      loadCryptoPrices(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [loadCryptoPrices]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const normalizedSearch = search
    .trim()
    .toLowerCase();

  const filteredCryptos = cryptos.filter(
    (crypto) => {
      const cryptoName =
        crypto.name.toLowerCase();

      const cryptoSymbol =
        crypto.symbol.toLowerCase();

      return (
        cryptoName.includes(normalizedSearch) ||
        cryptoSymbol.includes(normalizedSearch)
      );
    }
  );

  if (loading) {
    return (
      <main className="app">
        <div className="app-header">
          <h1>
            Cryptocurrency Price Tracker
          </h1>

          <p>
            Loading cryptocurrency data...
          </p>
        </div>
      </main>
    );
  }

  if (error && cryptos.length === 0) {
    return (
      <main className="app">
        <div className="app-header">
          <h1>
            Cryptocurrency Price Tracker
          </h1>

          <p className="error-message">
            {error}
          </p>

          <button
            type="button"
            className="refresh-button"
            onClick={() =>
              loadCryptoPrices(false)
            }
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="app">
      <div className="app-header">
        <h1>
          Cryptocurrency Price Tracker
        </h1>

        <p>
          Track live cryptocurrency market
          prices.
        </p>
      </div>

      <SearchBar
        value={search}
        onChange={handleSearchChange}
      />

      <div className="refresh-section">
        <div className="update-info">
          {lastUpdated && (
            <p className="last-updated">
              Last updated:{" "}
              {lastUpdated.toLocaleTimeString()}
            </p>
          )}

          <p className="auto-refresh-info">
            Auto-refreshes every 30 seconds
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={() =>
            loadCryptoPrices(true)
          }
          disabled={refreshing}
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh Prices"}
        </button>
      </div>

      {error && (
        <p className="refresh-error">
          {error}
        </p>
      )}

      {filteredCryptos.length === 0 ? (
        <p className="no-results">
          No cryptocurrencies found.
        </p>
      ) : (
        <CryptoList
          cryptos={filteredCryptos}
        />
      )}
    </main>
  );
}

export default App;