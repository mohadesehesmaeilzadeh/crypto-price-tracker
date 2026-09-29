import type {
  ConnectionStatus,
  PortfolioSummary,
} from "../types/crypto";

interface DashboardSummaryProps {
  trackedAssets: number;
  watchlistCount: number;
  activeAlerts: number;
  portfolio: PortfolioSummary;
  connectionStatus: ConnectionStatus;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function DashboardSummary({
  trackedAssets,
  watchlistCount,
  activeAlerts,
  portfolio,
  connectionStatus,
}: DashboardSummaryProps) {
  const isLive = connectionStatus === "connected";

  return (
    <section
      className="dashboard-summary"
      aria-label="Dashboard summary"
    >
      <div className="summary-stat">
        <span>Tracked assets</span>
        <strong>{trackedAssets}</strong>
        <small>Kraken USD markets</small>
      </div>
      <div className="summary-stat">
        <span>Watchlist</span>
        <strong>{watchlistCount}</strong>
        <small>Saved locally</small>
      </div>
      <div className="summary-stat">
        <span>Active alerts</span>
        <strong>{activeAlerts}</strong>
        <small>Crossing-based triggers</small>
      </div>
      <div className="summary-stat">
        <span>Portfolio value</span>
        <strong>
          {portfolio.totalCurrentValue === null
            ? "Unavailable"
            : formatCurrency(portfolio.totalCurrentValue)}
        </strong>
        <small>Live USD valuation</small>
      </div>
      <div className="summary-stat">
        <span>Market feed</span>
        <strong className={isLive ? "status-live" : "status-offline"}>
          {isLive ? "Live" : "Offline"}
        </strong>
        <small>{connectionStatus}</small>
      </div>
    </section>
  );
}

export default DashboardSummary;
