"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServicoForm } from "@/components/catalogo/servicos/servico-form";
import { useServico, useUpdateServico } from "@/hooks/use-catalogo";
import { toast } from "@/components/ui/use-toast";
import type { ServicoUpdate } from "@/types/catalogo";

export default function ServicoEditPage() {
  const params = useParams();
  const servicoId = params.id as string;
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: servico, isLoading } = useServico(servicoId);
  const updateServico = useUpdateServico();

  const handleSubmit = async (data: ServicoUpdate) => {
    setApiError(null);
    try {
      await updateServico.mutateAsync({ id: servicoId, data });
      toast({ title: "Atividade atualizada!", description: "As alterações foram salvas com sucesso." });
      router.push("/catalogo/servicos");
    } catch (err: any) {
      setApiError(err?.response?.data?.detail ?? "Erro ao atualizar atividade. Verifique os dados.");
    }
  };

  if (isLoading || !servico) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Carregando...
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/catalogo/servicos"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para atividades
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar atividade</CardTitle>
          <CardDescription>{servico.codigo} — {servico.atividade}</CardDescription>
        </CardHeader>
        <CardContent>
          <ServicoForm
            mode="edit"
            servico={servico}
            onSubmit={handleSubmit}
            isSubmitting={updateServico.isPending}
            apiError={apiError}
            onCancel={() => router.push("/catalogo/servicos")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
