export function formatPrice(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "$0.00";
  }

  return number.toLocaleString(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}