import type {
  PriceValue,
} from "../types/crypto";

export function formatPrice(
  value: PriceValue,
  stablecoin = false
): string {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "$0.00";
  }

  return number.toLocaleString(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: stablecoin ? 4 : 2,
      maximumFractionDigits:
        stablecoin || Math.abs(number) < 1 ? 6 : 2,
    }
  );
}
