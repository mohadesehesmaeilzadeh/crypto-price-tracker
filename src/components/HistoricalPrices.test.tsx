import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import HistoricalPrices from "./HistoricalPrices";
import { useHistoricalPrices } from "../hooks/useHistoricalPrices";

jest.mock("../hooks/useHistoricalPrices", () => ({
  useHistoricalPrices: jest.fn(),
}));

jest.mock("./PriceChart", () => ({
  __esModule: true,
  default: ({
    symbol,
    range,
  }: {
    symbol: string;
    range: string;
  }) => (
    <div data-testid="price-chart">
      {symbol}-{range}
    </div>
  ),
}));

const useHistoricalPricesMock =
  useHistoricalPrices as jest.MockedFunction<
    typeof useHistoricalPrices
  >;

beforeEach(() => {
  useHistoricalPricesMock.mockReturnValue({
    points: [
      { timestamp: 1, price: 100 },
      { timestamp: 2, price: 101 },
    ],
    status: "success",
    error: null,
    retry: jest.fn(),
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test(
  "switches historical ranges and cryptocurrencies",
  () => {
    render(<HistoricalPrices marketData={[]} />);

    expect(
      screen.getByRole("heading", { name: "Bitcoin" })
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("price-chart")
    ).toHaveTextContent("BTC-24H");
    expect(useHistoricalPricesMock).toHaveBeenCalledWith(
      "xbtusd",
      "24H"
    );

    fireEvent.click(
      screen.getByRole("button", { name: "7D" })
    );

    expect(
      screen.getByTestId("price-chart")
    ).toHaveTextContent("BTC-7D");
    expect(useHistoricalPricesMock).toHaveBeenLastCalledWith(
      "xbtusd",
      "7D"
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ethereum (ETH)",
      })
    );

    expect(
      screen.getByRole("heading", { name: "Ethereum" })
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("price-chart")
    ).toHaveTextContent("ETH-7D");
    expect(useHistoricalPricesMock).toHaveBeenLastCalledWith(
      "ethusd",
      "7D"
    );
  }
);
