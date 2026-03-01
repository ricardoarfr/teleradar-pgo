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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLPU, useLPUItems, useAddLPUItem, useServicos } from "@/hooks/use-catalogo";
import { toast } from "@/components/ui/use-toast";
import type { LPUItemCreate } from "@/types/catalogo";

const schema = z.object({
  servico_id: z.string().uuid("Selecione uma atividade"),
  valor_unitario: z.coerce.number({ invalid_type_error: "Informe um valor" }).min(0, "Valor deve ser maior ou igual a zero"),
  valor_classe: z.coerce.number().min(0).optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

function AddLPUItemContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lpuId = params.id as string;
  const tenantId = searchParams.get("tenant_id") ?? undefined;

  const [apiError, setApiError] = useState<string | null>(null);

  const { data: lpu } = useLPU(lpuId, tenantId);
  const { data: itemsData } = useLPUItems(lpuId, { per_page: 200 }, tenantId);
  const { data: servicosData } = useServicos({ per_page: 200, ativo: true });
  const addItem = useAddLPUItem(tenantId);

  // Filtra serviços já adicionados nesta LPU
  const usedServicosIds = new Set((itemsData?.results ?? []).map((i) => i.servico_id));
  const servicosDisponiveis = (servicosData?.results ?? []).filter(
    (s) => !usedServicosIds.has(s.id)
  );

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const servico_id = watch("servico_id");

  const backHref = `/catalogo/lpu/${lpuId}${tenantId ? `?tenant_id=${tenantId}` : ""}`;

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      const payload: LPUItemCreate = {
        servico_id: data.servico_id,
        valor_unitario: data.valor_unitario,
        ...(data.valor_classe !== "" && data.valor_classe !== undefined
          ? { valor_classe: Number(data.valor_classe) }
          : {}),
      };
      await addItem.mutateAsync({ lpuId, data: payload });
      toast({ title: "Item adicionado!", description: "O item foi adicionado à LPU." });
      router.push(backHref);
    } catch (err: any) {
      setApiError(err?.response?.data?.detail ?? "Erro ao adicionar item.");
    }
  };

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
          <CardTitle>Adicionar item à LPU</CardTitle>
          <CardDescription>
            {lpu?.nome ?? "Carregando..."} — selecione a atividade e defina os valores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Atividade */}
            <div className="space-y-2">
              <Label htmlFor="servico_id">Atividade *</Label>
              <Select
                value={servico_id}
                onValueChange={(v) => setValue("servico_id", v, { shouldValidate: true })}
              >
                <SelectTrigger id="servico_id">
                  <SelectValue placeholder="Selecione uma atividade..." />
                </SelectTrigger>
                <SelectContent>
                  {servicosDisponiveis.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Todas as atividades já foram adicionadas.
                    </div>
                  ) : (
                    servicosDisponiveis.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.codigo} — {s.atividade}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.servico_id && (
                <p className="text-xs text-destructive">{errors.servico_id.message}</p>
              )}
            </div>

            {/* Valores */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valor_unitario">Valor Unitário (R$) *</Label>
                <Input
                  id="valor_unitario"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
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
                {errors.valor_classe && (
                  <p className="text-xs text-destructive">{errors.valor_classe.message}</p>
                )}
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
              <Button type="submit" disabled={addItem.isPending}>
                {addItem.isPending ? "Adicionando..." : "Adicionar item"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AddLPUItemPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Carregando...
      </div>
    }>
      <AddLPUItemContent />
    </Suspense>
  );
}
