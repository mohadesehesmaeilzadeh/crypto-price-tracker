import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  ChartRange,
  PriceChartProps,
} from "../types/crypto";

const currencyFormatter = new Intl.NumberFormat(
  "en-US",
  {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }
);

const compactCurrencyFormatter =
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  });

const timeFormatter = new Intl.DateTimeFormat(
  "en-US",
  {
    hour: "numeric",
    minute: "2-digit",
  }
);

const dateFormatter = new Intl.DateTimeFormat(
  "en-US",
  {
    month: "short",
    day: "numeric",
  }
);

const tooltipDateFormatter =
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function formatAxisTime(
  timestamp: number,
  range: ChartRange
): string {
  const date = new Date(timestamp);

  return range === "24H"
    ? timeFormatter.format(date)
    : dateFormatter.format(date);
}

function PriceChart({
  points,
  range,
  symbol,
  status,
  error,
  onRetry,
}: PriceChartProps) {
  if (status === "loading") {
    return (
      <div
        className="chart-state chart-loading"
        role="status"
      >
        Loading historical prices...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="chart-state" role="alert">
        <p>{error}</p>
        <button
          type="button"
          className="chart-retry-button"
          onClick={onRetry}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (status === "empty" || points.length === 0) {
    return (
      <div className="chart-state">
        No historical prices are available for
        this range.
      </div>
    );
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const direction =
    lastPoint.price >= firstPoint.price
      ? "up"
      : "down";
  const chartColor =
    direction === "up" ? "#2dd4bf" : "#fb7185";

  return (
    <div
      className="price-chart"
      aria-label={`${symbol} ${range} price chart, trending ${direction} from ${currencyFormatter.format(
        firstPoint.price
      )} to ${currencyFormatter.format(
        lastPoint.price
      )}.`}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={260}
        debounce={50}
      >
        <AreaChart
          data={points}
          margin={{
            top: 12,
            right: 8,
            bottom: 0,
            left: 0,
          }}
          accessibilityLayer
        >
          <defs>
            <linearGradient
              id="price-chart-fill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={chartColor}
                stopOpacity={0.18}
              />
              <stop
                offset="95%"
                stopColor={chartColor}
                stopOpacity={0.01}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#273449"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(value: number) =>
              formatAxisTime(value, range)
            }
            tick={{ fill: "#8fa0b8", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#334155" }}
            minTickGap={36}
          />
          <YAxis
            dataKey="price"
            domain={["auto", "auto"]}
            tickFormatter={(value: number) =>
              compactCurrencyFormatter.format(value)
            }
            tick={{ fill: "#8fa0b8", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip
            formatter={(value) => [
              currencyFormatter.format(
                Number(
                  Array.isArray(value)
                    ? value[0]
                    : value ?? 0
                )
              ),
              "Price",
            ]}
            labelFormatter={(label) =>
              tooltipDateFormatter.format(
                new Date(Number(label))
              )
            }
            contentStyle={{
              backgroundColor: "#172033",
              color: "#f8fafc",
              border: "1px solid #334155",
              borderRadius: "10px",
              boxShadow:
                "0 12px 30px rgba(15, 23, 42, 0.12)",
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            name="Price"
            stroke={chartColor}
            strokeWidth={2}
            fill="url(#price-chart-fill)"
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PriceChart;
