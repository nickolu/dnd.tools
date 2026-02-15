"use client";

import { createContext, useContext } from "react";

import type { RouteTransitionContextValue } from "@/components/route-transition/types";

const RouteTransitionContext = createContext<RouteTransitionContextValue | null>(null);

export function RouteTransitionProviderContext({
  children,
  value,
}: {
  children: React.ReactNode;
  value: RouteTransitionContextValue;
}) {
  return (
    <RouteTransitionContext.Provider value={value}>
      {children}
    </RouteTransitionContext.Provider>
  );
}

export function useRouteTransition() {
  const context = useContext(RouteTransitionContext);

  if (!context) {
    throw new Error("useRouteTransition must be used inside RouteTransitionProvider");
  }

  return context;
}
