import {
  act,
  renderHook,
  waitFor,
} from "@testing-library/react";

import type {
  MarketDataUpdate,
  PriceAlert,
} from "../types/crypto";
import {
  PRICE_ALERTS_STORAGE_KEY,
  usePriceAlerts,
} from "./usePriceAlerts";
import { createMarketUpdate } from "../test/fixtures";

const BTC_ALERT: PriceAlert = {
  id: "btc-alert",
  symbol: "BTC",
  condition: "above",
  targetPrice: 100,
  enabled: true,
};

function storeAlerts(alerts: readonly PriceAlert[]): void {
  window.localStorage.setItem(
    PRICE_ALERTS_STORAGE_KEY,
    JSON.stringify({ version: 1, alerts })
  );
}

function marketUpdate(
  price: number
): MarketDataUpdate {
  return createMarketUpdate("BTC", price);
}

beforeEach(() => {
  window.localStorage.clear();
});

test("triggers above alerts once per upward crossing", () => {
  storeAlerts([BTC_ALERT]);
  const { result } = renderHook(() => usePriceAlerts());

  act(() => {
    result.current.evaluatePriceUpdates([marketUpdate(90)]);
    result.current.evaluatePriceUpdates([marketUpdate(101)]);
    result.current.evaluatePriceUpdates([marketUpdate(105)]);
  });

  expect(result.current.notifications).toHaveLength(1);
  expect(result.current.notifications[0]).toMatchObject({
    alertId: "btc-alert",
    condition: "above",
    currentPrice: 101,
  });

  act(() => {
    result.current.evaluatePriceUpdates([marketUpdate(99)]);
    result.current.evaluatePriceUpdates([marketUpdate(102)]);
  });

  expect(result.current.notifications).toHaveLength(2);
});

test("triggers below alerts only on a downward crossing", () => {
  storeAlerts([
    {
      ...BTC_ALERT,
      condition: "below",
    },
  ]);
  const { result } = renderHook(() => usePriceAlerts());

  act(() => {
    result.current.evaluatePriceUpdates([marketUpdate(110)]);
    result.current.evaluatePriceUpdates([marketUpdate(99)]);
    result.current.evaluatePriceUpdates([marketUpdate(95)]);
  });

  expect(result.current.notifications).toHaveLength(1);
  expect(result.current.notifications[0]).toMatchObject({
    condition: "below",
    currentPrice: 99,
  });
});

test("disabled and deleted alerts do not trigger", () => {
  storeAlerts([{ ...BTC_ALERT, enabled: false }]);
  const { result } = renderHook(() => usePriceAlerts());

  act(() => {
    result.current.evaluatePriceUpdates([marketUpdate(90)]);
    result.current.evaluatePriceUpdates([marketUpdate(101)]);
  });

  expect(result.current.notifications).toEqual([]);

  act(() => {
    result.current.setAlertEnabled("btc-alert", true);
  });
  act(() => {
    result.current.evaluatePriceUpdates([marketUpdate(99)]);
    result.current.evaluatePriceUpdates([marketUpdate(101)]);
  });

  expect(result.current.notifications).toHaveLength(1);

  act(() => {
    result.current.deleteAlert("btc-alert");
  });
  act(() => {
    result.current.evaluatePriceUpdates([marketUpdate(90)]);
    result.current.evaluatePriceUpdates([marketUpdate(101)]);
  });

  expect(result.current.notifications).toHaveLength(1);
});

test("creates, edits, disables, deletes, and persists alerts", async () => {
  const { result } = renderHook(() => usePriceAlerts());

  act(() => {
    result.current.createAlert({
      symbol: "ETH",
      condition: "above",
      targetPrice: 2500,
      enabled: true,
    });
  });

  expect(result.current.alerts).toHaveLength(1);
  const id = result.current.alerts[0].id;

  act(() => {
    result.current.updateAlert(id, {
      symbol: "ETH",
      condition: "below",
      targetPrice: 2000,
      enabled: true,
    });
    result.current.setAlertEnabled(id, false);
  });

  expect(result.current.alerts[0]).toMatchObject({
    condition: "below",
    targetPrice: 2000,
    enabled: false,
  });

  await waitFor(() => {
    const stored = JSON.parse(
      window.localStorage.getItem(
        PRICE_ALERTS_STORAGE_KEY
      ) ?? "null"
    ) as { alerts: PriceAlert[] };

    expect(stored.alerts[0]).toMatchObject({
      id,
      symbol: "ETH",
      enabled: false,
    });
  });

  act(() => {
    result.current.deleteAlert(id);
  });

  expect(result.current.alerts).toEqual([]);
});

test("safely ignores invalid stored alerts", () => {
  window.localStorage.setItem(
    PRICE_ALERTS_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      alerts: [
        BTC_ALERT,
        { ...BTC_ALERT },
        { ...BTC_ALERT, id: "bad-symbol", symbol: "INVALID" },
        { ...BTC_ALERT, id: "bad-price", targetPrice: -1 },
      ],
    })
  );

  const { result } = renderHook(() => usePriceAlerts());

  expect(result.current.alerts).toEqual([BTC_ALERT]);
});

test("denied browser notification permission does not block in-app alerts", () => {
  storeAlerts([BTC_ALERT]);
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    window,
    "Notification"
  );

  Object.defineProperty(window, "Notification", {
    configurable: true,
    value: { permission: "denied" },
  });

  try {
    const { result } = renderHook(() => usePriceAlerts());

    expect(() => {
      act(() => {
        result.current.evaluatePriceUpdates([marketUpdate(90)]);
        result.current.evaluatePriceUpdates([marketUpdate(101)]);
      });
    }).not.toThrow();

    expect(result.current.notifications).toHaveLength(1);
  } finally {
    if (originalDescriptor) {
      Object.defineProperty(
        window,
        "Notification",
        originalDescriptor
      );
    } else {
      Reflect.deleteProperty(window, "Notification");
    }
  }
});
