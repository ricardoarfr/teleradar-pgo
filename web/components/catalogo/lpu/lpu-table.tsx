"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useLPUs } from "@/hooks/use-catalogo";
import { usePartners } from "@/hooks/use-partners";
import { useListTenants } from "@/hooks/use-tenants";
import { getMeAction } from "@/actions/auth-actions";
import { formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Eye, Plus, Search } from "lucide-react";

export function LPUTable() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const perPage = 20;

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMeAction });
  const isMasterWithoutTenant = me?.role === "MASTER" && !me?.tenant_id;

  const { data: tenantsData } = useListTenants();
  const tenants = tenantsData?.results ?? [];

  // Para MASTER sem tenant: usa o tenant selecionado; para demais: undefined (backend resolve)
  const effectiveTenantId = isMasterWithoutTenant ? selectedTenantId || undefined : undefined;

  const params = {
    page,
    per_page: perPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data, isLoading } = useLPUs(params, effectiveTenantId);
  const { data: partnersData, isLoading: isLoadingPartners } = usePartners({ per_page: 100 });

  const lpus = data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  const partners = partnersData?.results ?? [];

  const getPartnerName = (id: string) => {
    return partners.find((p) => p.profile_id === id)?.name ?? "—";
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout((window as any)._lpuSearchTimeout);
    (window as any)._lpuSearchTimeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  // Link para detalhe: inclui tenant_id na URL quando MASTER sem tenant
  const detailHref = (lpuId: string) =>
    effectiveTenantId
      ? `/catalogo/lpu/${lpuId}?tenant_id=${effectiveTenantId}`
      : `/catalogo/lpu/${lpuId}`;

  const newHref = effectiveTenantId
    ? `/catalogo/lpu/new?tenant_id=${effectiveTenantId}`
    : "/catalogo/lpu/new";

  return (
    <div className="space-y-4">
      {/* Seletor de tenant para MASTER sem tenant */}
      {isMasterWithoutTenant && (
        <div className="space-y-2 pb-4 border-b">
          <Label htmlFor="tenant-select">Tenant</Label>
          <p className="text-xs text-muted-foreground">
            Como MASTER, selecione o tenant para visualizar as LPUs.
          </p>
          <select
            id="tenant-select"
            value={selectedTenantId}
            onChange={(e) => { setSelectedTenantId(e.target.value); setPage(1); }}
            className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Selecione um tenant...</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar LPU..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </div>

        <Link href={newHref}>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nova LPU
          </Button>
        </Link>
      </div>

      {/* Aviso quando MASTER sem tenant selecionado */}
      {isMasterWithoutTenant && !selectedTenantId ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Selecione um tenant acima para visualizar as LPUs.
        </p>
      ) : (
        <>
          {/* Tabela */}
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Parceiro</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vigência</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Criado em</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading || isLoadingPartners ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Carregando...
                    </td>
                  </tr>
                ) : lpus.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma LPU encontrada.
                    </td>
                  </tr>
                ) : (
                  lpus.map((lpu) => (
                    <tr key={lpu.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{lpu.nome}</td>
                      <td className="px-4 py-3 text-muted-foreground">{getPartnerName(lpu.parceiro_id)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {lpu.data_inicio ? formatDate(lpu.data_inicio) : "Não definida"} -{" "}
                        {lpu.data_fim ? formatDate(lpu.data_fim) : "Indeterminada"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={lpu.ativa ? "outline" : "secondary"}
                          className={lpu.ativa ? "text-green-600 bg-green-50 border-green-200" : ""}
                        >
                          {lpu.ativa ? "Ativa" : "Inativa"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(lpu.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={detailHref(lpu.id)}>
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
                {total} LPU{total !== 1 ? "s" : ""} no total
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
        </>
      )}
    </div>
  );
}
