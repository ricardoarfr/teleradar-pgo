"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useServicos, useClasses, useUnidades } from "@/hooks/use-lpu";
import { formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Search, Edit2 } from "lucide-react";
import Link from "next/link";

export function ServicosTable() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const params = {
    page,
    per_page: perPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data, isLoading } = useServicos(params);
  const { data: classesData } = useClasses({ per_page: 100 });
  const { data: unidadesData } = useUnidades({ per_page: 100 });

  const servicos = data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  const getClasseNome = (id: string) => {
    return classesData?.results.find((c) => c.id === id)?.nome ?? "—";
  };

  const getUnidadeSigla = (id: string) => {
    return unidadesData?.results.find((u) => u.id === id)?.sigla ?? "—";
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout((window as any)._servicosSearchTimeout);
    (window as any)._servicosSearchTimeout = setTimeout(() => {
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
            placeholder="Buscar serviço por código ou atividade..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 w-80"
          />
        </div>

        <Link href="/catalog/servicos/new">
            <Button size="sm">
            <Plus className="h-4 w-4" />
            Novo Serviço
            </Button>
        </Link>
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Atividade</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Classe</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Unidade</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            ) : servicos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum serviço encontrado.
                </td>
              </tr>
            ) : (
              servicos.map((servico) => (
                <tr key={servico.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{servico.codigo}</td>
                  <td className="px-4 py-3 text-muted-foreground">{servico.atividade}</td>
                  <td className="px-4 py-3 text-muted-foreground">{getClasseNome(servico.classe_id)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{getUnidadeSigla(servico.unidade_id)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={servico.ativo ? "outline" : "secondary"} className={servico.ativo ? "text-green-600 bg-green-50 border-green-200" : ""}>
                      {servico.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/catalog/servicos/${servico.id}/edit`}>
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
            {total} serviço{total !== 1 ? "s" : ""} no total
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
