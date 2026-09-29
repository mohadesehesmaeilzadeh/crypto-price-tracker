import {
  useEffect,
  useState,
} from "react";
import type { FormEvent } from "react";

import {
  SUPPORTED_CRYPTOCURRENCIES,
  isSupportedCryptocurrencySymbol,
} from "../config/cryptocurrencies";
import type {
  CryptocurrencySymbol,
  HoldingInput,
  HoldingValuation,
  PortfolioCalculation,
} from "../types/crypto";

interface PortfolioProps {
  portfolio: PortfolioCalculation;
  onCreate: (input: HoldingInput) => void;
  onUpdate: (
    id: string,
    input: HoldingInput
  ) => void;
  onDelete: (id: string) => void;
}

const DEFAULT_SYMBOL: CryptocurrencySymbol = "BTC";

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatQuantity(value: number): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 8,
  });
}

function formatPercentage(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatProfitLoss(value: number): string {
  const formatted = formatCurrency(value);
  return value > 0 ? `+${formatted}` : formatted;
}

function profitLossClass(value: number | null): string {
  if (value === null || value === 0) {
    return "portfolio-value";
  }

  return value > 0
    ? "portfolio-value is-positive"
    : "portfolio-value is-negative";
}

function HoldingMetrics({
  valuation,
}: {
  valuation: HoldingValuation;
}) {
  const {
    holding,
    currentPrice,
    investedAmount,
    currentValue,
    profitLossAmount,
    profitLossPercentage,
  } = valuation;

  return (
    <dl className="holding-metrics">
      <div>
        <dt>Quantity</dt>
        <dd>{formatQuantity(holding.quantity)}</dd>
      </div>
      <div>
        <dt>Average buy</dt>
        <dd>{formatCurrency(holding.averageBuyPrice)}</dd>
      </div>
      <div>
        <dt>Live price</dt>
        <dd>
          {currentPrice === null
            ? "Unavailable"
            : formatCurrency(currentPrice)}
        </dd>
      </div>
      <div>
        <dt>Invested</dt>
        <dd>{formatCurrency(investedAmount)}</dd>
      </div>
      <div>
        <dt>Current value</dt>
        <dd>
          {currentValue === null
            ? "Unavailable"
            : formatCurrency(currentValue)}
        </dd>
      </div>
      <div>
        <dt>Profit / loss</dt>
        <dd className={profitLossClass(profitLossAmount)}>
          {profitLossAmount === null ||
          profitLossPercentage === null
            ? "Unavailable"
            : `${formatProfitLoss(profitLossAmount)} (${formatPercentage(profitLossPercentage)})`}
        </dd>
      </div>
    </dl>
  );
}

function Portfolio({
  portfolio,
  onCreate,
  onUpdate,
  onDelete,
}: PortfolioProps) {
  const [editingId, setEditingId] = useState<
    string | null
  >(null);
  const [symbol, setSymbol] =
    useState<CryptocurrencySymbol>(DEFAULT_SYMBOL);
  const [quantity, setQuantity] = useState("");
  const [averageBuyPrice, setAverageBuyPrice] =
    useState("");
  const [formError, setFormError] = useState<
    string | null
  >(null);

  const editingValuation = portfolio.holdings.find(
    ({ holding }) => holding.id === editingId
  );

  useEffect(() => {
    if (editingId && !editingValuation) {
      setEditingId(null);
      setSymbol(DEFAULT_SYMBOL);
      setQuantity("");
      setAverageBuyPrice("");
      setFormError(null);
    }
  }, [editingId, editingValuation]);

  const resetForm = (): void => {
    setEditingId(null);
    setSymbol(DEFAULT_SYMBOL);
    setQuantity("");
    setAverageBuyPrice("");
    setFormError(null);
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ): void => {
    event.preventDefault();

    const numericQuantity = Number(quantity);
    const numericAverageBuyPrice = Number(averageBuyPrice);

    if (
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0 ||
      !Number.isFinite(numericAverageBuyPrice) ||
      numericAverageBuyPrice <= 0
    ) {
      setFormError(
        "Quantity and average buy price must be greater than zero."
      );
      return;
    }

    const input: HoldingInput = {
      symbol,
      quantity: numericQuantity,
      averageBuyPrice: numericAverageBuyPrice,
    };

    if (editingValuation) {
      onUpdate(editingValuation.holding.id, input);
    } else {
      onCreate(input);
    }

    resetForm();
  };

  const beginEdit = (
    valuation: HoldingValuation
  ): void => {
    setEditingId(valuation.holding.id);
    setSymbol(valuation.holding.symbol);
    setQuantity(String(valuation.holding.quantity));
    setAverageBuyPrice(
      String(valuation.holding.averageBuyPrice)
    );
    setFormError(null);
  };

  const { summary } = portfolio;

  return (
    <section
      className="portfolio"
      aria-labelledby="portfolio-title"
    >
      <div className="portfolio-header">
        <div>
          <h2 id="portfolio-title">Portfolio</h2>
          <p>
            Track local holdings against live market prices.
          </p>
        </div>
        <span className="holding-count">
          {portfolio.holdings.length}{" "}
          {portfolio.holdings.length === 1
            ? "holding"
            : "holdings"}
        </span>
      </div>

      <div className="portfolio-summary">
        <div role="group" aria-label="Total invested">
          <span>Total invested</span>
          <strong>
            {formatCurrency(summary.totalInvested)}
          </strong>
        </div>
        <div role="group" aria-label="Total current value">
          <span>Total current value</span>
          <strong>
            {summary.totalCurrentValue === null
              ? "Unavailable"
              : formatCurrency(summary.totalCurrentValue)}
          </strong>
        </div>
        <div role="group" aria-label="Total profit or loss">
          <span>Total profit / loss</span>
          <strong
            className={profitLossClass(
              summary.totalProfitLoss
            )}
          >
            {summary.totalProfitLoss === null
              ? "Unavailable"
              : formatProfitLoss(summary.totalProfitLoss)}
          </strong>
        </div>
        <div role="group" aria-label="Profit or loss percentage">
          <span>Return</span>
          <strong
            className={profitLossClass(
              summary.totalProfitLossPercentage
            )}
          >
            {summary.totalProfitLossPercentage === null
              ? "Unavailable"
              : formatPercentage(
                  summary.totalProfitLossPercentage
                )}
          </strong>
        </div>
      </div>

      <form className="holding-form" onSubmit={handleSubmit}>
        <label className="holding-field">
          <span>Asset</span>
          <select
            value={symbol}
            onChange={(event) => {
              if (
                isSupportedCryptocurrencySymbol(
                  event.target.value
                )
              ) {
                setSymbol(event.target.value);
              }
            }}
          >
            {SUPPORTED_CRYPTOCURRENCIES.map((crypto) => (
              <option
                key={crypto.symbol}
                value={crypto.symbol}
              >
                {crypto.name} ({crypto.symbol})
              </option>
            ))}
          </select>
        </label>

        <label className="holding-field">
          <span>Quantity</span>
          <input
            type="number"
            min="0.00000001"
            step="any"
            inputMode="decimal"
            required
            value={quantity}
            placeholder="0.00"
            aria-describedby={
              formError ? "holding-form-error" : undefined
            }
            onChange={(event) => {
              setQuantity(event.target.value);
              setFormError(null);
            }}
          />
        </label>

        <label className="holding-field">
          <span>Average buy price (USD)</span>
          <input
            type="number"
            min="0.00000001"
            step="any"
            inputMode="decimal"
            required
            value={averageBuyPrice}
            placeholder="0.00"
            aria-describedby={
              formError ? "holding-form-error" : undefined
            }
            onChange={(event) => {
              setAverageBuyPrice(event.target.value);
              setFormError(null);
            }}
          />
        </label>

        {formError && (
          <p
            id="holding-form-error"
            className="holding-form-error"
            role="alert"
          >
            {formError}
          </p>
        )}

        <div className="holding-form-actions">
          <button
            type="submit"
            className="portfolio-primary-button"
          >
            {editingValuation
              ? "Save Holding"
              : "Add Holding"}
          </button>
          {editingValuation && (
            <button
              type="button"
              className="portfolio-secondary-button"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {portfolio.holdings.length === 0 ? (
        <div className="portfolio-empty">
          <h3>No holdings yet</h3>
          <p>Add a holding to see its live value.</p>
        </div>
      ) : (
        <ul className="holding-list">
          {portfolio.holdings.map((valuation) => (
            <li
              key={valuation.holding.id}
              className="holding-item"
            >
              <div className="holding-item-header">
                <div>
                  <strong>
                    {valuation.holding.symbol}
                  </strong>
                  <span>
                    {
                      SUPPORTED_CRYPTOCURRENCIES.find(
                        ({ symbol: assetSymbol }) =>
                          assetSymbol ===
                          valuation.holding.symbol
                      )?.name
                    }
                  </span>
                </div>
                <div className="holding-item-actions">
                  <button
                    type="button"
                    className="portfolio-secondary-button"
                    onClick={() => beginEdit(valuation)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="portfolio-delete-button"
                    onClick={() =>
                      onDelete(valuation.holding.id)
                    }
                    aria-label={`Delete ${valuation.holding.symbol} holding`}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <HoldingMetrics valuation={valuation} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default Portfolio;
