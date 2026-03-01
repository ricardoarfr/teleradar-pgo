"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LPUForm } from "@/components/catalogo/lpu/lpu-form";
import { useCreateLPU } from "@/hooks/use-catalogo";
import { usePartners } from "@/hooks/use-partners";
import { toast } from "@/components/ui/use-toast";
import type { LPUCreate } from "@/types/catalogo";

export default function LPUCreatePage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const createLPU = useCreateLPU();
  const { data: partnersData } = usePartners({ per_page: 200 });
  const parceiros = partnersData?.results ?? [];

  const handleSubmit = async (data: LPUCreate) => {
    setApiError(null);
    try {
      const lpu = await createLPU.mutateAsync(data);
      toast({ title: "LPU cadastrada!", description: "A LPU foi cadastrada com sucesso." });
      router.push(`/catalogo/lpu/${lpu.id}`);
    } catch (err: any) {
      setApiError(
        err?.response?.data?.detail ?? "Erro ao cadastrar LPU. Verifique os dados."
      );
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/catalogo/lpu"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para LPUs
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova LPU</CardTitle>
          <CardDescription>
            Cadastre uma nova Lista de Preços Unitários vinculada a um parceiro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LPUForm
            mode="create"
            parceiros={parceiros}
            onSubmit={handleSubmit}
            isSubmitting={createLPU.isPending}
            apiError={apiError}
            onCancel={() => router.push("/catalogo/lpu")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
