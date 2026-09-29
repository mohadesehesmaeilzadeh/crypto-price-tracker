import {
  act,
  renderHook,
  waitFor,
} from "@testing-library/react";

import type { Holding } from "../types/crypto";
import {
  HOLDINGS_STORAGE_KEY,
  useHoldings,
} from "./useHoldings";

beforeEach(() => {
  window.localStorage.clear();
});

test("safely restores only valid holdings", () => {
  const validHolding: Holding = {
    id: "valid",
    symbol: "BTC",
    quantity: 1.5,
    averageBuyPrice: 100,
  };

  window.localStorage.setItem(
    HOLDINGS_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      holdings: [
        validHolding,
        { ...validHolding },
        { ...validHolding, id: "bad-symbol", symbol: "INVALID" },
        { ...validHolding, id: "bad-quantity", quantity: 0 },
        { ...validHolding, id: "bad-price", averageBuyPrice: -1 },
      ],
    })
  );

  const { result } = renderHook(() => useHoldings());

  expect(result.current.holdings).toEqual([validHolding]);
});

test("creates, edits, deletes, and persists holdings", async () => {
  const { result } = renderHook(() => useHoldings());

  act(() => {
    result.current.createHolding({
      symbol: "SOL",
      quantity: 2,
      averageBuyPrice: 150,
    });
  });

  const id = result.current.holdings[0].id;

  act(() => {
    result.current.updateHolding(id, {
      symbol: "SOL",
      quantity: 3,
      averageBuyPrice: 140,
    });
  });

  expect(result.current.holdings[0]).toMatchObject({
    id,
    quantity: 3,
    averageBuyPrice: 140,
  });

  await waitFor(() => {
    const stored = JSON.parse(
      window.localStorage.getItem(
        HOLDINGS_STORAGE_KEY
      ) ?? "null"
    ) as { holdings: Holding[] };

    expect(stored.holdings).toEqual(result.current.holdings);
  });

  act(() => {
    result.current.deleteHolding(id);
  });

  expect(result.current.holdings).toEqual([]);
});

test("malformed storage does not crash initialization", () => {
  window.localStorage.setItem(
    HOLDINGS_STORAGE_KEY,
    "not-json"
  );

  const { result } = renderHook(() => useHoldings());

  expect(result.current.holdings).toEqual([]);
});
