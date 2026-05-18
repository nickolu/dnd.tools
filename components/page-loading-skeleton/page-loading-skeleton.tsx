export function PageLoadingSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div
        className="h-8 w-48 animate-pulse rounded-md"
        style={{ background: "var(--color-border-subtle)" }}
      />
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg"
            style={{ background: "var(--color-border-subtle)" }}
          />
        ))}
      </div>
    </div>
  );
}
