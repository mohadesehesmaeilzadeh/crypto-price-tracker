import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  isSupportedCryptocurrencySymbol,
} from "../config/cryptocurrencies";
import type {
  CryptocurrencySymbol,
} from "../types/crypto";

export const WATCHLIST_STORAGE_KEY =
  "crypto-price-tracker:watchlist";

interface StoredWatchlist {
  version: 1;
  symbols: CryptocurrencySymbol[];
}

interface WatchlistState {
  symbols: readonly CryptocurrencySymbol[];
  symbolSet: ReadonlySet<CryptocurrencySymbol>;
  toggle: (
    symbol: CryptocurrencySymbol
  ) => void;
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readStoredWatchlist(): CryptocurrencySymbol[] {
  try {
    const storedValue = window.localStorage.getItem(
      WATCHLIST_STORAGE_KEY
    );

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown =
      JSON.parse(storedValue);

    if (
      !isRecord(parsedValue) ||
      parsedValue.version !== 1 ||
      !Array.isArray(parsedValue.symbols)
    ) {
      return [];
    }

    return Array.from(
      new Set(
        parsedValue.symbols.filter(
          isSupportedCryptocurrencySymbol
        )
      )
    );
  } catch {
    return [];
  }
}

export function useWatchlist(): WatchlistState {
  const [symbols, setSymbols] = useState<
    CryptocurrencySymbol[]
  >(readStoredWatchlist);

  useEffect(() => {
    const storedWatchlist: StoredWatchlist = {
      version: 1,
      symbols,
    };

    try {
      window.localStorage.setItem(
        WATCHLIST_STORAGE_KEY,
        JSON.stringify(storedWatchlist)
      );
    } catch {
      // Persistence can be unavailable in private or
      // storage-restricted browser contexts.
    }
  }, [symbols]);

  const toggle = useCallback(
    (symbol: CryptocurrencySymbol): void => {
      setSymbols((currentSymbols) =>
        currentSymbols.includes(symbol)
          ? currentSymbols.filter(
              (currentSymbol) =>
                currentSymbol !== symbol
            )
          : [...currentSymbols, symbol]
      );
    },
    []
  );

  const symbolSet = useMemo(
    () => new Set(symbols),
    [symbols]
  );

  return {
    symbols,
    symbolSet,
    toggle,
  };
}
