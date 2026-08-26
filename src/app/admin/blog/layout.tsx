import type { ReactNode } from "react";
import { requireAdminRole } from "@/lib/security/auth";

export const dynamic = "force-dynamic";

export default async function BlogLayout({ children }: { children: ReactNode }) {
  await requireAdminRole(["owner", "admin", "manager", "content"]);
  return <>{children}</>;
}
