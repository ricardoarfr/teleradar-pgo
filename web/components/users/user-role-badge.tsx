import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types/user";
import { formatRole } from "@/lib/utils";

const roleVariant: Record<UserRole, string> = {
  MASTER: "bg-purple-100 text-purple-800",
  ADMIN: "bg-blue-100 text-blue-800",
  MANAGER: "bg-indigo-100 text-indigo-800",
  STAFF: "bg-gray-100 text-gray-800",
  CLIENT: "bg-green-100 text-green-800",
};

export function UserRoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleVariant[role] ?? "bg-gray-100 text-gray-800"}`}
    >
      {formatRole(role)}
    </span>
  );
}
