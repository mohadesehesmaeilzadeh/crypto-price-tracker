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
  AlertCondition,
  CryptocurrencySymbol,
  PriceAlert,
  PriceAlertInput,
} from "../types/crypto";

interface PriceAlertsProps {
  alerts: readonly PriceAlert[];
  onCreate: (input: PriceAlertInput) => void;
  onUpdate: (
    id: string,
    input: PriceAlertInput
  ) => void;
  onDelete: (id: string) => void;
  onSetEnabled: (id: string, enabled: boolean) => void;
}

const DEFAULT_SYMBOL: CryptocurrencySymbol = "BTC";

function formatPrice(price: number): string {
  return price.toLocaleString(undefined, {
    maximumFractionDigits: 8,
  });
}

function PriceAlerts({
  alerts,
  onCreate,
  onUpdate,
  onDelete,
  onSetEnabled,
}: PriceAlertsProps) {
  const [editingId, setEditingId] = useState<
    string | null
  >(null);
  const [symbol, setSymbol] =
    useState<CryptocurrencySymbol>(DEFAULT_SYMBOL);
  const [condition, setCondition] =
    useState<AlertCondition>("above");
  const [targetPrice, setTargetPrice] = useState("");

  const editingAlert = alerts.find(
    (alert) => alert.id === editingId
  );

  useEffect(() => {
    if (editingId && !editingAlert) {
      setEditingId(null);
      setSymbol(DEFAULT_SYMBOL);
      setCondition("above");
      setTargetPrice("");
    }
  }, [editingAlert, editingId]);

  const resetForm = (): void => {
    setEditingId(null);
    setSymbol(DEFAULT_SYMBOL);
    setCondition("above");
    setTargetPrice("");
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ): void => {
    event.preventDefault();

    const numericTarget = Number(targetPrice);

    if (!Number.isFinite(numericTarget) || numericTarget <= 0) {
      return;
    }

    const input: PriceAlertInput = {
      symbol,
      condition,
      targetPrice: numericTarget,
      enabled: editingAlert?.enabled ?? true,
    };

    if (editingAlert) {
      onUpdate(editingAlert.id, input);
    } else {
      onCreate(input);
    }

    resetForm();
  };

  const beginEdit = (alert: PriceAlert): void => {
    setEditingId(alert.id);
    setSymbol(alert.symbol);
    setCondition(alert.condition);
    setTargetPrice(String(alert.targetPrice));
  };

  return (
    <section
      className="price-alerts"
      aria-labelledby="price-alerts-title"
    >
      <div className="price-alerts-header">
        <div>
          <h2 id="price-alerts-title">Price Alerts</h2>
          <p>
            Get notified when a live price crosses your target.
          </p>
        </div>
        <span className="alert-count">
          {alerts.length} {alerts.length === 1 ? "alert" : "alerts"}
        </span>
      </div>

      <form className="alert-form" onSubmit={handleSubmit}>
        <label className="alert-field">
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

        <label className="alert-field">
          <span>Condition</span>
          <select
            value={condition}
            onChange={(event) =>
              setCondition(
                event.target.value === "below"
                  ? "below"
                  : "above"
              )
            }
          >
            <option value="above">Price goes above</option>
            <option value="below">Price goes below</option>
          </select>
        </label>

        <label className="alert-field alert-target-field">
          <span>Target price (USD)</span>
          <input
            type="number"
            min="0.00000001"
            step="any"
            inputMode="decimal"
            required
            value={targetPrice}
            placeholder="Enter target"
            onChange={(event) =>
              setTargetPrice(event.target.value)
            }
          />
        </label>

        <div className="alert-form-actions">
          <button type="submit" className="alert-primary-button">
            {editingAlert ? "Save Alert" : "Create Alert"}
          </button>
          {editingAlert && (
            <button
              type="button"
              className="alert-secondary-button"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {alerts.length === 0 ? (
        <div className="alerts-empty">
          <h3>No price alerts yet</h3>
          <p>Create an alert to track a live price target.</p>
        </div>
      ) : (
        <ul className="alert-list">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={
                alert.enabled
                  ? "alert-item"
                  : "alert-item is-disabled"
              }
            >
              <div className="alert-summary">
                <strong>{alert.symbol}</strong>
                <span>
                  {alert.condition === "above"
                    ? "Above"
                    : "Below"}{" "}
                  ${formatPrice(alert.targetPrice)}
                </span>
                <span className="alert-state">
                  {alert.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="alert-item-actions">
                <button
                  type="button"
                  className="alert-secondary-button"
                  onClick={() =>
                    onSetEnabled(alert.id, !alert.enabled)
                  }
                >
                  {alert.enabled ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  className="alert-secondary-button"
                  onClick={() => beginEdit(alert)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="alert-delete-button"
                  onClick={() => onDelete(alert.id)}
                  aria-label={`Delete ${alert.symbol} alert ${alert.condition} ${formatPrice(alert.targetPrice)} dollars`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default PriceAlerts;
