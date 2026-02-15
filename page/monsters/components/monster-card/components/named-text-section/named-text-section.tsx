import Link from "next/link";

import type { NamedTextSectionProps } from "@/page/monsters/components/monster-card/components/named-text-section/types";
import { buildSpellLinkParts } from "@/page/monsters/components/monster-card/components/named-text-section/utils/buildSpellLinkParts";

function renderTextWithSpellLinks(text: string, spellNames: string[]) {
  return buildSpellLinkParts(text, spellNames).map((part, index) => {
    if (typeof part === "string") {
      return <span key={`text:${index}`}>{part}</span>;
    }

    return (
      <Link
        className="font-medium underline decoration-dotted underline-offset-2 hover:text-primary"
        href={`/spells?q=${encodeURIComponent(part.spellName)}&intent=search`}
        key={`spell:${part.spellName}:${index}`}
        rel="noopener noreferrer"
        target="_blank"
      >
        {part.text}
      </Link>
    );
  });
}

export function NamedTextSection({
  entries,
  spellNames = [],
  title,
}: NamedTextSectionProps) {
  if (!entries.length) {
    return null;
  }

  return (
    <section className="space-y-2 border-t border-[color:var(--color-border-subtle)] pt-3">
      <h3 className="typography-h3">{title}</h3>
      <ul className="typography-body-sm space-y-2">
        {entries.map((entry) => (
          <li key={`${title}:${entry.name}`}>
            <span className="typography-h3">{entry.name}.</span>{" "}
            {spellNames.length
              ? renderTextWithSpellLinks(entry.text, spellNames)
              : entry.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
