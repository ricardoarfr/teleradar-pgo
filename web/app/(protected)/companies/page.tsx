import { CompaniesTable } from "@/components/companies/companies-table";

export const metadata = { title: "Empresas — Teleradar" };

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
        <p className="text-muted-foreground">Gerencie as empresas cadastradas no sistema.</p>
      </div>
      <CompaniesTable />
    </div>
  );
}
