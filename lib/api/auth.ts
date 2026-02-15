import type { NextRequest } from "next/server";

const WRITE_ROLES = new Set(["admin", "editor"]);

export const canWrite = (request: NextRequest) => {
  const roleHeader = request.headers.get("x-dnd-role")?.toLowerCase() ?? "";
  return WRITE_ROLES.has(roleHeader);
};
