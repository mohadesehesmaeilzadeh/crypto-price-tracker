import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getHistoricalPrices } from "../services/cryptoApi";
import type {
  ChartPoint,
  ChartRange,
  HistoricalDataStatus,
  KrakenPair,
} from "../types/crypto";

interface HistoricalPricesState {
  key: string;
  points: readonly ChartPoint[];
  status: HistoricalDataStatus;
  error: string | null;
}

interface HistoricalPricesResult {
  points: readonly ChartPoint[];
  status: HistoricalDataStatus;
  error: string | null;
  retry: () => void;
}

const historicalPricesCache = new Map<
  string,
  readonly ChartPoint[]
>();

export function useHistoricalPrices(
  pair: KrakenPair,
  range: ChartRange
): HistoricalPricesResult {
  const cacheKey = `${pair}:${range}`;
  const requestId = useRef(0);
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] =
    useState<HistoricalPricesState>({
      key: cacheKey,
      points: [],
      status: "loading",
      error: null,
    });

  useEffect(() => {
    const activeRequestId = ++requestId.current;
    const cachedPoints =
      historicalPricesCache.get(cacheKey);

    if (cachedPoints) {
      setState({
        key: cacheKey,
        points: cachedPoints,
        status:
          cachedPoints.length > 0
            ? "success"
            : "empty",
        error: null,
      });
      return undefined;
    }

    const controller = new AbortController();

    setState({
      key: cacheKey,
      points: [],
      status: "loading",
      error: null,
    });

    void getHistoricalPrices(
      pair,
      range,
      controller.signal
    )
      .then((points) => {
        if (
          controller.signal.aborted ||
          requestId.current !== activeRequestId
        ) {
          return;
        }

        historicalPricesCache.set(
          cacheKey,
          points
        );
        setState({
          key: cacheKey,
          points,
          status:
            points.length > 0
              ? "success"
              : "empty",
          error: null,
        });
      })
      .catch((caughtError: unknown) => {
        if (
          controller.signal.aborted ||
          (caughtError instanceof Error &&
            caughtError.name === "AbortError") ||
          requestId.current !== activeRequestId
        ) {
          return;
        }

        setState({
          key: cacheKey,
          points: [],
          status: "error",
          error:
            "Failed to load historical prices.",
        });
      });

    return () => {
      controller.abort();
    };
  }, [cacheKey, pair, range, retryCount]);

  const retry = useCallback(() => {
    historicalPricesCache.delete(cacheKey);
    setRetryCount((current) => current + 1);
  }, [cacheKey]);

  return useMemo(() => {
    if (state.key !== cacheKey) {
      return {
        points: [],
        status: "loading" as const,
        error: null,
        retry,
      };
    }

    return {
      points: state.points,
      status: state.status,
      error: state.error,
      retry,
    };
  }, [cacheKey, retry, state]);
}
