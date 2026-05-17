"use client";

import type { EncounterRuleset } from "@/lib/domain/encounter/encounter.schema";
import {
  RULESET_HELP_BY_VALUE,
  RULESET_LABEL_BY_VALUE,
} from "@/page/encounters/constants";

type Props = {
  ruleset: EncounterRuleset;
  onChange: (next: EncounterRuleset) => void;
};

const OPTIONS: EncounterRuleset[] = ["basic", "advanced"];

export function RulesetToggle({ ruleset, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <span className="typography-kicker text-muted">CR 2.0 ruleset</span>
      <div className="flex gap-1">
        {OPTIONS.map((value) => (
          <button
            key={value}
            type="button"
            data-active={value === ruleset}
            className="filter-chip"
            onClick={() => onChange(value)}
            aria-pressed={value === ruleset}
          >
            {RULESET_LABEL_BY_VALUE[value]}
          </button>
        ))}
      </div>
      <p className="typography-body-sm text-muted">
        {RULESET_HELP_BY_VALUE[ruleset]}
      </p>
    </div>
  );
}
