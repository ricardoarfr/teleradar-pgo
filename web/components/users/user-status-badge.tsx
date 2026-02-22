import { Badge } from "@/components/ui/badge";
import type { UserStatus } from "@/types/user";

const statusConfig: Record<UserStatus, { label: string; variant: "success" | "warning" | "destructive" | "outline" }> = {
  APPROVED: { label: "Aprovado", variant: "success" },
  PENDING: { label: "Pendente", variant: "warning" },
  BLOCKED: { label: "Bloqueado", variant: "destructive" },
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const config = statusConfig[status] ?? { label: status, variant: "outline" };
  return <Badge variant={config.variant as any}>{config.label}</Badge>;
}
