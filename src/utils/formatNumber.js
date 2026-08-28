export function formatNumber(value) {
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