import { UsersTable } from "@/components/users/users-table";

export const metadata = { title: "Usuários — Teleradar" };

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
        <p className="text-muted-foreground">Gerencie os usuários do sistema.</p>
      </div>
      <UsersTable />
    </div>
  );
}
