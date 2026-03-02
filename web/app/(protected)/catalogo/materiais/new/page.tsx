"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialForm } from "@/components/catalogo/materiais/material-form";
import { useCreateMaterial } from "@/hooks/use-catalogo";
import { toast } from "@/components/ui/use-toast";
import type { MaterialCreate } from "@/types/catalogo";

export default function MaterialCreatePage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const createMaterial = useCreateMaterial();

  const handleSubmit = async (data: MaterialCreate) => {
    setApiError(null);
    try {
      await createMaterial.mutateAsync(data);
      toast({ title: "Material cadastrado!", description: "O material foi cadastrado com sucesso." });
      router.push("/catalogo/materiais");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") {
        setApiError(detail);
      } else if (Array.isArray(detail) && detail.length > 0) {
        setApiError(detail.map((e: any) => e.msg ?? String(e)).join("; "));
      } else {
        setApiError("Erro ao cadastrar material. Verifique os dados.");
      }
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/catalogo/materiais"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para materiais
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo material</CardTitle>
          <CardDescription>
            Cadastre um novo material no catálogo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MaterialForm
            mode="create"
            onSubmit={handleSubmit}
            isSubmitting={createMaterial.isPending}
            apiError={apiError}
            onCancel={() => router.push("/catalogo/materiais")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
