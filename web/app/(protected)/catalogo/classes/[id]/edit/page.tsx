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
import { Textarea } from "@/components/ui/textarea";
import { useClasse, useUpdateClasse } from "@/hooks/use-catalogo";
import { toast } from "@/components/ui/use-toast";

const schema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  descricao: z.string().max(500).optional().or(z.literal("")),
  ativa: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function ClasseEditPage() {
  const params = useParams();
  const classeId = params.id as string;
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: classe, isLoading } = useClasse(classeId);
  const updateClasse = useUpdateClasse();

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      values: classe
        ? { nome: classe.nome, descricao: classe.descricao ?? "", ativa: classe.ativa }
        : undefined,
    });

  const ativa = watch("ativa");

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await updateClasse.mutateAsync({
        id: classeId,
        data: {
          nome: data.nome,
          descricao: data.descricao || undefined,
          ativa: data.ativa,
        },
      });
      toast({ title: "Classe atualizada!", description: "As alterações foram salvas com sucesso." });
      router.push("/catalogo/classes");
    } catch (err: any) {
      setApiError(err?.response?.data?.detail ?? "Erro ao atualizar classe.");
    }
  };

  if (isLoading || !classe) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Carregando...
      </div>
    );
  }

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
          <CardTitle>Editar classe</CardTitle>
          <CardDescription>{classe.nome}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" {...register("nome")} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" {...register("descricao")} rows={3} />
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
              <Button type="submit" disabled={updateClasse.isPending}>
                {updateClasse.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
