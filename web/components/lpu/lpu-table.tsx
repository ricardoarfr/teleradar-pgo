"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLPUs } from "@/hooks/use-lpu";
import { usePartners } from "@/hooks/use-partners"; // Assuming usePartners exists and works
import { formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Eye, Plus, Search } from "lucide-react";

export function LPUTable() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const params = {
    page,
    per_page: perPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data, isLoading } = useLPUs(params);
  // Assuming usePartners fetches all partners for display in the table
  const { data: partnersData, isLoading: isLoadingPartners } = usePartners({ per_page: 100 });

  const lpus = data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  const partners = partnersData?.results ?? [];

  const getPartnerName = (id: string) => {
    return partners.find((p) => p.id === id)?.name ?? "Carregando...";
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout((window as any)._lpuSearchTimeout);
    (window as any)._lpuSearchTimeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  return (
    <div className="space-y-4">
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

        <Link href="/lpu/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nova LPU
          </Button>
        </Link>
      </div>

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
                    {lpu.data_inicio ? formatDate(lpu.data_inicio) : "Não definida"} - {lpu.data_fim ? formatDate(lpu.data_fim) : "Indeterminada"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={lpu.ativa ? "outline" : "secondary"} className={lpu.ativa ? "text-green-600 bg-green-50 border-green-200" : ""}>
                      {lpu.ativa ? "Ativa" : "Inativa"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(lpu.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/lpu/${lpu.id}`}>
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
    </div>
  );
}
