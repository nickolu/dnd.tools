"use client";

import { Suspense } from "react";

import { EncounterList } from "@/page/encounters/components";

export default function EncountersPage() {
  return (
    <Suspense fallback={null}>
      <EncounterList />
    </Suspense>
  );
}
