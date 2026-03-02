"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useContratos, useDeleteContrato } from "@/hooks/use-contratos";
import { usePartners } from "@/hooks/use-partners";
import { toast } from "@/components/ui/use-toast";
import { ChevronLeft, ChevronRight, Edit2, Plus, Trash2 } from "lucide-react";
import { ScreenGuard } from "@/components/layout/screen-guard";
import type { ContractStatus } from "@/types/contrato";

const STATUS_LABELS: Record<ContractStatus, string> = {
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
  CANCELLED: "Cancelado",
};

const STATUS_CLASSES: Record<ContractStatus, string> = {
  ACTIVE: "text-green-600 bg-green-50 border-green-200",
  SUSPENDED: "text-yellow-600 bg-yellow-50 border-yellow-200",
  CANCELLED: "",
};

export default function ContratosPage() {
  const [page, setPage] = useState(1);
  const perPage = 15;

  const { data, isLoading } = useContratos({ page, per_page: perPage });
  const { data: partnersData } = usePartners({ per_page: 100 });
  const deleteMutation = useDeleteContrato();

  const getClienteName = (id: string | null) => {
    if (!id) return "—";
    return partnersData?.results.find((p) => p.id === id)?.name ?? id;
  };

  const contratos = data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  const handleDelete = async (id: string, numero: number | null) => {
    if (!confirm(`Tem certeza que deseja excluir o contrato Nº ${numero ?? id}?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Contrato excluído!", description: "O contrato foi removido com sucesso." });
    } catch (err: any) {
      toast({
        title: "Erro ao excluir",
        description: err?.response?.data?.detail ?? "Não foi possível excluir o contrato.",
        variant: "destructive",
      });
    }
  };

  return (
    <ScreenGuard screenKey="contratos">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contratos</h1>
            <p className="text-muted-foreground text-sm">Gestão de contratos de serviços</p>
          </div>
          <Link href="/contratos/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Novo Contrato
            </Button>
          </Link>
        </div>

        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-16">Nº</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Localização</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Serviços</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vigência</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : contratos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum contrato encontrado.
                  </td>
                </tr>
              ) : (
                contratos.map((contrato) => (
                  <tr key={contrato.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono font-bold text-sm">
                      {contrato.numero ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getClienteName(contrato.client_id)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {contrato.cidade && contrato.estado
                        ? `${contrato.cidade} / ${contrato.estado}`
                        : contrato.estado ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {contrato.servicos.length > 0 ? (
                        <span className="text-xs">
                          {contrato.servicos.map((s) => s.atividade).join(", ").slice(0, 60)}
                          {contrato.servicos.length > 2 ? "..." : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={contrato.status === "ACTIVE" ? "outline" : "secondary"}
                        className={STATUS_CLASSES[contrato.status]}
                      >
                        {STATUS_LABELS[contrato.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {contrato.start_date
                        ? new Date(contrato.start_date).toLocaleDateString("pt-BR")
                        : "—"}
                      {contrato.end_date
                        ? ` → ${new Date(contrato.end_date).toLocaleDateString("pt-BR")}`
                        : ""}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Link href={`/contratos/${contrato.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(contrato.id, contrato.numero)}
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
              {total} contrato{total !== 1 ? "s" : ""} no total
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
    </ScreenGuard>
  );
}
