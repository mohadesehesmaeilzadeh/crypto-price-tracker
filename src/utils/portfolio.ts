import type {
  Holding,
  HoldingValuation,
  NormalizedMarketData,
  PortfolioCalculation,
} from "../types/crypto";

function getCurrentPrice(
  holding: Holding,
  marketData: readonly NormalizedMarketData[]
): number | null {
  const price = Number(
    marketData.find(
      ({ symbol }) => symbol === holding.symbol
    )?.price
  );

  return Number.isFinite(price) && price >= 0
    ? price
    : null;
}

export function calculateHoldingValuation(
  holding: Holding,
  currentPrice: number | null
): HoldingValuation {
  const investedAmount =
    holding.quantity * holding.averageBuyPrice;

  if (currentPrice === null) {
    return {
      holding,
      currentPrice: null,
      investedAmount,
      currentValue: null,
      profitLossAmount: null,
      profitLossPercentage: null,
    };
  }

  const currentValue = holding.quantity * currentPrice;
  const profitLossAmount = currentValue - investedAmount;

  return {
    holding,
    currentPrice,
    investedAmount,
    currentValue,
    profitLossAmount,
    profitLossPercentage:
      (profitLossAmount / investedAmount) * 100,
  };
}

export function calculatePortfolio(
  holdings: readonly Holding[],
  marketData: readonly NormalizedMarketData[]
): PortfolioCalculation {
  const valuations = holdings.map((holding) =>
    calculateHoldingValuation(
      holding,
      getCurrentPrice(holding, marketData)
    )
  );
  const totalInvested = valuations.reduce(
    (total, valuation) =>
      total + valuation.investedAmount,
    0
  );
  const hasUnavailablePrice = valuations.some(
    ({ currentValue }) => currentValue === null
  );
  const pricedCurrentValue = valuations.reduce(
    (total, valuation) =>
      total + (valuation.currentValue ?? 0),
    0
  );
  const totalCurrentValue = hasUnavailablePrice
    ? null
    : pricedCurrentValue;

  return {
    holdings: valuations,
    summary: {
      totalInvested,
      totalCurrentValue,
      totalProfitLoss:
        totalCurrentValue === null
          ? null
          : totalCurrentValue - totalInvested,
      totalProfitLossPercentage:
        totalCurrentValue === null || totalInvested === 0
          ? null
          : ((totalCurrentValue - totalInvested) /
              totalInvested) *
            100,
    },
  };
}
