"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContratoForm } from "@/components/contratos/contrato-form";
import { useCreateContrato } from "@/hooks/use-contratos";
import { toast } from "@/components/ui/use-toast";
import type { ContratoCreate } from "@/types/contrato";

export default function NovoContratoPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const createContrato = useCreateContrato();

  const handleSubmit = async (data: ContratoCreate) => {
    setApiError(null);
    try {
      await createContrato.mutateAsync(data);
      toast({ title: "Contrato cadastrado!", description: "O contrato foi criado com sucesso." });
      router.push("/contratos");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") {
        setApiError(detail);
      } else if (Array.isArray(detail) && detail.length > 0) {
        setApiError(detail.map((e: any) => e.msg ?? String(e)).join("; "));
      } else if (err?.response?.status) {
        setApiError(`Erro ${err.response.status}: ${err?.response?.statusText ?? "Falha ao cadastrar contrato."}`);
      } else {
        setApiError("Erro ao cadastrar contrato. Verifique os dados e tente novamente.");
      }
    }
  };

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
          <CardTitle>Novo Contrato</CardTitle>
          <CardDescription>Preencha os dados para cadastrar um novo contrato.</CardDescription>
        </CardHeader>
        <CardContent>
          <ContratoForm
            mode="create"
            onSubmit={handleSubmit}
            isSubmitting={createContrato.isPending}
            apiError={apiError}
            onCancel={() => router.push("/contratos")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
