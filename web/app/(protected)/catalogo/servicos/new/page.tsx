"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServicoForm } from "@/components/catalogo/servicos/servico-form";
import { useCreateServico } from "@/hooks/use-catalogo";
import { toast } from "@/components/ui/use-toast";
import type { ServicoCreate } from "@/types/catalogo";

export default function ServicoCreatePage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const createServico = useCreateServico();

  const handleSubmit = async (data: ServicoCreate) => {
    setApiError(null);
    try {
      await createServico.mutateAsync(data);
      toast({ title: "Atividade cadastrada!", description: "A atividade foi cadastrada com sucesso." });
      router.push("/catalogo/servicos");
    } catch (err: any) {
      setApiError(err?.response?.data?.detail ?? "Erro ao cadastrar atividade. Verifique os dados.");
    }
  };

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
          <CardTitle>Nova atividade</CardTitle>
          <CardDescription>
            Cadastre uma nova atividade do catálogo de serviços.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServicoForm
            mode="create"
            onSubmit={handleSubmit}
            isSubmitting={createServico.isPending}
            apiError={apiError}
            onCancel={() => router.push("/catalogo/servicos")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
