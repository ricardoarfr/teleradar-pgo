import { PartnersTable } from "@/components/partners/partners-table";

export const metadata = { title: "Parceiros — Teleradar" };

export default function PartnersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Parceiros</h1>
        <p className="text-muted-foreground">Gerencie os parceiros cadastrados no sistema.</p>
      </div>
      <PartnersTable />
    </div>
  );
}
