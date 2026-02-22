import { ClientsTable } from "@/components/clients/clients-table";

export const metadata = { title: "Clientes — Teleradar" };

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground">Gerencie os clientes cadastrados no sistema.</p>
      </div>
      <ClientsTable />
    </div>
  );
}
