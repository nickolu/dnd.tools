"use client";

import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useMonster } from "@/lib/query/hooks/useMonsters";
import { MonsterCard } from "@/page/monsters/components";

function MonsterDetailContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";
  const id = decodeURIComponent(params.id);

  const { data: monster, isLoading, isError, error } = useMonster(id);

  if (isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <p className="typography-body-sm text-muted">Loading monster...</p>
      </main>
    );
  }

  if (isError || !monster) {
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
            Monster not found or failed to load.
          </p>
          {!isEmbed && (
            <Link className="site-nav-link mt-3 inline-block" href="/monsters">
              Back to Monsters
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
          <Link className="site-nav-link" href="/monsters">
            &larr; Back to Monsters
          </Link>
        </div>
      )}
      <MonsterCard isAdminMode={false} monster={monster} />
    </main>
  );
}

export default function MonsterDetailPage() {
  return (
    <Suspense fallback={null}>
      <MonsterDetailContent />
    </Suspense>
  );
}
