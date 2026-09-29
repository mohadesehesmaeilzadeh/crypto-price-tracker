import {
  getHistoricalPrices,
} from "./cryptoApi";
import type {
  ChartRange,
} from "../types/crypto";

const NOW_SECONDS = 2_000_000_000;

function historicalResponse(): Response {
  return {
    ok: true,
    json: async () => ({
      error: [],
      result: {
        "BTC/USD": [
          [
            NOW_SECONDS - 3600,
            "99",
            "102",
            "98",
            "101.25",
            "100",
            "12",
            4,
          ],
          ["malformed"],
        ],
        last: NOW_SECONDS,
      },
    }),
  } as Response;
}

afterEach(() => {
  jest.restoreAllMocks();
});

test.each<{
  range: ChartRange;
  interval: string;
}>([
  { range: "24H", interval: "5" },
  { range: "7D", interval: "15" },
  { range: "30D", interval: "60" },
])(
  "normalizes $range OHLC data with a $interval minute interval",
  async ({ range, interval }) => {
    jest
      .spyOn(Date, "now")
      .mockReturnValue(NOW_SECONDS * 1000);
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(historicalResponse());

    const points = await getHistoricalPrices(
      "xbtusd",
      range
    );
    const requestUrl = new URL(
      String(fetchMock.mock.calls[0][0])
    );

    expect(
      requestUrl.searchParams.get("interval")
    ).toBe(interval);
    expect(
      requestUrl.searchParams.get("assetVersion")
    ).toBe("1");
    expect(points).toEqual([
      {
        timestamp:
          (NOW_SECONDS - 3600) * 1000,
        price: 101.25,
      },
    ]);
  }
);
