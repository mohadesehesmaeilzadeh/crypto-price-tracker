const BASE_URL =
  "https://api.kraken.com/0/public";

export async function getTicker(pair) {
  const response = await fetch(
    `${BASE_URL}/Ticker?pair=${encodeURIComponent(
      pair
    )}`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch cryptocurrency data"
    );
  }

  const data = await response.json();

  if (
    data.error &&
    data.error.length > 0
  ) {
    throw new Error(
      data.error.join(", ")
    );
  }

  if (
    !data.result ||
    Object.keys(data.result).length === 0
  ) {
    throw new Error(
      "Cryptocurrency data was not found"
    );
  }

  return data;
}