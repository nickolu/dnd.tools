"use client";

import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useSpell } from "@/lib/query/hooks/useSpells";
import { SpellCard } from "@/page/spells/components";

function SpellDetailContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";
  const id = decodeURIComponent(params.id);

  const { data: spell, isLoading, isError, error } = useSpell(id);

  if (isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <p className="typography-body-sm text-muted">Loading spell...</p>
      </main>
    );
  }

  if (isError || !spell) {
    const is404 =
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "NOT_FOUND";

    if (is404) {
      notFound();
    }

    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <section className="surface-card p-6">
          <p className="typography-body-sm text-secondary">
            Spell not found or failed to load.
          </p>
          {!isEmbed && (
            <Link className="site-nav-link mt-3 inline-block" href="/spells">
              Back to Spells
            </Link>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      {!isEmbed && (
        <div>
          <Link className="site-nav-link" href="/spells">
            &larr; Back to Spells
          </Link>
        </div>
      )}
      <SpellCard isAdminMode={false} spell={spell} />
    </main>
  );
}

export default function SpellDetailPage() {
  return (
    <Suspense fallback={null}>
      <SpellDetailContent />
    </Suspense>
  );
}
