import { useEffect, useState } from "react";

import "./App.css";

import { getTicker } from "./services/cryptoApi";
import { formatPrice } from "./utils/formatPrice";

function App() {
  const [bitcoinPrice, setBitcoinPrice] = useState(null);

  useEffect(() => {
    const loadBitcoinPrice = async () => {
      const data = await getTicker("xbtusd");

      const ticker = Object.values(data.result)[0];

      const price = ticker.c[0];

      setBitcoinPrice(price);
    };

    loadBitcoinPrice();
  }, []);

  return (
    <main className="app">
      <h1>Cryptocurrency Price Tracker</h1>

      <p>Live cryptocurrency prices</p>

      <div className="crypto-card">
        <h2>Bitcoin</h2>

        <p>BTC / USD</p>

        <strong>
          {bitcoinPrice
            ? formatPrice(bitcoinPrice)
            : "Loading..."}
        </strong>
      </div>
    </main>
  );
}

export default App;