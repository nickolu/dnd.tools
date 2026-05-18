"use client";

import { Suspense } from "react";

import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";
import { EncounterList } from "@/page/encounters/components";

export default function EncountersPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <EncounterList />
    </Suspense>
  );
}
