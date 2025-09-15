"use client";
import { createContext, useContext, useState, useMemo } from "react";

type View = "grid" | "list";
type UiCtx = { view: View; setView: (v: View) => void };

const Ctx = createContext<UiCtx>({ view: "grid", setView: () => {} });

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<View>("grid");
  const value = useMemo(() => ({ view, setView }), [view]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUi() {
  return useContext(Ctx);
}
