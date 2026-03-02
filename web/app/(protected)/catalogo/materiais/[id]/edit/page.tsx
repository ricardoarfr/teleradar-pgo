"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialForm } from "@/components/catalogo/materiais/material-form";
import { useMaterial, useUpdateMaterial } from "@/hooks/use-catalogo";
import { toast } from "@/components/ui/use-toast";
import type { MaterialUpdate } from "@/types/catalogo";

export default function MaterialEditPage() {
  const params = useParams();
  const materialId = params.id as string;
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: material, isLoading } = useMaterial(materialId);
  const updateMaterial = useUpdateMaterial();

  const handleSubmit = async (data: MaterialUpdate) => {
    setApiError(null);
    try {
      await updateMaterial.mutateAsync({ id: materialId, data });
      toast({ title: "Material atualizado!", description: "As alterações foram salvas com sucesso." });
      router.push("/catalogo/materiais");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") {
        setApiError(detail);
      } else if (Array.isArray(detail) && detail.length > 0) {
        setApiError(detail.map((e: any) => e.msg ?? String(e)).join("; "));
      } else {
        setApiError("Erro ao atualizar material. Verifique os dados.");
      }
    }
  };

  if (isLoading || !material) {
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
          href="/catalogo/materiais"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para materiais
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar material</CardTitle>
          <CardDescription>{material.codigo} — {material.descricao}</CardDescription>
        </CardHeader>
        <CardContent>
          <MaterialForm
            mode="edit"
            material={material}
            onSubmit={handleSubmit}
            isSubmitting={updateMaterial.isPending}
            apiError={apiError}
            onCancel={() => router.push("/catalogo/materiais")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
