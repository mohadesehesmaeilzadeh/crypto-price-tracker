import {
  act,
  renderHook,
  waitFor,
} from "@testing-library/react";

import {
  useWatchlist,
  WATCHLIST_STORAGE_KEY,
} from "./useWatchlist";

beforeEach(() => {
  window.localStorage.clear();
});

test(
  "restores only unique supported symbols",
  () => {
    window.localStorage.setItem(
      WATCHLIST_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        symbols: [
          "BTC",
          "UNKNOWN",
          "ETH",
          "BTC",
          42,
        ],
      })
    );

    const { result } = renderHook(() =>
      useWatchlist()
    );

    expect(result.current.symbols).toEqual([
      "BTC",
      "ETH",
    ]);
    expect(result.current.symbolSet.has("BTC")).toBe(
      true
    );
  }
);

test(
  "handles malformed storage and persists toggles",
  async () => {
    window.localStorage.setItem(
      WATCHLIST_STORAGE_KEY,
      "not-json"
    );

    const { result } = renderHook(() =>
      useWatchlist()
    );

    expect(result.current.symbols).toEqual([]);

    act(() => {
      result.current.toggle("SOL");
    });

    await waitFor(() =>
      expect(
        JSON.parse(
          window.localStorage.getItem(
            WATCHLIST_STORAGE_KEY
          ) ?? "null"
        )
      ).toEqual({
        version: 1,
        symbols: ["SOL"],
      })
    );

    act(() => {
      result.current.toggle("SOL");
    });

    await waitFor(() =>
      expect(result.current.symbols).toEqual([])
    );
  }
);
