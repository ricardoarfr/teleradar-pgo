"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLPUItems, useRemoveLPUItem } from "@/hooks/use-catalogo";
import { ChevronLeft, ChevronRight, Plus, Search, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link"; // Adicionando a importação do Link para ser consistente, caso seja necessário no futuro

interface LPUItemsTableProps {
  lpuId: string;
}

export function LPUItemsTable({ lpuId }: LPUItemsTableProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;
  const { toast } = useToast();

  const params = {
    page,
    per_page: perPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data, isLoading } = useLPUItems(lpuId, params);
  const removeMutation = useRemoveLPUItem();

  const items = data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout((window as any)._itemsSearchTimeout);
    (window as any)._itemsSearchTimeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  const handleRemove = async (itemId: string) => {
    if (!confirm("Tem certeza que deseja remover este item da LPU?")) return;

    try {
      await removeMutation.mutateAsync({ lpuId, itemId });
      toast({
        title: "Sucesso",
        description: "Item removido da LPU.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o item.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar item..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 w-64"
          />
        </div>

        {/* Link para adicionar novo item */}
        <Link href={`/catalogo/lpu/${lpuId}/items/new`}>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Adicionar Item
          </Button>
        </Link>
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Atividade</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Unidade</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground text-right">Valor Unitário</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground text-right">Valor Classe</th>
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
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum item encontrado nesta LPU.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{item.servico?.codigo}</td>
                  <td className="px-4 py-3 font-medium">{item.servico?.atividade}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.servico?.unidade?.sigla}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_unitario)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {item.valor_classe ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_classe) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Link href={`/catalogo/lpu/${lpuId}/items/${item.id}/edit`}>
                        <Button variant="ghost" size="icon">
                        <Edit2 className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemove(item.id)}>
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
            {total} item{total !== 1 ? "s" : ""} no total
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
