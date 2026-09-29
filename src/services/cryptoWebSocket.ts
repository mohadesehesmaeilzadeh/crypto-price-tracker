import {
  findCryptocurrencyByWebSocketSymbol,
  KRAKEN_WEBSOCKET_SYMBOLS,
} from "../config/cryptocurrencies";
import type {
  ConnectionStatus,
  MarketDataUpdate,
} from "../types/crypto";

const KRAKEN_WEBSOCKET_URL =
  "wss://ws.kraken.com/v2";
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 8000;

interface RawKrakenTickerData {
  symbol: string;
  last: number;
  high: number;
  low: number;
  volume: number;
  change?: number;
  change_pct?: number;
  timestamp: string;
}

interface RawKrakenTickerMessage {
  channel: "ticker";
  type: "snapshot" | "update";
  data: readonly RawKrakenTickerData[];
}

interface KrakenTickerSubscriber {
  onStatusChange: (
    status: ConnectionStatus
  ) => void;
  onMarketData: (
    updates: readonly MarketDataUpdate[]
  ) => void;
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

function isFiniteNumber(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function isRawTickerData(
  value: unknown
): value is RawKrakenTickerData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.symbol === "string" &&
    isFiniteNumber(value.last) &&
    isFiniteNumber(value.high) &&
    isFiniteNumber(value.low) &&
    isFiniteNumber(value.volume) &&
    (value.change === undefined ||
      isFiniteNumber(value.change)) &&
    (value.change_pct === undefined ||
      isFiniteNumber(value.change_pct)) &&
    typeof value.timestamp === "string"
  );
}

function isRawTickerMessage(
  value: unknown
): value is RawKrakenTickerMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.channel === "ticker" &&
    (value.type === "snapshot" ||
      value.type === "update") &&
    Array.isArray(value.data) &&
    value.data.every(isRawTickerData)
  );
}

function isSubscriptionFailure(
  value: unknown
): value is Record<string, unknown> & {
  method: "subscribe";
  success: false;
} {
  return (
    isRecord(value) &&
    value.method === "subscribe" &&
    value.success === false
  );
}

function isExpectedControlMessage(
  value: unknown
): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.channel === "heartbeat" ||
    value.channel === "status" ||
    (value.method === "subscribe" &&
      value.success === true)
  );
}

function normalizeTickerMessage(
  message: RawKrakenTickerMessage
): MarketDataUpdate[] {
  const updates: MarketDataUpdate[] = [];

  for (const ticker of message.data) {
    const crypto =
      findCryptocurrencyByWebSocketSymbol(
        ticker.symbol
      );

    if (!crypto) {
      continue;
    }

    const parsedTimestamp = new Date(
      ticker.timestamp
    );

    updates.push({
      symbol: crypto.symbol,
      price: String(ticker.last),
      high: String(ticker.high),
      low: String(ticker.low),
      volume: String(ticker.volume),
      change:
        ticker.change === undefined
          ? null
          : String(ticker.change),
      changePercent: ticker.change_pct ?? null,
      updatedAt: Number.isNaN(
        parsedTimestamp.getTime()
      )
        ? new Date()
        : parsedTimestamp,
    });
  }

  return updates;
}

export class KrakenTickerClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<
    typeof setTimeout
  > | null = null;
  private reconnectAttempt = 0;
  private status: ConnectionStatus =
    "disconnected";
  private readonly subscribers = new Set<
    KrakenTickerSubscriber
  >();

  subscribe(
    subscriber: KrakenTickerSubscriber
  ): () => void {
    this.subscribers.add(subscriber);
    subscriber.onStatusChange(this.status);

    this.connect();

    return () => {
      this.subscribers.delete(subscriber);

      if (this.subscribers.size === 0) {
        this.disconnect();
      }
    };
  }

  private connect(): void {
    if (
      this.subscribers.size === 0 ||
      this.socket !== null ||
      this.reconnectTimer !== null
    ) {
      return;
    }

    this.setStatus(
      this.reconnectAttempt > 0
        ? "reconnecting"
        : "connecting"
    );

    const socket = new WebSocket(
      KRAKEN_WEBSOCKET_URL
    );
    this.socket = socket;

    socket.onopen = () => {
      if (this.socket !== socket) {
        return;
      }

      this.setStatus("connected");
      socket.send(
        JSON.stringify({
          method: "subscribe",
          params: {
            channel: "ticker",
            symbol: KRAKEN_WEBSOCKET_SYMBOLS,
            snapshot: true,
          },
        })
      );
    };

    socket.onmessage = (
      event: MessageEvent<unknown>
    ) => {
      if (
        this.socket !== socket ||
        typeof event.data !== "string"
      ) {
        return;
      }

      this.handleMessage(event.data, socket);
    };

    socket.onerror = () => {
      if (this.socket === socket) {
        socket.close();
      }
    };

    socket.onclose = () => {
      if (this.socket !== socket) {
        return;
      }

      this.socket = null;
      this.setStatus("disconnected");

      if (this.subscribers.size > 0) {
        this.scheduleReconnect();
      }
    };
  }

  private handleMessage(
    rawMessage: string,
    socket: WebSocket
  ): void {
    let message: unknown;

    try {
      message = JSON.parse(rawMessage) as unknown;
    } catch (caughtError: unknown) {
      console.warn(
        "Ignored malformed Kraken WebSocket message.",
        caughtError
      );
      return;
    }

    if (isRawTickerMessage(message)) {
      const updates =
        normalizeTickerMessage(message);

      if (updates.length > 0) {
        this.reconnectAttempt = 0;
        this.subscribers.forEach(
          ({ onMarketData }) =>
            onMarketData(updates)
        );
      }

      return;
    }

    if (isSubscriptionFailure(message)) {
      console.warn(
        "Kraken WebSocket subscription failed.",
        message.error
      );
      socket.close();
      return;
    }

    if (isExpectedControlMessage(message)) {
      if (
        isRecord(message) &&
        message.method === "subscribe" &&
        message.success === true
      ) {
        this.reconnectAttempt = 0;
      }

      return;
    }

    console.warn(
      "Ignored unknown Kraken WebSocket message."
    );
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      return;
    }

    this.reconnectAttempt += 1;
    this.setStatus("reconnecting");

    const delay = Math.min(
      INITIAL_RECONNECT_DELAY *
        2 ** (this.reconnectAttempt - 1),
      MAX_RECONNECT_DELAY
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private disconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const socket = this.socket;
    this.socket = null;

    if (socket !== null) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    }

    this.reconnectAttempt = 0;
    this.setStatus("disconnected");
  }

  private setStatus(
    status: ConnectionStatus
  ): void {
    if (this.status === status) {
      return;
    }

    this.status = status;
    this.subscribers.forEach(
      ({ onStatusChange }) =>
        onStatusChange(status)
    );
  }
}

export const krakenTickerClient =
  new KrakenTickerClient();
