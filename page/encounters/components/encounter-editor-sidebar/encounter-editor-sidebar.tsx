"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { EncounterMap } from "../encounter-map";
import { EncounterTipsPanel } from "../encounter-tips-panel";
import { InitiativeTracker } from "../initiative-tracker";
import { SpellAggregatePanel } from "../spell-aggregate-panel";

type Tab = "combat" | "spells" | "tips" | "map";

const TABS: readonly { id: Tab; label: string }[] = [
  { id: "combat", label: "Combat" },
  { id: "spells", label: "Spells" },
  { id: "tips", label: "Tips" },
  { id: "map", label: "Map" },
];

function isTab(v: string | null): v is Tab {
  return v === "combat" || v === "spells" || v === "tips" || v === "map";
}

type Props = {
  encounterId: string;
};

export function EncounterEditorSidebar({ encounterId }: Props) {
  // URL is the seed for the initial tab. On `lg+` viewports we render all
  // panels stacked so the tab state only matters for narrow viewports.
  const searchParams = useSearchParams();
  const initialTab: Tab = (() => {
    const v = searchParams?.get("panel") ?? null;
    return isTab(v) ? v : "combat";
  })();
  const [tab, setTab] = useState<Tab>(initialTab);

  function handleSelectTab(next: Tab) {
    setTab(next);
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("panel", next);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", url);
  }

  function panelClass(target: Tab): string {
    return tab === target
      ? "flex flex-col gap-4"
      : "hidden lg:flex lg:flex-col lg:gap-4";
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile tabs (hidden on lg+) */}
      <div
        className="flex flex-wrap gap-1 lg:hidden"
        role="tablist"
        aria-label="Encounter panels"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className="filter-chip"
            data-active={tab === t.id}
            onClick={() => handleSelectTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Desktop: stack all panels. Mobile: show the selected tab. */}
      <div className={panelClass("combat")}>
        <InitiativeTracker encounterId={encounterId} />
      </div>
      <div className={panelClass("spells")}>
        <SpellAggregatePanel encounterId={encounterId} />
      </div>
      <div className={panelClass("tips")}>
        <EncounterTipsPanel encounterId={encounterId} />
      </div>
      <div className={panelClass("map")}>
        <EncounterMap encounterId={encounterId} />
      </div>
    </div>
  );
}
