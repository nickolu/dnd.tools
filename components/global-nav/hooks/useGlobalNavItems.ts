import { useMemo } from "react";

import { GLOBAL_NAV_ITEMS } from "@/components/global-nav/constants";
import { getIsActivePath } from "@/components/global-nav/utils/getIsActivePath";

export function useGlobalNavItems(pathname: string) {
  return useMemo(
    () =>
      GLOBAL_NAV_ITEMS.map((item) => ({
        ...item,
        isActive: getIsActivePath(pathname, item.href),
      })),
    [pathname]
  );
}
