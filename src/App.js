import { useEffect, useState } from "react";

import "./App.css";

import { getTicker } from "./services/cryptoApi";
import { formatPrice } from "./utils/formatPrice";

function App() {
  const [bitcoinPrice, setBitcoinPrice] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBitcoinPrice = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getTicker("xbtusd");

        const ticker = Object.values(data.result)[0];

        const price = ticker.c[0];

        setBitcoinPrice(price);
      } catch (error) {
        setError("Failed to load Bitcoin price.");
      } finally {
        setLoading(false);
      }
    };

    loadBitcoinPrice();
  }, []);

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

        <p className="error-message">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="app">
      <h1>Cryptocurrency Price Tracker</h1>

      <p>Live cryptocurrency prices</p>

      <div className="crypto-card">
        <h2>Bitcoin</h2>

        <p>BTC / USD</p>

        <strong>
          {formatPrice(bitcoinPrice)}
        </strong>
      </div>
    </main>
  );
}

export default App;