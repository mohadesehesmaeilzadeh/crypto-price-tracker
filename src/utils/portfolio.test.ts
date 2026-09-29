import type {
  Holding,
  NormalizedMarketData,
} from "../types/crypto";
import {
  calculateHoldingValuation,
  calculatePortfolio,
} from "./portfolio";

const HOLDINGS: Holding[] = [
  {
    id: "btc",
    symbol: "BTC",
    quantity: 2,
    averageBuyPrice: 80,
  },
  {
    id: "eth",
    symbol: "ETH",
    quantity: 3,
    averageBuyPrice: 40,
  },
];

const MARKET_DATA: NormalizedMarketData[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: "100",
    high: "110",
    low: "90",
    volume: "10",
    change: null,
    changePercent: null,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: "50",
    high: "55",
    low: "45",
    volume: "20",
    change: null,
    changePercent: null,
  },
];

test("calculates holding and portfolio values", () => {
  const valuation = calculateHoldingValuation(
    HOLDINGS[0],
    100
  );

  expect(valuation.investedAmount).toBe(160);
  expect(valuation.currentValue).toBe(200);
  expect(valuation.profitLossAmount).toBe(40);
  expect(valuation.profitLossPercentage).toBe(25);

  const portfolio = calculatePortfolio(
    HOLDINGS,
    MARKET_DATA
  );

  expect(portfolio.summary).toEqual({
    totalInvested: 280,
    totalCurrentValue: 350,
    totalProfitLoss: 70,
    totalProfitLossPercentage: 25,
  });
});

test("marks current totals unavailable when a price is missing", () => {
  const portfolio = calculatePortfolio(
    HOLDINGS,
    MARKET_DATA.slice(0, 1)
  );

  expect(portfolio.holdings[1].currentValue).toBeNull();
  expect(portfolio.summary.totalInvested).toBe(280);
  expect(portfolio.summary.totalCurrentValue).toBeNull();
  expect(portfolio.summary.totalProfitLoss).toBeNull();
  expect(
    portfolio.summary.totalProfitLossPercentage
  ).toBeNull();
});
