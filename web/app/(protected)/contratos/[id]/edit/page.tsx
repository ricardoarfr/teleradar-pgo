"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContratoForm } from "@/components/contratos/contrato-form";
import { useContrato, useUpdateContrato } from "@/hooks/use-contratos";
import { toast } from "@/components/ui/use-toast";
import type { ContratoUpdate } from "@/types/contrato";

export default function EditarContratoPage() {
  const params = useParams();
  const contratoId = params.id as string;
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: contrato, isLoading } = useContrato(contratoId);
  const updateContrato = useUpdateContrato();

  const handleSubmit = async (data: ContratoUpdate) => {
    setApiError(null);
    try {
      await updateContrato.mutateAsync({ id: contratoId, data });
      toast({ title: "Contrato atualizado!", description: "As alterações foram salvas com sucesso." });
      router.push("/contratos");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") {
        setApiError(detail);
      } else if (Array.isArray(detail) && detail.length > 0) {
        setApiError(detail.map((e: any) => e.msg ?? String(e)).join("; "));
      } else {
        setApiError("Erro ao atualizar contrato. Verifique os dados.");
      }
    }
  };

  if (isLoading || !contrato) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Carregando...
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href="/contratos"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para contratos
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar Contrato</CardTitle>
          <CardDescription>
            Contrato Nº {contrato.numero ?? contrato.id}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContratoForm
            mode="edit"
            contrato={contrato}
            onSubmit={handleSubmit}
            isSubmitting={updateContrato.isPending}
            apiError={apiError}
            onCancel={() => router.push("/contratos")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
