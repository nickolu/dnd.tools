import { useState } from "react";

import type { WidgetIntent } from "@/components/tool-widget-card/types";

export function useWidgetIntent() {
  const [intent, setIntent] = useState<WidgetIntent>({ target: "card" });

  return {
    intent,
    setIntent,
  };
}
