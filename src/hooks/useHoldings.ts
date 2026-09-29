import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  isSupportedCryptocurrencySymbol,
} from "../config/cryptocurrencies";
import type {
  Holding,
  HoldingInput,
} from "../types/crypto";

export const HOLDINGS_STORAGE_KEY =
  "crypto-price-tracker:holdings";

interface StoredHoldings {
  version: 1;
  holdings: Holding[];
}

interface HoldingsState {
  holdings: readonly Holding[];
  createHolding: (input: HoldingInput) => void;
  updateHolding: (
    id: string,
    input: HoldingInput
  ) => void;
  deleteHolding: (id: string) => void;
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

function isPositiveFiniteNumber(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

function isHolding(value: unknown): value is Holding {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    isSupportedCryptocurrencySymbol(value.symbol) &&
    isPositiveFiniteNumber(value.quantity) &&
    isPositiveFiniteNumber(value.averageBuyPrice)
  );
}

function readStoredHoldings(): Holding[] {
  try {
    const storedValue = window.localStorage.getItem(
      HOLDINGS_STORAGE_KEY
    );

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (
      !isRecord(parsedValue) ||
      parsedValue.version !== 1 ||
      !Array.isArray(parsedValue.holdings)
    ) {
      return [];
    }

    const ids = new Set<string>();

    return parsedValue.holdings.filter(
      (holding): holding is Holding => {
        if (!isHolding(holding) || ids.has(holding.id)) {
          return false;
        }

        ids.add(holding.id);
        return true;
      }
    );
  } catch {
    return [];
  }
}

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function useHoldings(): HoldingsState {
  const [holdings, setHoldings] = useState<Holding[]>(
    readStoredHoldings
  );

  useEffect(() => {
    const storedHoldings: StoredHoldings = {
      version: 1,
      holdings,
    };

    try {
      window.localStorage.setItem(
        HOLDINGS_STORAGE_KEY,
        JSON.stringify(storedHoldings)
      );
    } catch {
      // The portfolio still works in memory when storage
      // is unavailable or restricted.
    }
  }, [holdings]);

  const createHolding = useCallback(
    (input: HoldingInput): void => {
      setHoldings((current) => [
        ...current,
        { id: createId(), ...input },
      ]);
    },
    []
  );

  const updateHolding = useCallback(
    (id: string, input: HoldingInput): void => {
      setHoldings((current) =>
        current.map((holding) =>
          holding.id === id
            ? { id: holding.id, ...input }
            : holding
        )
      );
    },
    []
  );

  const deleteHolding = useCallback((id: string): void => {
    setHoldings((current) =>
      current.filter((holding) => holding.id !== id)
    );
  }, []);

  return {
    holdings,
    createHolding,
    updateHolding,
    deleteHolding,
  };
}
