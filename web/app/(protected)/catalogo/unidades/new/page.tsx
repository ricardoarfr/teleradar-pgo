"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { useCreateUnidade } from "@/hooks/use-catalogo";
import { toast } from "@/components/ui/use-toast";

const schema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  sigla: z.string().min(1, "Sigla obrigatória").max(20),
  ativa: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export default function UnidadeCreatePage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const createUnidade = useCreateUnidade();

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { ativa: true },
    });

  const ativa = watch("ativa");

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await createUnidade.mutateAsync(data);
      toast({ title: "Unidade cadastrada!", description: "A unidade foi cadastrada com sucesso." });
      router.push("/catalogo/unidades");
    } catch (err: any) {
      setApiError(err?.response?.data?.detail ?? "Erro ao cadastrar unidade.");
    }
  };

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
          <CardTitle>Nova unidade</CardTitle>
          <CardDescription>Cadastre uma nova unidade de medida para o catálogo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" {...register("nome")} placeholder="Ex: Metro" />
                {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sigla">Sigla *</Label>
                <Input id="sigla" {...register("sigla")} placeholder="Ex: m" className="font-mono" />
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
              <Button type="submit" disabled={createUnidade.isPending}>
                {createUnidade.isPending ? "Cadastrando..." : "Cadastrar unidade"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
