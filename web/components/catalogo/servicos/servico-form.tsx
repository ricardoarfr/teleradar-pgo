"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClasses, useUnidades } from "@/hooks/use-catalogo";
import type { Servico, ServicoCreate, ServicoUpdate } from "@/types/catalogo";

const servicoSchema = z.object({
  codigo: z.string().min(1, "Código obrigatório").max(50),
  atividade: z.string().min(2, "Atividade deve ter pelo menos 2 caracteres").max(255),
  classe_id: z.string().uuid("Selecione uma classe"),
  unidade_id: z.string().uuid("Selecione uma unidade"),
  ativo: z.boolean().default(true),
});

type ServicoFormData = z.infer<typeof servicoSchema>;

interface ServicoFormCreateProps {
  mode: "create";
  onSubmit: (data: ServicoCreate) => Promise<void>;
  isSubmitting: boolean;
  apiError: string | null;
  onCancel: () => void;
}

interface ServicoFormEditProps {
  mode: "edit";
  servico: Servico;
  onSubmit: (data: ServicoUpdate) => Promise<void>;
  isSubmitting: boolean;
  apiError: string | null;
  onCancel: () => void;
}

type ServicoFormProps = ServicoFormCreateProps | ServicoFormEditProps;

export function ServicoForm(props: ServicoFormProps) {
  const isCreate = props.mode === "create";
  const editServico = !isCreate ? (props as ServicoFormEditProps).servico : null;

  const { data: classesData } = useClasses({ per_page: 200, ativa: true });
  const { data: unidadesData } = useUnidades({ per_page: 200, ativa: true });
  const classes = classesData?.results ?? [];
  const unidades = unidadesData?.results ?? [];

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<ServicoFormData>({
      resolver: zodResolver(servicoSchema),
      defaultValues: isCreate
        ? { ativo: true }
        : {
            codigo: editServico!.codigo,
            atividade: editServico!.atividade,
            classe_id: editServico!.classe_id,
            unidade_id: editServico!.unidade_id,
            ativo: editServico!.ativo,
          },
    });

  const ativo = watch("ativo");
  const classe_id = watch("classe_id");
  const unidade_id = watch("unidade_id");

  const handleFormSubmit = async (data: ServicoFormData) => {
    await props.onSubmit(data as ServicoCreate & ServicoUpdate);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Código */}
        <div className="space-y-2">
          <Label htmlFor="codigo">Código *</Label>
          <Input
            id="codigo"
            {...register("codigo")}
            placeholder="Ex: INS-001"
          />
          {errors.codigo && (
            <p className="text-xs text-destructive">{errors.codigo.message}</p>
          )}
        </div>

        {/* Atividade */}
        <div className="space-y-2">
          <Label htmlFor="atividade">Atividade *</Label>
          <Input
            id="atividade"
            {...register("atividade")}
            placeholder="Ex: Instalação de cabo óptico"
          />
          {errors.atividade && (
            <p className="text-xs text-destructive">{errors.atividade.message}</p>
          )}
        </div>

        {/* Classe e Unidade lado a lado */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Classe */}
          <div className="space-y-2">
            <Label htmlFor="classe_id">Classe *</Label>
            <Select
              value={classe_id}
              onValueChange={(v) => setValue("classe_id", v, { shouldValidate: true })}
            >
              <SelectTrigger id="classe_id">
                <SelectValue placeholder="Selecione uma classe..." />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.classe_id && (
              <p className="text-xs text-destructive">{errors.classe_id.message}</p>
            )}
          </div>

          {/* Unidade */}
          <div className="space-y-2">
            <Label htmlFor="unidade_id">Unidade *</Label>
            <Select
              value={unidade_id}
              onValueChange={(v) => setValue("unidade_id", v, { shouldValidate: true })}
            >
              <SelectTrigger id="unidade_id">
                <SelectValue placeholder="Selecione uma unidade..." />
              </SelectTrigger>
              <SelectContent>
                {unidades.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.sigla} — {u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unidade_id && (
              <p className="text-xs text-destructive">{errors.unidade_id.message}</p>
            )}
          </div>
        </div>

        {/* Ativo */}
        <div className="flex items-center gap-3">
          <Switch
            id="ativo"
            checked={ativo}
            onCheckedChange={(v) => setValue("ativo", v)}
          />
          <Label htmlFor="ativo">Atividade ativa</Label>
        </div>
      </div>

      {props.apiError && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {props.apiError}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={props.onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={props.isSubmitting}>
          {props.isSubmitting
            ? isCreate ? "Cadastrando..." : "Salvando..."
            : isCreate ? "Cadastrar atividade" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
