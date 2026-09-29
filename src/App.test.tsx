import {
  act,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import App from "./App";
import {
  getHistoricalPrices,
  getTicker,
} from "./services/cryptoApi";
import {
  krakenTickerClient,
} from "./services/cryptoWebSocket";
import type {
  MarketValues,
} from "./types/crypto";
import {
  WATCHLIST_STORAGE_KEY,
} from "./hooks/useWatchlist";
import {
  MARKET_VALUES_BY_PAIR,
} from "./test/fixtures";

jest.mock("./services/cryptoApi", () => ({
  getTicker: jest.fn(),
  getHistoricalPrices: jest.fn(),
}));

jest.mock("./services/cryptoWebSocket", () => ({
  krakenTickerClient: {
    subscribe: jest.fn(),
  },
}));

const getTickerMock = getTicker as jest.MockedFunction<
  typeof getTicker
>;
const getHistoricalPricesMock =
  getHistoricalPrices as jest.MockedFunction<
    typeof getHistoricalPrices
  >;
const subscribeMock =
  krakenTickerClient.subscribe as jest.MockedFunction<
    typeof krakenTickerClient.subscribe
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

beforeEach(() => {
  window.localStorage.clear();
  getTickerMock.mockImplementation(
    async (pair) => MARKET_VALUES_BY_PAIR[pair]
  );
  getHistoricalPricesMock.mockResolvedValue([
    { timestamp: 1, price: 100 },
    { timestamp: 2, price: 101 },
  ]);
  subscribeMock.mockReturnValue(jest.fn());
});

afterEach(() => {
  jest.clearAllMocks();
});

test("shows loading while market data is pending", async () => {
  const request = deferred<MarketValues>();
  getTickerMock.mockReturnValue(request.promise);

  render(<App />);

  expect(
    screen.getByText("Loading cryptocurrency data...")
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("article", { name: "Bitcoin" })
  ).not.toBeInTheDocument();

  act(() => {
    request.resolve(MARKET_VALUES_BY_PAIR.xbtusd);
  });

  expect(
    await screen.findByRole("article", {
      name: "Bitcoin",
    })
  ).toBeInTheDocument();
});

test("shows a recoverable market loading error", async () => {
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);
  getTickerMock.mockRejectedValue(
    new Error("Kraken unavailable")
  );

  render(<App />);

  expect(
    await screen.findByText(
      "Failed to load cryptocurrency prices."
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Try Again" })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("article", { name: "Bitcoin" })
  ).not.toBeInTheDocument();

  consoleError.mockRestore();
});

test("filters market cards and shows an empty result", async () => {
  render(<App />);

  await screen.findByRole("article", { name: "Bitcoin" });
  const search = screen.getByPlaceholderText(
    "Search cryptocurrency..."
  );

  fireEvent.change(search, {
    target: { value: "eth" },
  });

  expect(
    screen.getByRole("article", { name: "Ethereum" })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("article", { name: "Bitcoin" })
  ).not.toBeInTheDocument();

  fireEvent.change(search, {
    target: { value: "not-a-supported-asset" },
  });

  expect(
    screen.getByText("No cryptocurrencies found.")
  ).toBeInTheDocument();
  expect(screen.queryAllByRole("article")).toHaveLength(0);
});

test("filters by category and sorts the expanded market", async () => {
  render(<App />);

  await screen.findByRole("article", { name: "Bitcoin" });
  fireEvent.click(
    screen.getByRole("button", { name: "Stablecoins" })
  );

  const tether = screen.getByRole("article", {
    name: "Tether",
  });
  expect(tether).toBeInTheDocument();
  expect(
    screen.getByRole("article", { name: "USD Coin" })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("article", { name: "Bitcoin" })
  ).not.toBeInTheDocument();
  expect(within(tether).getByText("$1.0000")).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: "All" })
  );
  fireEvent.change(screen.getByLabelText("Sort by"), {
    target: { value: "price" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Sort descending" })
  );

  expect(screen.getAllByRole("article")[0]).toHaveAccessibleName(
    "Cardano"
  );

  fireEvent.change(screen.getByLabelText("Sort by"), {
    target: { value: "volume" },
  });

  expect(screen.getAllByRole("article")[0]).toHaveAccessibleName(
    "Tether"
  );

  const subscriber = subscribeMock.mock.calls[0]?.[0];

  act(() => {
    subscriber?.onMarketData([
      {
        symbol: "BTC",
        price: "100",
        high: "110",
        low: "90",
        volume: "10",
        change: "5",
        changePercent: 5,
        updatedAt: new Date("2026-09-27T12:01:00.000Z"),
      },
      {
        symbol: "ETH",
        price: "200",
        high: "210",
        low: "190",
        volume: "20",
        change: "-4",
        changePercent: -2,
        updatedAt: new Date("2026-09-27T12:01:00.000Z"),
      },
    ]);
  });
  fireEvent.change(screen.getByLabelText("Sort by"), {
    target: { value: "change" },
  });

  expect(screen.getAllByRole("article")[0]).toHaveAccessibleName(
    "Bitcoin"
  );
});

