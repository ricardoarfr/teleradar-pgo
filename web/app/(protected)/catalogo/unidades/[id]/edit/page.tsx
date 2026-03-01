"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUnidade, useUpdateUnidade } from "@/hooks/use-catalogo";
import { toast } from "@/components/ui/use-toast";

const schema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  sigla: z.string().min(1, "Sigla obrigatória").max(20),
  ativa: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function UnidadeEditPage() {
  const params = useParams();
  const unidadeId = params.id as string;
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: unidade, isLoading } = useUnidade(unidadeId);
  const updateUnidade = useUpdateUnidade();

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      values: unidade
        ? { nome: unidade.nome, sigla: unidade.sigla, ativa: unidade.ativa }
        : undefined,
    });

  const ativa = watch("ativa");

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await updateUnidade.mutateAsync({ id: unidadeId, data });
      toast({ title: "Unidade atualizada!", description: "As alterações foram salvas com sucesso." });
      router.push("/catalogo/unidades");
    } catch (err: any) {
      setApiError(err?.response?.data?.detail ?? "Erro ao atualizar unidade.");
    }
  };

  if (isLoading || !unidade) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Carregando...
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link
          href="/catalogo/unidades"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para unidades
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar unidade</CardTitle>
          <CardDescription>{unidade.sigla} — {unidade.nome}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" {...register("nome")} />
                {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sigla">Sigla *</Label>
                <Input id="sigla" {...register("sigla")} className="font-mono" />
                {errors.sigla && <p className="text-xs text-destructive">{errors.sigla.message}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch id="ativa" checked={ativa} onCheckedChange={(v) => setValue("ativa", v)} />
              <Label htmlFor="ativa">Unidade ativa</Label>
            </div>

            {apiError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {apiError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => router.push("/catalogo/unidades")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateUnidade.isPending}>
                {updateUnidade.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
