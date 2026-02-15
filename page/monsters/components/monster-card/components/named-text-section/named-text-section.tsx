import type { NamedTextSectionProps } from "@/page/monsters/components/monster-card/components/named-text-section/types";

export function NamedTextSection({ entries, title }: NamedTextSectionProps) {
  if (!entries.length) {
    return null;
  }

  return (
    <section className="space-y-2 border-t border-[color:var(--color-border-subtle)] pt-3">
      <h3 className="text-base font-semibold">{title}</h3>
      <ul className="space-y-2 text-sm leading-6">
        {entries.map((entry) => (
          <li key={`${title}:${entry.name}`}>
            <span className="font-semibold">{entry.name}.</span> {entry.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
