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
import { Textarea } from "@/components/ui/textarea";
import { useCreateClasse } from "@/hooks/use-catalogo";
import { toast } from "@/components/ui/use-toast";

const schema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  descricao: z.string().max(500).optional().or(z.literal("")),
  ativa: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export default function ClasseCreatePage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const createClasse = useCreateClasse();

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { ativa: true },
    });

  const ativa = watch("ativa");

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await createClasse.mutateAsync({
        nome: data.nome,
        descricao: data.descricao || undefined,
        ativa: data.ativa,
      });
      toast({ title: "Classe cadastrada!", description: "A classe foi cadastrada com sucesso." });
      router.push("/catalogo/classes");
    } catch (err: any) {
      setApiError(err?.response?.data?.detail ?? "Erro ao cadastrar classe.");
    }
  };

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link
          href="/catalogo/classes"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para classes
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova classe</CardTitle>
          <CardDescription>Cadastre uma nova classe para o catálogo de atividades.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" {...register("nome")} placeholder="Ex: Infraestrutura" />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                {...register("descricao")}
                placeholder="Descrição opcional da classe..."
                rows={3}
              />
              {errors.descricao && <p className="text-xs text-destructive">{errors.descricao.message}</p>}
            </div>

            <div className="flex items-center gap-3">
              <Switch id="ativa" checked={ativa} onCheckedChange={(v) => setValue("ativa", v)} />
              <Label htmlFor="ativa">Classe ativa</Label>
            </div>

            {apiError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {apiError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => router.push("/catalogo/classes")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createClasse.isPending}>
                {createClasse.isPending ? "Cadastrando..." : "Cadastrar classe"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
