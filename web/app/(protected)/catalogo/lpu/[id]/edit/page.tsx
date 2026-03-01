"use client";

import { Suspense, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LPUForm } from "@/components/catalogo/lpu/lpu-form";
import { useLPU, useUpdateLPU } from "@/hooks/use-catalogo";
import { usePartners } from "@/hooks/use-partners";
import { toast } from "@/components/ui/use-toast";
import type { LPUUpdate } from "@/types/catalogo";

function LPUEditPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const lpuId = params.id as string;
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  // tenant_id vem na URL quando o usuário é MASTER sem tenant
  const tenantId = searchParams.get("tenant_id") ?? undefined;

  const { data: lpu, isLoading } = useLPU(lpuId, tenantId);

  // Após o LPU carregar, usar o tenant_id do próprio LPU (mais confiável que o da URL)
  const effectiveTenantId = (lpu as any)?.tenant_id ?? tenantId;

  const updateLPU = useUpdateLPU(effectiveTenantId);
  const { data: partnersData } = usePartners({ per_page: 200 });
  const parceiros = partnersData?.results ?? [];

  const handleSubmit = async (data: LPUUpdate) => {
    setApiError(null);
    try {
      await updateLPU.mutateAsync({ id: lpuId, data });
      toast({ title: "LPU atualizada!", description: "As alterações foram salvas com sucesso." });
      router.push(
        `/catalogo/lpu/${lpuId}${effectiveTenantId ? `?tenant_id=${effectiveTenantId}` : ""}`
      );
    } catch (err: any) {
      setApiError(
        err?.response?.data?.detail ?? "Erro ao atualizar LPU. Verifique os dados."
      );
    }
  };

  if (isLoading || !lpu) {
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
          href={`/catalogo/lpu/${lpuId}${effectiveTenantId ? `?tenant_id=${effectiveTenantId}` : ""}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para {lpu.nome}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar LPU</CardTitle>
          <CardDescription>{lpu.nome}</CardDescription>
        </CardHeader>
        <CardContent>
          <LPUForm
            mode="edit"
            lpu={lpu}
            parceiros={parceiros}
            onSubmit={handleSubmit}
            isSubmitting={updateLPU.isPending}
            apiError={apiError}
            onCancel={() =>
              router.push(
                `/catalogo/lpu/${lpuId}${effectiveTenantId ? `?tenant_id=${effectiveTenantId}` : ""}`
              )
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function LPUEditPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Carregando...
      </div>
    }>
      <LPUEditPageContent />
    </Suspense>
  );
}
