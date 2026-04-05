"use client";

import { Suspense } from "react";
import { HexCrawlGenerator } from "@/page/mausritter/components";

function MausritterPageContent() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <HexCrawlGenerator />
    </main>
  );
}

export default function MausritterPage() {
  return (
    <Suspense fallback={null}>
      <MausritterPageContent />
    </Suspense>
  );
}
