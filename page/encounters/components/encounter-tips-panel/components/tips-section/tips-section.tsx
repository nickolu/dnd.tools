"use client";

type Props = {
  title: string;
  items?: string[];
  paragraph?: string;
};

export function TipsSection({ title, items, paragraph }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <span className="typography-kicker text-muted">{title}</span>
      {items && items.length > 0 ? (
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {items.map((item, i) => (
            <li key={i} className="typography-body-sm">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      {paragraph ? (
        <p className="typography-body-sm whitespace-pre-line">{paragraph}</p>
      ) : null}
    </div>
  );
}
