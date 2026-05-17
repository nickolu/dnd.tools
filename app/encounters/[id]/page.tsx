"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";

import { EncounterEditor } from "@/page/encounters/components";

function EncounterEditorPageContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  if (!id) return null;
  return <EncounterEditor encounterId={id} />;
}

export default function EncounterEditorPage() {
  return (
    <Suspense fallback={null}>
      <EncounterEditorPageContent />
    </Suspense>
  );
}
