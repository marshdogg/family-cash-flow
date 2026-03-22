"use client";

import { createContext, useContext } from "react";
import { useStore } from "./useStore";

type StoreReturn = ReturnType<typeof useStore>;

const StoreContext = createContext<StoreReturn | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();
  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
}

export function useSharedStore(): StoreReturn {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useSharedStore must be used within StoreProvider");
  return ctx;
}
