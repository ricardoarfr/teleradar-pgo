"use client";

import { useState } from "react";
import Link from "next/link"; // Ensure Link is imported here
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUnidades } from "@/hooks/use-catalogo";
import { formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Search, Edit2 } from "lucide-react";

export function UnidadesTable() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const params = {
    page,
    per_page: perPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data, isLoading } = useUnidades(params);

  const unidades = data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout((window as any)._unidadesSearchTimeout);
    (window as any)._unidadesSearchTimeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar unidade..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 w-64"
          />
        </div>

        <Link href="/catalog/unidades/new">
            <Button size="sm">
            <Plus className="h-4 w-4" />
            Nova Unidade
            </Button>
        </Link>
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sigla</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Criada em</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            ) : unidades.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma unidade encontrada.
                </td>
              </tr>
            ) : (
              unidades.map((unidade) => (
                <tr key={unidade.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{unidade.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{unidade.sigla}</td>
                  <td className="px-4 py-3">
                    <Badge variant={unidade.ativa ? "outline" : "secondary"} className={unidade.ativa ? "text-green-600 bg-green-50 border-green-200" : ""}>
                      {unidade.ativa ? "Ativa" : "Inativa"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(unidade.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/catalog/unidades/${unidade.id}/edit`}>
                        <Button variant="ghost" size="icon">
                        <Edit2 className="h-4 w-4" />
                        </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} unidade{total !== 1 ? "s" : ""} no total
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
