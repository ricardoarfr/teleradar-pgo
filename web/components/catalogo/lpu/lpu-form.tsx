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
import type { LPU, LPUCreate, LPUUpdate } from "@/types/catalogo";
import type { PartnerListItem } from "@/types/partner";

const lpuSchema = z
  .object({
    nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    parceiro_id: z.string().uuid("Selecione um parceiro"),
    ativa: z.boolean().default(true),
    data_inicio: z.string().optional(),
    data_fim: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.data_inicio && data.data_fim) {
        return data.data_fim >= data.data_inicio;
      }
      return true;
    },
    { message: "Data fim deve ser igual ou posterior à data início", path: ["data_fim"] }
  );

type LPUFormData = z.infer<typeof lpuSchema>;

interface LPUFormCreateProps {
  mode: "create";
  parceiros: PartnerListItem[];
  onSubmit: (data: LPUCreate) => Promise<void>;
  isSubmitting: boolean;
  apiError: string | null;
  onCancel: () => void;
}

interface LPUFormEditProps {
  mode: "edit";
  lpu: LPU;
  parceiros: PartnerListItem[];
  onSubmit: (data: LPUUpdate) => Promise<void>;
  isSubmitting: boolean;
  apiError: string | null;
  onCancel: () => void;
}

type LPUFormProps = LPUFormCreateProps | LPUFormEditProps;

export function LPUForm(props: LPUFormProps) {
  const isCreate = props.mode === "create";
  const editLPU = !isCreate ? (props as LPUFormEditProps).lpu : null;

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<LPUFormData>({
      resolver: zodResolver(lpuSchema),
      defaultValues: isCreate
        ? { ativa: true }
        : {
            nome: editLPU!.nome,
            parceiro_id: editLPU!.parceiro_id,
            ativa: editLPU!.ativa,
            data_inicio: editLPU!.data_inicio ?? undefined,
            data_fim: editLPU!.data_fim ?? undefined,
          },
    });

  const ativa = watch("ativa");
  const parceiro_id = watch("parceiro_id");

  const handleFormSubmit = async (data: LPUFormData) => {
    const payload = {
      ...data,
      data_inicio: data.data_inicio || undefined,
      data_fim: data.data_fim || undefined,
    };
    await props.onSubmit(payload as LPUCreate & LPUUpdate);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="nome">Nome da LPU *</Label>
          <Input
            id="nome"
            {...register("nome")}
            placeholder="Ex: LPU Contrato 2025"
          />
          {errors.nome && (
            <p className="text-xs text-destructive">{errors.nome.message}</p>
          )}
        </div>

        {/* Parceiro */}
        <div className="space-y-2">
          <Label htmlFor="parceiro_id">Parceiro *</Label>
          <Select
            value={parceiro_id}
            onValueChange={(v) => setValue("parceiro_id", v, { shouldValidate: true })}
          >
            <SelectTrigger id="parceiro_id">
              <SelectValue placeholder="Selecione um parceiro..." />
            </SelectTrigger>
            <SelectContent>
              {props.parceiros
                .filter((p) => p.profile_id)
                .map((p) => (
                  <SelectItem key={p.id} value={p.profile_id!}>
                    {p.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {errors.parceiro_id && (
            <p className="text-xs text-destructive">{errors.parceiro_id.message}</p>
          )}
        </div>

        {/* Vigência */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="data_inicio">Vigência — Início</Label>
            <Input id="data_inicio" type="date" {...register("data_inicio")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_fim">Vigência — Fim</Label>
            <Input id="data_fim" type="date" {...register("data_fim")} />
            {errors.data_fim && (
              <p className="text-xs text-destructive">{errors.data_fim.message}</p>
            )}
          </div>
        </div>

        {/* Ativa */}
        <div className="flex items-center gap-3">
          <Switch
            id="ativa"
            checked={ativa}
            onCheckedChange={(v) => setValue("ativa", v)}
          />
          <Label htmlFor="ativa">LPU ativa</Label>
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
            ? isCreate
              ? "Cadastrando..."
              : "Salvando..."
            : isCreate
            ? "Cadastrar LPU"
            : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
