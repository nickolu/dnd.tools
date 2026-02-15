import type { SpellTextBlockProps } from "@/page/spells/components/spell-card/components/spell-text-block/types";

export function SpellTextBlock({ paragraphs, title }: SpellTextBlockProps) {
  if (!paragraphs.length) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="space-y-2 text-sm leading-6">
        {paragraphs.map((paragraph, index) => (
          <p key={`${title}:${index}`}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
