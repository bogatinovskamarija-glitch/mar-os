import { useState, useCallback } from "react";
import { financeStore } from "../lib/storage";
import { parseCSV, buildFinanceState } from "../lib/finance";
import { FALLBACK_ENVELOPE, FALLBACK_ACCOUNTS } from "../data";

const EMPTY_CANTILEVER = {
  fronted: [],
  priorBalance: 0,
  ageBuckets: [
    { label: "0–30 days", amount: 0 },
    { label: "31–60 days", amount: 0 },
    { label: "61–90 days", amount: 0 },
    { label: "90+ days", amount: 0 },
  ],
};

const EMPTY_TREND = ["Apr","May","Jun","Jul","Aug","Sep"].map((m) => ({
  m, inflow: 0, outflow: 0, float: 0,
}));

export function useFinance() {
  const stored = financeStore.get();
  const [data, setData] = useState(stored);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);

  const importFiles = useCallback(async (files) => {
    setImporting(true);
    setImportError(null);
    try {
      const results = await Promise.all(Array.from(files).map(parseCSV));
      const allTxns = results.flat();
      const state = buildFinanceState(allTxns);
      financeStore.set(state);
      setData(state);
    } catch (e) {
      setImportError(e.message);
    } finally {
      setImporting(false);
    }
  }, []);

  const clearData = useCallback(() => {
    localStorage.removeItem("finance:data");
    localStorage.removeItem("finance:importedAt");
    setData(null);
  }, []);

  const envelope = data?.envelope ?? FALLBACK_ENVELOPE;
  const inflow = data?.inflow ?? [];
  const cantilever = data?.cantilever ?? EMPTY_CANTILEVER;
  const accounts = data?.accounts ?? FALLBACK_ACCOUNTS;
  const trend = data?.trend ?? EMPTY_TREND;
  const importedAt = financeStore.importedAt();
  const hasData = !!data;

  return {
    envelope, inflow, cantilever, accounts, trend,
    hasData, importedAt,
    importFiles, importing, importError, clearData,
  };
}
