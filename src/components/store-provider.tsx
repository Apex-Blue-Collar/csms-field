import { useAppStore } from "@/lib/store";
import { useEffect, type ReactNode } from "react";

export function StoreProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useAppStore.persist.rehydrate();
    useAppStore.getState().hydrateFlag();
  }, []);
  return children;
}
