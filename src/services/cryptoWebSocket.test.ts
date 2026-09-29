import {
  KrakenTickerClient,
} from "./cryptoWebSocket";
import type {
  ConnectionStatus,
  MarketDataUpdate,
} from "../types/crypto";

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  onopen: ((event: Event) => void) | null = null;
  onmessage:
    | ((event: MessageEvent<unknown>) => void)
    | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null =
    null;

  readonly send = jest.fn<void, [string]>();
  readonly close = jest.fn<void, []>();

  constructor(readonly url: string) {
    MockWebSocket.instances.push(this);
  }

  open(): void {
    this.onopen?.(new Event("open"));
  }

  message(data: string): void {
    this.onmessage?.(
      new MessageEvent("message", { data })
    );
  }

  serverClose(): void {
    this.onclose?.(new CloseEvent("close"));
  }
}

const originalWebSocket = globalThis.WebSocket;

beforeEach(() => {
  jest.useFakeTimers();
  MockWebSocket.instances = [];
  Object.defineProperty(globalThis, "WebSocket", {
    configurable: true,
    writable: true,
    value: MockWebSocket,
  });
});

afterEach(() => {
  jest.useRealTimers();
  Object.defineProperty(globalThis, "WebSocket", {
    configurable: true,
    writable: true,
    value: originalWebSocket,
  });
  jest.restoreAllMocks();
});

test(
  "shares one socket and normalizes live ticker updates",
  () => {
    const client = new KrakenTickerClient();
    const statuses: ConnectionStatus[] = [];
    const updates: MarketDataUpdate[][] = [];
    const subscriber = {
      onStatusChange: (
        status: ConnectionStatus
      ) => statuses.push(status),
      onMarketData: (
        marketUpdates: readonly MarketDataUpdate[]
      ) => updates.push([...marketUpdates]),
    };

    const unsubscribeFirst =
      client.subscribe(subscriber);
    const unsubscribeSecond = client.subscribe({
      onStatusChange: jest.fn(),
      onMarketData: jest.fn(),
    });

    expect(MockWebSocket.instances).toHaveLength(1);

    const socket = MockWebSocket.instances[0];
    socket.open();

    expect(statuses).toContain("connected");
    expect(socket.send).toHaveBeenCalledTimes(1);
    expect(
      JSON.parse(socket.send.mock.calls[0][0])
    ).toMatchObject({
      method: "subscribe",
      params: {
        channel: "ticker",
        symbol: [
          "BTC/USD",
          "ETH/USD",
          "USDT/USD",
          "USDC/USD",
          "SOL/USD",
          "XRP/USD",
          "ADA/USD",
          "DOGE/USD",
          "DOT/USD",
          "LINK/USD",
          "AVAX/USD",
          "LTC/USD",
        ],
      },
    });

    socket.message(
      JSON.stringify({
        channel: "ticker",
        type: "update",
        data: [
          {
            symbol: "BTC/USD",
            last: 101234.5,
            high: 102000,
            low: 99000,
            volume: 1234.5,
            change: 1234.5,
            change_pct: 1.24,
            timestamp:
              "2026-09-27T12:00:00.000Z",
          },
        ],
      })
    );

    expect(updates[0]).toEqual([
      {
        symbol: "BTC",
        price: "101234.5",
        high: "102000",
        low: "99000",
        volume: "1234.5",
        change: "1234.5",
        changePercent: 1.24,
        updatedAt: new Date(
          "2026-09-27T12:00:00.000Z"
        ),
      },
    ]);

    unsubscribeFirst();
    expect(socket.close).not.toHaveBeenCalled();
    unsubscribeSecond();
    expect(socket.close).toHaveBeenCalledTimes(1);
  }
);

test(
  "ignores malformed messages and reconnects after loss",
  () => {
    const warning = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const client = new KrakenTickerClient();
    const statuses: ConnectionStatus[] = [];
    const unsubscribe = client.subscribe({
      onStatusChange: (
        status: ConnectionStatus
      ) => statuses.push(status),
      onMarketData: jest.fn(),
    });

    const firstSocket = MockWebSocket.instances[0];
    firstSocket.open();
    firstSocket.message("not-json");

    expect(warning).toHaveBeenCalledTimes(1);

    firstSocket.serverClose();

    expect(statuses).toContain("disconnected");
    expect(statuses).toContain("reconnecting");
    expect(jest.getTimerCount()).toBe(1);

    jest.advanceTimersByTime(1000);

    expect(MockWebSocket.instances).toHaveLength(2);

    unsubscribe();
    jest.runOnlyPendingTimers();

    expect(MockWebSocket.instances).toHaveLength(2);
    expect(jest.getTimerCount()).toBe(0);
  }
);
