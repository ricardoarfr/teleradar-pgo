"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListTenants } from "@/hooks/use-tenants";
import { formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Eye, Plus, Search } from "lucide-react";
import type { TenantStatus } from "@/types/tenant";

function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        status === "ACTIVE"
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
      }`}
    >
      {status === "ACTIVE" ? "Ativa" : "Inativa"}
    </span>
  );
}

export function CompaniesTable() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data, isLoading } = useListTenants({ page, per_page: perPage });

  const allCompanies = data?.results ?? [];
  const companies = debouncedSearch
    ? allCompanies.filter((c) =>
        c.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : allCompanies;
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout((window as any)._companySearchTimeout);
    (window as any)._companySearchTimeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 w-64"
          />
        </div>

        <Link href="/companies/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nova empresa
          </Button>
        </Link>
      </div>

      {/* Tabela */}
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Criada em</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma empresa encontrada.
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{company.name}</td>
                  <td className="px-4 py-3">
                    <TenantStatusBadge status={company.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(company.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/companies/${company.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} empresa{total !== 1 ? "s" : ""} no total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
