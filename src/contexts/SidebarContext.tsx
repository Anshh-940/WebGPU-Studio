"use client";

import { createContext, useContext, type ReactNode } from "react";

type SidebarContextValue = {
  expandSidebar: () => void;
  /** Desktop rail expanded (wide) or mobile drawer open — use to offset bottom chrome. */
  isLhsNavOpen: boolean;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  return ctx;
}

export function SidebarProvider({
  children,
  expandSidebar,
  isLhsNavOpen,
}: {
  children: ReactNode;
  expandSidebar: () => void;
  isLhsNavOpen: boolean;
}) {
  return (
    <SidebarContext.Provider value={{ expandSidebar, isLhsNavOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}
