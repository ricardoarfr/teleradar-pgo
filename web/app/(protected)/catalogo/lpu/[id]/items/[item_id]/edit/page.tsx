"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLPU, useLPUItem, useUpdateLPUItem } from "@/hooks/use-catalogo";
import { toast } from "@/components/ui/use-toast";
import type { LPUItemUpdate } from "@/types/catalogo";

const schema = z.object({
  valor_unitario: z.coerce.number({ invalid_type_error: "Informe um valor" }).min(0, "Valor deve ser maior ou igual a zero"),
  valor_classe: z.coerce.number().min(0).optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

function EditLPUItemContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lpuId = params.id as string;
  const itemId = params.item_id as string;
  const tenantId = searchParams.get("tenant_id") ?? undefined;

  const [apiError, setApiError] = useState<string | null>(null);

  const { data: lpu } = useLPU(lpuId, tenantId);
  const { data: item, isLoading } = useLPUItem(lpuId, itemId, tenantId);
  const updateItem = useUpdateLPUItem(tenantId);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: item
      ? {
          valor_unitario: item.valor_unitario,
          valor_classe: item.valor_classe ?? "",
        }
      : undefined,
  });

  const backHref = `/catalogo/lpu/${lpuId}${tenantId ? `?tenant_id=${tenantId}` : ""}`;

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      const payload: LPUItemUpdate = {
        valor_unitario: data.valor_unitario,
        ...(data.valor_classe !== "" && data.valor_classe !== undefined
          ? { valor_classe: Number(data.valor_classe) }
          : { valor_classe: undefined }),
      };
      await updateItem.mutateAsync({ lpuId, itemId, data: payload });
      toast({ title: "Item atualizado!", description: "Os valores foram salvos com sucesso." });
      router.push(backHref);
    } catch (err: any) {
      setApiError(err?.response?.data?.detail ?? "Erro ao atualizar item.");
    }
  };

  if (isLoading || !item) {
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
          href={backHref}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para {lpu?.nome ?? "LPU"}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar item da LPU</CardTitle>
          <CardDescription>
            {item.servico?.codigo} — {item.servico?.atividade}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Atividade — somente leitura */}
          <div className="mb-6 space-y-2">
            <Label>Atividade</Label>
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {item.servico?.codigo} — {item.servico?.atividade}
              {item.servico?.unidade && (
                <span className="ml-2 text-xs">({item.servico.unidade.sigla})</span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Valores */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valor_unitario">Valor Unitário (R$) *</Label>
                <Input
                  id="valor_unitario"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("valor_unitario")}
                />
                {errors.valor_unitario && (
                  <p className="text-xs text-destructive">{errors.valor_unitario.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor_classe">Valor Classe (R$)</Label>
                <Input
                  id="valor_classe"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Opcional"
                  {...register("valor_classe")}
                />
              </div>
            </div>

            {apiError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {apiError}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push(backHref)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateItem.isPending}>
                {updateItem.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditLPUItemPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Carregando...
      </div>
    }>
      <EditLPUItemContent />
    </Suspense>
  );
}
