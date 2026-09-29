import type {
  ChartPoint,
  ChartRange,
  KrakenPair,
  MarketValues,
} from "../types/crypto";

const BASE_URL =
  "https://api.kraken.com/0/public";

interface RawKrakenTickerEntry {
  c: readonly string[];
  h: readonly string[];
  l: readonly string[];
  v: readonly string[];
}

interface RawKrakenTickerResponse {
  error: readonly string[];
  result: Record<
    string,
    RawKrakenTickerEntry
  >;
}

interface HistoricalRangeConfig {
  intervalMinutes: 5 | 15 | 60;
  durationSeconds: number;
}

const HISTORICAL_RANGE_CONFIG: Record<
  ChartRange,
  HistoricalRangeConfig
> = {
  "24H": {
    intervalMinutes: 5,
    durationSeconds: 24 * 60 * 60,
  },
  "7D": {
    intervalMinutes: 15,
    durationSeconds: 7 * 24 * 60 * 60,
  },
  "30D": {
    intervalMinutes: 60,
    durationSeconds: 30 * 24 * 60 * 60,
  },
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isStringArray(
  value: unknown
): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item): item is string =>
        typeof item === "string"
    )
  );
}

function isRawTickerEntry(
  value: unknown
): value is RawKrakenTickerEntry {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isStringArray(value.c) &&
    value.c.length > 0 &&
    isStringArray(value.h) &&
    value.h.length > 1 &&
    isStringArray(value.l) &&
    value.l.length > 1 &&
    isStringArray(value.v) &&
    value.v.length > 1
  );
}

function parseKrakenTickerResponse(
  value: unknown
): RawKrakenTickerResponse {
  if (!isRecord(value)) {
    throw new Error(
      "Cryptocurrency data was not found"
    );
  }

  if (
    !isStringArray(value.error)
  ) {
    throw new Error(
      "Cryptocurrency data was not found"
    );
  }

  if (value.error.length > 0) {
    throw new Error(value.error.join(", "));
  }

  if (!isRecord(value.result)) {
    throw new Error(
      "Cryptocurrency data was not found"
    );
  }

  const entries = Object.entries(
    value.result
  );
  const result: Record<
    string,
    RawKrakenTickerEntry
  > = {};

  if (entries.length === 0) {
    throw new Error(
      "Cryptocurrency data was not found"
    );
  }

  for (const [pair, entry] of entries) {
    if (!isRawTickerEntry(entry)) {
      throw new Error(
        "Cryptocurrency data was not found"
      );
    }

    result[pair] = entry;
  }

  return {
    error: value.error,
    result,
  };
}

function parseHistoricalResponse(
  value: unknown,
  since: number
): ChartPoint[] {
  if (
    !isRecord(value) ||
    !isStringArray(value.error)
  ) {
    throw new Error(
      "Historical price data was not found"
    );
  }

  if (value.error.length > 0) {
    throw new Error(value.error.join(", "));
  }

  if (!isRecord(value.result)) {
    throw new Error(
      "Historical price data was not found"
    );
  }

  const candleEntry = Object.entries(
    value.result
  ).find(
    ([key, entry]) =>
      key !== "last" && Array.isArray(entry)
  );

  if (!candleEntry) {
    return [];
  }

  const [, candles] = candleEntry;
  const points: ChartPoint[] = [];

  if (!Array.isArray(candles)) {
    return points;
  }

  for (const candle of candles) {
    if (
      !Array.isArray(candle) ||
      candle.length < 5 ||
      typeof candle[0] !== "number" ||
      (typeof candle[4] !== "string" &&
        typeof candle[4] !== "number")
    ) {
      continue;
    }

    const timestamp = candle[0];
    const price = Number(candle[4]);

    if (
      timestamp >= since &&
      Number.isFinite(price)
    ) {
      points.push({
        timestamp: timestamp * 1000,
        price,
      });
    }
  }

  return points.sort(
    (first, second) =>
      first.timestamp - second.timestamp
  );
}

export async function getTicker(
  pair: KrakenPair
): Promise<MarketValues> {
  const response = await fetch(
    `${BASE_URL}/Ticker?pair=${encodeURIComponent(
      pair
    )}`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch cryptocurrency data"
    );
  }

  const responseData: unknown =
    await response.json();
  const data = parseKrakenTickerResponse(
    responseData
  );
  const ticker = Object.values(
    data.result
  )[0];

  return {
    price: ticker.c[0],
    high: ticker.h[1],
    low: ticker.l[1],
    volume: ticker.v[1],
    change: null,
    changePercent: null,
  };
}

export async function getHistoricalPrices(
  pair: KrakenPair,
  range: ChartRange,
  signal?: AbortSignal
): Promise<ChartPoint[]> {
  const config = HISTORICAL_RANGE_CONFIG[range];
  const since =
    Math.floor(Date.now() / 1000) -
    config.durationSeconds;
  const query = new URLSearchParams({
    pair,
    interval: String(config.intervalMinutes),
    since: String(since),
    assetVersion: "1",
  });
  const response = await fetch(
    `${BASE_URL}/OHLC?${query.toString()}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch historical price data"
    );
  }

  const responseData: unknown =
    await response.json();

  return parseHistoricalResponse(
    responseData,
    since
  );
}
