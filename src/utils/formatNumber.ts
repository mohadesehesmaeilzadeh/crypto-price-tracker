import type {
  VolumeValue,
} from "../types/crypto";

export function formatNumber(
  value: VolumeValue
): string {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "0";
  }

  return number.toLocaleString(
    "en-US",
    {
      maximumFractionDigits: 2,
    }
  );
}
