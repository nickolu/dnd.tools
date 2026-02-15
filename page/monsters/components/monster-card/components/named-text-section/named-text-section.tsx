import type { NamedTextSectionProps } from "@/page/monsters/components/monster-card/components/named-text-section/types";

export function NamedTextSection({ entries, title }: NamedTextSectionProps) {
  if (!entries.length) {
    return null;
  }

  return (
    <section className="space-y-2 border-t border-[color:var(--color-border-subtle)] pt-3">
      <h3 className="typography-h3">{title}</h3>
      <ul className="typography-body-sm space-y-2">
        {entries.map((entry) => (
          <li key={`${title}:${entry.name}`}>
            <span className="typography-h3">{entry.name}.</span> {entry.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
