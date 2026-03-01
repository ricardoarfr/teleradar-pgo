"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useServicos, useDeleteServico } from "@/hooks/use-catalogo";
import { ChevronLeft, ChevronRight, Edit2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function ServicoTable() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const params = {
    page,
    per_page: perPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data, isLoading } = useServicos(params);
  const deleteMutation = useDeleteServico();

  const servicos = data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout((window as any)._servicoSearchTimeout);
    (window as any)._servicoSearchTimeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir a atividade "${nome}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Atividade excluída!", description: "A atividade foi removida com sucesso." });
    } catch (err: any) {
      toast({
        title: "Erro ao excluir",
        description: err?.response?.data?.detail ?? "Não foi possível excluir a atividade.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar atividade..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 w-64"
          />
        </div>
        <Link href="/catalogo/servicos/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nova atividade
          </Button>
        </Link>
      </div>

      {/* Tabela */}
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
                  Nenhuma atividade encontrada.
                </td>
              </tr>
            ) : (
              servicos.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{s.codigo}</td>
                  <td className="px-4 py-3 font-medium">{s.atividade}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.classe?.nome ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.unidade?.sigla ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={s.ativo ? "outline" : "secondary"}
                      className={s.ativo ? "text-green-600 bg-green-50 border-green-200" : ""}
                    >
                      {s.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Link href={`/catalogo/servicos/${s.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(s.id, s.atividade)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
            {total} atividade{total !== 1 ? "s" : ""} no total
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
            <span className="text-sm">{page} / {totalPages}</span>
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
