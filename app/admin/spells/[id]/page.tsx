import { SpellAdminEditPage } from "@/page/admin-spells-create/components";

type AdminSpellEditRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminSpellEditRoute({
  params,
}: AdminSpellEditRouteProps) {
  const { id } = await params;
  return <SpellAdminEditPage entryId={id} />;
}
