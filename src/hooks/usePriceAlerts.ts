import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  isSupportedCryptocurrencySymbol,
} from "../config/cryptocurrencies";
import type {
  AlertCondition,
  AlertNotification,
  CryptocurrencySymbol,
  MarketDataUpdate,
  PriceAlert,
  PriceAlertInput,
} from "../types/crypto";

export const PRICE_ALERTS_STORAGE_KEY =
  "crypto-price-tracker:price-alerts";

interface StoredPriceAlerts {
  version: 1;
  alerts: PriceAlert[];
}

interface PriceAlertsState {
  alerts: readonly PriceAlert[];
  notifications: readonly AlertNotification[];
  createAlert: (input: PriceAlertInput) => void;
  updateAlert: (
    id: string,
    input: PriceAlertInput
  ) => void;
  deleteAlert: (id: string) => void;
  setAlertEnabled: (
    id: string,
    enabled: boolean
  ) => void;
  evaluatePriceUpdates: (
    updates: readonly MarketDataUpdate[]
  ) => void;
  dismissNotification: (id: string) => void;
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isAlertCondition(
  value: unknown
): value is AlertCondition {
  return value === "above" || value === "below";
}

function isPriceAlert(value: unknown): value is PriceAlert {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    isSupportedCryptocurrencySymbol(value.symbol) &&
    isAlertCondition(value.condition) &&
    typeof value.targetPrice === "number" &&
    Number.isFinite(value.targetPrice) &&
    value.targetPrice > 0 &&
    typeof value.enabled === "boolean"
  );
}

function readStoredAlerts(): PriceAlert[] {
  try {
    const storedValue = window.localStorage.getItem(
      PRICE_ALERTS_STORAGE_KEY
    );

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (
      !isRecord(parsedValue) ||
      parsedValue.version !== 1 ||
      !Array.isArray(parsedValue.alerts)
    ) {
      return [];
    }

    const ids = new Set<string>();

    return parsedValue.alerts.filter((alert): alert is PriceAlert => {
      if (!isPriceAlert(alert) || ids.has(alert.id)) {
        return false;
      }

      ids.add(alert.id);
      return true;
    });
  } catch {
    return [];
  }
}

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function crossedTarget(
  alert: PriceAlert,
  previousPrice: number,
  currentPrice: number
): boolean {
  return alert.condition === "above"
    ? previousPrice <= alert.targetPrice &&
        currentPrice > alert.targetPrice
    : previousPrice >= alert.targetPrice &&
        currentPrice < alert.targetPrice;
}

function showBrowserNotification(
  notification: AlertNotification
): void {
  if (
    typeof window.Notification === "undefined" ||
    window.Notification.permission !== "granted"
  ) {
    return;
  }

  try {
    new window.Notification(
      `${notification.symbol} price alert`,
      {
        body: `${notification.symbol} is ${notification.condition} $${notification.targetPrice.toLocaleString()} at $${notification.currentPrice.toLocaleString()}.`,
      }
    );
  } catch {
    // In-app notifications remain available when the
    // browser blocks system notification delivery.
  }
}

export function usePriceAlerts(): PriceAlertsState {
  const [alerts, setAlerts] = useState<PriceAlert[]>(
    readStoredAlerts
  );
  const [notifications, setNotifications] = useState<
    AlertNotification[]
  >([]);
  const alertsRef = useRef(alerts);
  const previousPricesRef = useRef(
    new Map<CryptocurrencySymbol, number>()
  );

  alertsRef.current = alerts;

  useEffect(() => {
    const storedAlerts: StoredPriceAlerts = {
      version: 1,
      alerts,
    };

    try {
      window.localStorage.setItem(
        PRICE_ALERTS_STORAGE_KEY,
        JSON.stringify(storedAlerts)
      );
    } catch {
      // Persistence can be unavailable in private or
      // storage-restricted browser contexts.
    }
  }, [alerts]);

  const createAlert = useCallback(
    (input: PriceAlertInput): void => {
      setAlerts((currentAlerts) => [
        ...currentAlerts,
        { id: createId(), ...input },
      ]);
    },
    []
  );

  const updateAlert = useCallback(
    (id: string, input: PriceAlertInput): void => {
      setAlerts((currentAlerts) =>
        currentAlerts.map((alert) =>
          alert.id === id
            ? { id: alert.id, ...input }
            : alert
        )
      );
    },
    []
  );

  const deleteAlert = useCallback((id: string): void => {
    setAlerts((currentAlerts) =>
      currentAlerts.filter((alert) => alert.id !== id)
    );
  }, []);

  const setAlertEnabled = useCallback(
    (id: string, enabled: boolean): void => {
      setAlerts((currentAlerts) =>
        currentAlerts.map((alert) =>
          alert.id === id ? { ...alert, enabled } : alert
        )
      );
    },
    []
  );

  const evaluatePriceUpdates = useCallback(
    (updates: readonly MarketDataUpdate[]): void => {
      const triggered: AlertNotification[] = [];

      for (const update of updates) {
        const currentPrice = Number(update.price);

        if (!Number.isFinite(currentPrice)) {
          continue;
        }

        const previousPrice = previousPricesRef.current.get(
          update.symbol
        );
        previousPricesRef.current.set(
          update.symbol,
          currentPrice
        );

        if (previousPrice === undefined) {
          continue;
        }

        for (const alert of alertsRef.current) {
          if (
            alert.enabled &&
            alert.symbol === update.symbol &&
            crossedTarget(alert, previousPrice, currentPrice)
          ) {
            triggered.push({
              id: createId(),
              alertId: alert.id,
              symbol: alert.symbol,
              condition: alert.condition,
              targetPrice: alert.targetPrice,
              currentPrice,
            });
          }
        }
      }

      if (triggered.length === 0) {
        return;
      }

      setNotifications((current) => [
        ...current,
        ...triggered,
      ]);
      triggered.forEach(showBrowserNotification);
    },
    []
  );

  const dismissNotification = useCallback(
    (id: string): void => {
      setNotifications((current) =>
        current.filter(
          (notification) => notification.id !== id
        )
      );
    },
    []
  );

  return {
    alerts,
    notifications,
    createAlert,
    updateAlert,
    deleteAlert,
    setAlertEnabled,
    evaluatePriceUpdates,
    dismissNotification,
  };
}
