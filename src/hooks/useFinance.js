import { useState, useCallback } from "react";
import { financeStore } from "../lib/storage";
import { parseCSV, buildFinanceState } from "../lib/finance";

const EMPTY_STATE = {
  thisMonth: {
    month: "", earned: 0, came_back: 0, personal: 0, debt_cost: 0, paydown: 0,
    fronted_trucking: 0, repaid_trucking: 0, fronted_dragan: 0, repaid_dragan: 0,
    fronted_bogat: 0, dragan_share: 0, total_in: 0, total_out: 0, net_cash: 0, own_life: 0,
  },
  truckingBalance: 0,
  draganBalance:   0,
  inflow:    [],
  accounts:  [],
  envelope:  [],
  recurring: [],
  trucking: {
    balance: 0,
    thisMonth:  { fronted: 0, repaid: 0 },
    last12:     { fronted: 0, repaid: 0 },
    lifetime:   { fronted: 0, repaid: 0 },
    companies:  {},
    monthly:    [],
  },
  dragan: {
    balance: 0, direct_fronted: 0, dragan_share: 0, repaid: 0,
    share12: 0, repaid12: 0, transactions: [], monthly: [],
  },
  drift:        [],
  transactions: [],
};

export function useFinance() {
  const stored = financeStore.get();
  const [data, setData]         = useState(stored);
  const [importing, setImporting]   = useState(false);
  const [importError, setImportError] = useState(null);

  const importFiles = useCallback(async (files) => {
    setImporting(true);
    setImportError(null);
    try {
      const results = await Promise.all(Array.from(files).map(parseCSV));
      const allTxns = results.flat();
      if (allTxns.length === 0) throw new Error("No valid transactions found in this file.");
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

  const d = data ?? EMPTY_STATE;

  return {
    // F-01 Overview
    inflow:          d.inflow,
    accounts:        d.accounts,
    thisMonth:       d.thisMonth,
    truckingBalance: d.truckingBalance,
    draganBalance:   d.draganBalance,
    // F-02 Month
    envelope:        d.envelope,
    // F-03 Recurring
    recurring:       d.recurring,
    // F-04 Split
    trucking:        d.trucking,
    dragan:          d.dragan,
    // F-05 Drift
    drift:           d.drift,
    // all
    transactions:    d.transactions,
    hasData:         !!data,
    importedAt:      financeStore.importedAt(),
    importing, importError, importFiles, clearData,
  };
}
