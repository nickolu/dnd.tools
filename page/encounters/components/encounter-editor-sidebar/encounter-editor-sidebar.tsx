"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { EncounterTipsPanel } from "../encounter-tips-panel";
import { InitiativeTracker } from "../initiative-tracker";
import { SpellAggregatePanel } from "../spell-aggregate-panel";

type Tab = "combat" | "spells" | "tips";

const TABS: readonly { id: Tab; label: string }[] = [
  { id: "combat", label: "Combat" },
  { id: "spells", label: "Spells" },
  { id: "tips", label: "Tips" },
];

function isTab(v: string | null): v is Tab {
  return v === "combat" || v === "spells" || v === "tips";
}

type Props = {
  encounterId: string;
};

export function EncounterEditorSidebar({ encounterId }: Props) {
  // URL is the seed for the initial tab. On `lg+` viewports we render all
  // three panels stacked so the tab state only matters for narrow viewports.
  // We do not keep tab state synchronized with browser back/forward — the
  // editor route itself handles that. This is a UI-only preference.
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

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile tabs (hidden on lg+) */}
      <div
        className="flex gap-1 lg:hidden"
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

      {/* Desktop: stack all three panels. Mobile: show the selected tab. */}
      <div
        className={
          tab === "combat"
            ? "flex flex-col gap-4"
            : "hidden lg:flex lg:flex-col lg:gap-4"
        }
      >
        <InitiativeTracker encounterId={encounterId} />
      </div>
      <div
        className={
          tab === "spells"
            ? "flex flex-col gap-4"
            : "hidden lg:flex lg:flex-col lg:gap-4"
        }
      >
        <SpellAggregatePanel encounterId={encounterId} />
      </div>
      <div
        className={
          tab === "tips"
            ? "flex flex-col gap-4"
            : "hidden lg:flex lg:flex-col lg:gap-4"
        }
      >
        <EncounterTipsPanel encounterId={encounterId} />
      </div>
    </div>
  );
}
