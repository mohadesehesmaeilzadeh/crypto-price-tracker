import {
  act,
  renderHook,
  waitFor,
} from "@testing-library/react";

import { useHistoricalPrices } from "./useHistoricalPrices";
import { getHistoricalPrices } from "../services/cryptoApi";
import type {
  ChartPoint,
  ChartRange,
  KrakenPair,
} from "../types/crypto";

jest.mock("../services/cryptoApi", () => ({
  getHistoricalPrices: jest.fn(),
}));

const getHistoricalPricesMock =
  getHistoricalPrices as jest.MockedFunction<
    typeof getHistoricalPrices
  >;

function deferred<T>() {
  let resolvePromise: (value: T) => void =
    () => undefined;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: resolvePromise,
  };
}

afterEach(() => {
  jest.clearAllMocks();
});

test(
  "aborts and ignores stale historical requests",
  async () => {
    const firstRequest =
      deferred<ChartPoint[]>();
    const secondRequest =
      deferred<ChartPoint[]>();
    getHistoricalPricesMock
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);

    const { result, rerender } = renderHook(
      ({ pair, range }: {
        pair: KrakenPair;
        range: ChartRange;
      }) =>
        useHistoricalPrices(pair, range),
      {
        initialProps: {
          pair: "xbtusd",
          range: "24H",
        },
      }
    );
    const firstSignal =
      getHistoricalPricesMock.mock.calls[0][2];

    rerender({
      pair: "ethusd" as const,
      range: "7D" as const,
    });

    expect(firstSignal?.aborted).toBe(true);

    act(() => {
      firstRequest.resolve([
        { timestamp: 1, price: 10 },
      ]);
      secondRequest.resolve([
        { timestamp: 2, price: 20 },
      ]);
    });

    await waitFor(() =>
      expect(result.current.status).toBe("success")
    );
    expect(result.current.points).toEqual([
      { timestamp: 2, price: 20 },
    ]);
  }
);

test(
  "reuses cached asset and range data",
  async () => {
    getHistoricalPricesMock
      .mockResolvedValueOnce([
        { timestamp: 3, price: 30 },
      ])
      .mockResolvedValueOnce([
        { timestamp: 4, price: 40 },
      ]);

    const { result, rerender } = renderHook(
      ({ pair, range }: {
        pair: KrakenPair;
        range: ChartRange;
      }) =>
        useHistoricalPrices(pair, range),
      {
        initialProps: {
          pair: "solusd",
          range: "30D",
        },
      }
    );

    await waitFor(() =>
      expect(result.current.status).toBe("success")
    );

    rerender({
      pair: "adausd" as const,
      range: "30D" as const,
    });
    await waitFor(() =>
      expect(result.current.points).toEqual([
        { timestamp: 4, price: 40 },
      ])
    );

    rerender({
      pair: "solusd" as const,
      range: "30D" as const,
    });
    await waitFor(() =>
      expect(result.current.points).toEqual([
        { timestamp: 3, price: 30 },
      ])
    );

    expect(getHistoricalPricesMock).toHaveBeenCalledTimes(2);
  }
);
