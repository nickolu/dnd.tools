import {
  WIDGET_FILTER_PARAM,
  WIDGET_INTENT_QUERY_PARAM,
  WIDGET_QUERY_PARAM,
} from "@/components/tool-widget-card/constants";
import type { WidgetIntent } from "@/components/tool-widget-card/types";

export function buildWidgetHref(route: string, intent: WidgetIntent): string {
  const searchParams = new URLSearchParams();

  if (intent.target === "search") {
    searchParams.set(WIDGET_INTENT_QUERY_PARAM, "search");
    if (intent.value.trim()) {
      searchParams.set(WIDGET_QUERY_PARAM, intent.value.trim());
    }
  }

  if (intent.target === "filter") {
    searchParams.set(WIDGET_INTENT_QUERY_PARAM, "filter");
    searchParams.set(WIDGET_FILTER_PARAM, intent.filterId);
  }

  const query = searchParams.toString();
  return query ? `${route}?${query}` : route;
}
