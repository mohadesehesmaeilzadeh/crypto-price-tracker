import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ChangeEvent,
} from "react";

import "./App.css";

import ConnectionStatus from "./components/ConnectionStatus";
import AlertToasts from "./components/AlertToasts";
import CryptoList from "./components/CryptoList";
import HistoricalPrices from "./components/HistoricalPrices";
import PriceAlerts from "./components/PriceAlerts";
import Portfolio from "./components/Portfolio";
import SearchBar from "./components/SearchBar";
import DashboardSummary from "./components/DashboardSummary";

import {
  SUPPORTED_CRYPTOCURRENCIES,
} from "./config/cryptocurrencies";
import { getTicker } from "./services/cryptoApi";
import {
  krakenTickerClient,
} from "./services/cryptoWebSocket";
import { useWatchlist } from "./hooks/useWatchlist";
import { usePriceAlerts } from "./hooks/usePriceAlerts";
import { useHoldings } from "./hooks/useHoldings";
import { calculatePortfolio } from "./utils/portfolio";
import type {
  ApiErrorState,
  ApiLoadingState,
  ConnectionStatus as ConnectionStatusType,
  MarketDataUpdate,
  MarketCategoryFilter,
  MarketListView,
  MarketSortDirection,
  MarketSortKey,
  NormalizedMarketData,
} from "./types/crypto";

const MARKET_CATEGORIES: readonly MarketCategoryFilter[] = [
  "All",
  "Major",
  "Stablecoins",
  "Layer 1",
  "DeFi",
  "Meme",
];

const INITIAL_LOADING_STATE: ApiLoadingState = {
  loading: true,
  refreshing: false,
};