test(
  "renders a live price update without manual refresh",
  async () => {
    let subscriber:
      | Parameters<
          typeof krakenTickerClient.subscribe
        >[0]
      | undefined;

    subscribeMock.mockImplementation(
      (nextSubscriber) => {
        subscriber = nextSubscriber;
        return jest.fn();
      }
    );

    render(<App />);

    const bitcoinCard = await screen.findByRole("article", {
      name: "Bitcoin",
    });
    expect(
      within(bitcoinCard).getByText("$100.00")
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(subscribeMock).toHaveBeenCalledTimes(1)
    );

    act(() => {
      subscriber?.onMarketData([
        {
          symbol: "BTC",
          price: "101",
          high: "111",
          low: "91",
          volume: "11",
          change: "1",
          changePercent: 1,
          updatedAt: new Date(
            "2026-09-27T12:00:00.000Z"
          ),
        },
      ]);
    });

    expect(
      within(bitcoinCard).getByText("$101.00")
    ).toBeInTheDocument();
    expect(getTickerMock).toHaveBeenCalledTimes(12);
  }
);

test(
  "updates portfolio calculations from live prices",
  async () => {
    render(<App />);

    const portfolio = await screen.findByRole("region", {
      name: "Portfolio",
    });
    const portfolioView = within(portfolio);

    fireEvent.change(
      portfolioView.getByLabelText("Quantity"),
      { target: { value: "2" } }
    );
    fireEvent.change(
      portfolioView.getByLabelText(
        "Average buy price (USD)"
      ),
      { target: { value: "50" } }
    );
    fireEvent.click(
      portfolioView.getByRole("button", {
        name: "Add Holding",
      })
    );

    expect(
      portfolioView.getByRole("group", {
        name: "Total invested",
      })
    ).toHaveTextContent("$100.00");
    expect(
      portfolioView.getByRole("group", {
        name: "Total current value",
      })
    ).toHaveTextContent("$200.00");
    expect(
      portfolioView.getByRole("group", {
        name: "Total profit or loss",
      })
    ).toHaveTextContent("$100.00");

    await waitFor(() =>
      expect(subscribeMock).toHaveBeenCalledTimes(1)
    );
    const subscriber = subscribeMock.mock.calls[0][0];

    act(() => {
      subscriber.onMarketData([
        {
          symbol: "BTC",
          price: "110",
          high: "115",
          low: "95",
          volume: "12",
          change: "10",
          changePercent: 10,
          updatedAt: new Date(
            "2026-09-27T12:02:00.000Z"
          ),
        },
      ]);
    });

    expect(
      portfolioView.getByRole("group", {
        name: "Total invested",
      })
    ).toHaveTextContent("$100.00");
    expect(
      portfolioView.getByRole("group", {
        name: "Total current value",
      })
    ).toHaveTextContent("$220.00");
    expect(
      portfolioView.getByRole("group", {
        name: "Total profit or loss",
      })
    ).toHaveTextContent("$120.00");

    fireEvent.click(
      portfolioView.getByRole("button", {
        name: "Edit",
      })
    );
    fireEvent.change(
      portfolioView.getByLabelText("Quantity"),
      { target: { value: "3" } }
    );
    fireEvent.click(
      portfolioView.getByRole("button", {
        name: "Save Holding",
      })
    );

    expect(
      portfolioView.getByRole("group", {
        name: "Total current value",
      })
    ).toHaveTextContent("$330.00");
    expect(
      portfolioView.getByRole("group", {
        name: "Total profit or loss",
      })
    ).toHaveTextContent("$180.00");

    fireEvent.click(
      portfolioView.getByRole("button", {
        name: "Delete BTC holding",
      })
    );

    expect(
      portfolioView.getByText("No holdings yet")
    ).toBeInTheDocument();
  }
);

test(
  "filters, updates, and restores the watchlist",
  async () => {
    window.localStorage.setItem(
      WATCHLIST_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        symbols: ["BTC", "INVALID", "BTC"],
      })
    );

    const view = render(<App />);

    await screen.findByRole("article", {
      name: "Bitcoin",
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Watchlist (1)",
      })
    );

    expect(
      screen.getByRole("article", {
        name: "Bitcoin",
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("article", {
        name: "Ethereum",
      })
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove Bitcoin from watchlist",
      })
    );

    expect(
      screen.getByText("Your watchlist is empty")
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Browse All Assets",
      })
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Add Ethereum to watchlist",
      })
    );

    await waitFor(() =>
      expect(
        JSON.parse(
          window.localStorage.getItem(
            WATCHLIST_STORAGE_KEY
          ) ?? "null"
        )
      ).toEqual({
        version: 1,
        symbols: ["ETH"],
      })
    );

    view.unmount();
    render(<App />);

    await screen.findByRole("article", {
      name: "Ethereum",
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Watchlist (1)",
      })
    );

    expect(
      screen.getByRole("article", {
        name: "Ethereum",
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("article", {
        name: "Bitcoin",
      })
    ).not.toBeInTheDocument();

    await waitFor(() =>
      expect(subscribeMock).toHaveBeenCalledTimes(2)
    );
    const restoredSubscriber =
      subscribeMock.mock.calls[
        subscribeMock.mock.calls.length - 1
      ][0];

    act(() => {
      restoredSubscriber.onMarketData([
        {
          symbol: "ETH",
          price: "201",
          high: "211",
          low: "191",
          volume: "21",
          change: "1",
          changePercent: 0.5,
          updatedAt: new Date(
            "2026-09-27T12:01:00.000Z"
          ),
        },
      ]);
    });

    expect(
      screen.getByRole("article", {
        name: "Ethereum",
      })
    ).toHaveTextContent("$201.00");
  }
);
