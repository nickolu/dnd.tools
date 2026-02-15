import { MonsterAdminEditPage } from "@/page/admin-monsters-create/components";

type AdminMonsterEditRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminMonsterEditRoute({
  params,
}: AdminMonsterEditRouteProps) {
  const { id } = await params;
  return <MonsterAdminEditPage entryId={id} />;
}
