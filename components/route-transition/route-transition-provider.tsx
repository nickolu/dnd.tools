"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { TransitionOverlay } from "@/components/route-transition/components/transition-overlay";
import { TRANSITION_DURATION_SECONDS } from "@/components/route-transition/constants";
import { RouteTransitionProviderContext } from "@/components/route-transition/hooks/useRouteTransition";
import type {
  RouteTransitionContextValue,
  RouteTransitionSnapshot,
} from "@/components/route-transition/types";

export function RouteTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [snapshot, setSnapshot] = useState<RouteTransitionSnapshot | null>(null);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    if (snapshot.route !== pathname) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSnapshot(null);
    }, TRANSITION_DURATION_SECONDS * 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pathname, snapshot]);

  const contextValue = useMemo<RouteTransitionContextValue>(
    () => ({
      beginTransition: (nextSnapshot) => {
        setSnapshot(nextSnapshot);
      },
    }),
    []
  );

  return (
    <RouteTransitionProviderContext value={contextValue}>
      {children}
      <AnimatePresence>
        {snapshot ? (
          <TransitionOverlay
            fromRect={snapshot.fromRect}
            key={`${snapshot.route}:${snapshot.title}`}
            title={snapshot.title}
          />
        ) : null}
      </AnimatePresence>
    </RouteTransitionProviderContext>
  );
}