function App() {
  const [cryptos, setCryptos] = useState<
    NormalizedMarketData[]
  >([]);
  const [search, setSearch] = useState("");

  const [loadingState, setLoadingState] =
    useState<ApiLoadingState>(
      INITIAL_LOADING_STATE
    );

  const [error, setError] =
    useState<ApiErrorState>(null);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatusType>(
      "connecting"
    );
  const [marketListView, setMarketListView] =
    useState<MarketListView>("all");
  const [marketCategory, setMarketCategory] =
    useState<MarketCategoryFilter>("All");
  const [marketSort, setMarketSort] =
    useState<MarketSortKey>("name");
  const [marketSortDirection, setMarketSortDirection] =
    useState<MarketSortDirection>("asc");
  const {
    symbols: watchedSymbols,
    symbolSet: watchedSymbolSet,
    toggle: toggleWatchlist,
  } = useWatchlist();
  const {
    alerts,
    notifications,
    createAlert,
    updateAlert,
    deleteAlert,
    setAlertEnabled,
    evaluatePriceUpdates,
    dismissNotification,
  } = usePriceAlerts();
  const {
    holdings,
    createHolding,
    updateHolding,
    deleteHolding,
  } = useHoldings();

  const loadCryptoPrices = useCallback(
    async (
      isRefresh: boolean = false
    ): Promise<void> => {
      try {
        setLoadingState((current) => ({
          ...current,
          loading: isRefresh
            ? current.loading
            : true,
          refreshing: isRefresh
            ? true
            : current.refreshing,
        }));

        setError(null);

        const results = await Promise.all(
          SUPPORTED_CRYPTOCURRENCIES.map(
            async (
              crypto
            ): Promise<NormalizedMarketData> => {
              const values = await getTicker(
                crypto.pair
              );

              return {
                symbol: crypto.symbol,
                name: crypto.name,
                ...values,
              };
            }
          )
        );

        setCryptos(results);

        setLastUpdated(new Date());
      } catch (caughtError: unknown) {
        console.error(
          "Failed to fetch crypto prices:",
          caughtError
        );

        setError(
          "Failed to load cryptocurrency prices."
        );
      } finally {
        setLoadingState((current) => ({
          ...current,
          loading: isRefresh
            ? current.loading
            : false,
          refreshing: isRefresh
            ? false
            : current.refreshing,
        }));
      }
    },
    []
  );

  const handleMarketData = useCallback(
    (
      updates: readonly MarketDataUpdate[]
    ): void => {
      evaluatePriceUpdates(updates);

      setCryptos((currentCryptos) => {
        const currentBySymbol = new Map(
          currentCryptos.map((crypto) => [
            crypto.symbol,
            crypto,
          ])
        );
        let changed = false;

        for (const update of updates) {
          const current = currentBySymbol.get(
            update.symbol
          );
          const config =
            SUPPORTED_CRYPTOCURRENCIES.find(
              ({ symbol }) =>
                symbol === update.symbol
            );

          if (!config) {
            continue;
          }

          if (
            current &&
            current.price === update.price &&
            current.high === update.high &&
            current.low === update.low &&
            current.volume === update.volume &&
            current.change === update.change &&
            current.changePercent === update.changePercent
          ) {
            continue;
          }

          currentBySymbol.set(update.symbol, {
            symbol: update.symbol,
            name: config.name,
            price: update.price,
            high: update.high,
            low: update.low,
            volume: update.volume,
            change: update.change,
            changePercent: update.changePercent,
          });
          changed = true;
        }

        if (!changed) {
          return currentCryptos;
        }

        return SUPPORTED_CRYPTOCURRENCIES.flatMap(
          ({ symbol }) => {
            const crypto =
              currentBySymbol.get(symbol);

            return crypto ? [crypto] : [];
          }
        );
      });

      const latestUpdate = updates.reduce(
        (latest, update) =>
          update.updatedAt > latest
            ? update.updatedAt
            : latest,
        updates[0]?.updatedAt ?? new Date()
      );

      setLastUpdated(latestUpdate);
      setError(null);
      setLoadingState((current) => ({
        ...current,
        loading: false,
      }));
    },
    [evaluatePriceUpdates]
  );

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | null = null;

    void loadCryptoPrices().finally(() => {
      if (disposed) {
        return;
      }

      unsubscribe = krakenTickerClient.subscribe({
        onStatusChange: setConnectionStatus,
        onMarketData: handleMarketData,
      });
    });

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [handleMarketData, loadCryptoPrices]);

  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSearch(event.target.value);
  };

  const normalizedSearch = search
    .trim()
    .toLowerCase();

  const filteredCryptos = useMemo(
    () =>
      cryptos.filter((crypto) => {
        const cryptoName =
          crypto.name.toLowerCase();

        const cryptoSymbol =
          crypto.symbol.toLowerCase();

        const matchesSearch =
          cryptoName.includes(
            normalizedSearch
          ) ||
          cryptoSymbol.includes(
            normalizedSearch
          );
        const matchesView =
          marketListView === "all" ||
          watchedSymbolSet.has(crypto.symbol);
        const metadata =
          SUPPORTED_CRYPTOCURRENCIES.find(
            ({ symbol }) => symbol === crypto.symbol
          );
        const matchesCategory =
          marketCategory === "All" ||
          metadata?.category === marketCategory;

        return matchesSearch && matchesView && matchesCategory;
      }).sort((first, second) => {
        let comparison = 0;

        if (marketSort === "name") {
          comparison = first.name.localeCompare(second.name);
        } else if (marketSort === "price") {
          comparison = Number(first.price) - Number(second.price);
        } else if (marketSort === "volume") {
          comparison = Number(first.volume) - Number(second.volume);
        } else {
          const firstChange = first.changePercent;
          const secondChange = second.changePercent;

          if (firstChange === null && secondChange === null) {
            comparison = 0;
          } else if (firstChange === null) {
            return 1;
          } else if (secondChange === null) {
            return -1;
          } else {
            comparison = firstChange - secondChange;
          }
        }

        return marketSortDirection === "asc"
          ? comparison
          : -comparison;
      }),
    [
      cryptos,
      marketListView,
      marketCategory,
      marketSort,
      marketSortDirection,
      normalizedSearch,
      watchedSymbolSet,
    ]
  );
  const portfolio = useMemo(
    () => calculatePortfolio(holdings, cryptos),
    [cryptos, holdings]
  );

  if (loadingState.loading) {
    return (
      <main className="app app-loading" aria-busy="true">
        <header className="app-header">
          <span className="app-eyebrow">Live crypto intelligence</span>
          <h1>
            Preparing your market overview
          </h1>

          <p role="status">
            Loading cryptocurrency data...
          </p>
        </header>
        <div className="dashboard-skeleton" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
      </main>
    );
  }

  if (error && cryptos.length === 0) {
    return (
      <main className="app">
        <header className="app-header">
          <h1>
            Cryptocurrency Price Tracker
          </h1>

          <p className="error-message" role="alert">
            {error}
          </p>

          <button
            type="button"
            className="refresh-button"
            onClick={() =>
              void loadCryptoPrices(false)
            }
          >
            Try Again
          </button>
        </header>
      </main>
    );
  }

  return (
    <main className="app" id="top">
      <AlertToasts
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      <header className="app-header">
        <div className="app-topbar">
          <a className="app-brand" href="#top">
            <span aria-hidden="true">K</span>
            <strong>Kraken Market</strong>
          </a>
          <nav className="app-navigation" aria-label="Dashboard">
            <a
              href="#market"
              onClick={() => setMarketListView("watchlist")}
            >
              Watchlist
            </a>
            <a href="#alerts">Alerts</a>
            <a href="#portfolio">Portfolio</a>
          </nav>
          <ConnectionStatus status={connectionStatus} />
        </div>
        <div className="dashboard-intro">
          <span className="app-eyebrow">Live crypto intelligence</span>
          <h1>Market overview</h1>
          <p>
            Follow real-time Kraken prices, manage targets,
            and value your holdings from one focused dashboard.
          </p>
        </div>
        <SearchBar
          value={search}
          onChange={handleSearchChange}
        />
      </header>

      <div className="refresh-section">
        <div className="update-info">
          {lastUpdated && (
            <p className="last-updated">
              Last updated:{" "}
              {lastUpdated.toLocaleTimeString()}
            </p>
          )}

        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={() =>
            void loadCryptoPrices(true)
          }
          disabled={loadingState.refreshing}
        >
          {loadingState.refreshing
            ? "Refreshing..."
            : "Refresh Prices"}
        </button>
      </div>

      {error && (
        <p className="refresh-error" role="alert">
          {error}
        </p>
      )}

      <DashboardSummary
        trackedAssets={cryptos.length}
        watchlistCount={watchedSymbols.length}
        activeAlerts={alerts.filter(({ enabled }) => enabled).length}
        portfolio={portfolio.summary}
        connectionStatus={connectionStatus}
      />

      <HistoricalPrices marketData={cryptos} />

      <div id="portfolio" className="section-anchor">
      <Portfolio
        portfolio={portfolio}
        onCreate={createHolding}
        onUpdate={updateHolding}
        onDelete={deleteHolding}
      />
      </div>

      <div id="alerts" className="section-anchor">
      <PriceAlerts
        alerts={alerts}
        onCreate={createAlert}
        onUpdate={updateAlert}
        onDelete={deleteAlert}
        onSetEnabled={setAlertEnabled}
      />
      </div>

      <section id="market" className="market-section" aria-labelledby="market-heading">
      <div className="market-list-toolbar">
        <div>
          <span className="section-kicker">Real-time prices</span>
          <h2 id="market-heading">Market</h2>
        </div>

        <div
          className="market-view-selector"
          role="group"
          aria-label="Market list view"
        >
          <button
            type="button"
            className={
              marketListView === "all"
                ? "market-view-button is-active"
                : "market-view-button"
            }
            aria-pressed={marketListView === "all"}
            onClick={() => setMarketListView("all")}
          >
            All Assets
          </button>
          <button
            type="button"
            className={
              marketListView === "watchlist"
                ? "market-view-button is-active"
                : "market-view-button"
            }
            aria-pressed={
              marketListView === "watchlist"
            }
            onClick={() =>
              setMarketListView("watchlist")
            }
          >
            Watchlist ({watchedSymbols.length})
          </button>
        </div>
      </div>

      <div className="market-tools">
        <div className="category-filters" role="group" aria-label="Asset category">
          {MARKET_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={
                marketCategory === category
                  ? "category-filter is-active"
                  : "category-filter"
              }
              aria-pressed={marketCategory === category}
              onClick={() => setMarketCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="sort-controls">
          <label htmlFor="market-sort">Sort by</label>
          <select
            id="market-sort"
            value={marketSort}
            onChange={(event) =>
              setMarketSort(event.target.value as MarketSortKey)
            }
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="change">24h change</option>
            <option value="volume">Volume</option>
          </select>
          <button
            type="button"
            className="sort-direction"
            aria-label={`Sort ${marketSortDirection === "asc" ? "descending" : "ascending"}`}
            onClick={() =>
              setMarketSortDirection((current) =>
                current === "asc" ? "desc" : "asc"
              )
            }
          >
            {marketSortDirection === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {filteredCryptos.length === 0 ? (
        marketListView === "watchlist" &&
        watchedSymbols.length === 0 ? (
          <div className="watchlist-empty" role="status">
            <h3>Your watchlist is empty</h3>
            <p>
              Add cryptocurrencies using the star
              button on any market card.
            </p>
            <button
              type="button"
              className="market-view-button"
              onClick={() => setMarketListView("all")}
            >
              Browse All Assets
            </button>
          </div>
        ) : (
          <p className="no-results" role="status">
            {marketListView === "watchlist"
              ? "No watched cryptocurrencies match your search."
              : "No cryptocurrencies found."}
          </p>
        )
      ) : (
        <CryptoList
          cryptos={filteredCryptos}
          watchedSymbols={watchedSymbolSet}
          onToggleWatchlist={toggleWatchlist}
        />
      )}
      </section>
    </main>
  );
}

export default App;
