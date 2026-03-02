"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMateriais, useUnidades, useDeleteMaterial } from "@/hooks/use-catalogo";
import { toast } from "@/components/ui/use-toast";
import { ChevronLeft, ChevronRight, Plus, Search, Edit2, Trash2 } from "lucide-react";

export function MateriaisTable() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const params = {
    page,
    per_page: perPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data, isLoading } = useMateriais(params);
  const { data: unidadesData } = useUnidades({ per_page: 100 });
  const deleteMutation = useDeleteMaterial();

  const materiais = data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  const getUnidadeSigla = (id: string) => {
    return unidadesData?.results.find((u) => u.id === id)?.sigla ?? "—";
  };

  const handleDelete = async (id: string, descricao: string) => {
    if (!confirm(`Tem certeza que deseja excluir o material "${descricao}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Material excluído!", description: "O material foi removido com sucesso." });
    } catch (err: any) {
      toast({
        title: "Erro ao excluir",
        description: err?.response?.data?.detail ?? "Não foi possível excluir o material.",
        variant: "destructive",
      });
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout((window as any)._materiaisSearchTimeout);
    (window as any)._materiaisSearchTimeout = setTimeout(() => {
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
            placeholder="Buscar material por código ou descrição..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 w-80"
          />
        </div>

        <Link href="/catalogo/materiais/new">
            <Button size="sm">
            <Plus className="h-4 w-4" />
            Novo Material
            </Button>
        </Link>
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descrição</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Unidade</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
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
            ) : materiais.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum material encontrado.
                </td>
              </tr>
            ) : (
              materiais.map((material) => (
                <tr key={material.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{material.codigo}</td>
                  <td className="px-4 py-3 text-muted-foreground">{material.descricao}</td>
                  <td className="px-4 py-3 text-muted-foreground">{getUnidadeSigla(material.unidade_id)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={material.ativo ? "outline" : "secondary"} className={material.ativo ? "text-green-600 bg-green-50 border-green-200" : ""}>
                      {material.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Link href={`/catalogo/materiais/${material.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(material.id, material.descricao)}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} material{total !== 1 ? "s" : ""} no total
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
