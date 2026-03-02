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
import { useUnidades } from "@/hooks/use-catalogo";
import type { Material, MaterialCreate, MaterialUpdate } from "@/types/catalogo";

const materialSchema = z.object({
  codigo: z.string().min(1, "Código obrigatório").max(50),
  descricao: z.string().min(2, "Descrição deve ter pelo menos 2 caracteres").max(255),
  unidade_id: z.string().uuid("Selecione uma unidade"),
  ativo: z.boolean().default(true),
});

type MaterialFormData = z.infer<typeof materialSchema>;

interface MaterialFormCreateProps {
  mode: "create";
  onSubmit: (data: MaterialCreate) => Promise<void>;
  isSubmitting: boolean;
  apiError: string | null;
  onCancel: () => void;
}

interface MaterialFormEditProps {
  mode: "edit";
  material: Material;
  onSubmit: (data: MaterialUpdate) => Promise<void>;
  isSubmitting: boolean;
  apiError: string | null;
  onCancel: () => void;
}

type MaterialFormProps = MaterialFormCreateProps | MaterialFormEditProps;

export function MaterialForm(props: MaterialFormProps) {
  const isCreate = props.mode === "create";
  const editMaterial = !isCreate ? (props as MaterialFormEditProps).material : null;

  const { data: unidadesData } = useUnidades({ per_page: 100, ativa: true });
  const unidades = unidadesData?.results ?? [];

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<MaterialFormData>({
      resolver: zodResolver(materialSchema),
      defaultValues: isCreate
        ? { ativo: true }
        : {
            codigo: editMaterial!.codigo,
            descricao: editMaterial!.descricao,
            unidade_id: editMaterial!.unidade_id,
            ativo: editMaterial!.ativo,
          },
    });

  const ativo = watch("ativo");
  const unidade_id = watch("unidade_id");

  const handleFormSubmit = async (data: MaterialFormData) => {
    await props.onSubmit(data as MaterialCreate & MaterialUpdate);
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
            placeholder="Ex: MAT-001"
          />
          {errors.codigo && (
            <p className="text-xs text-destructive">{errors.codigo.message}</p>
          )}
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição *</Label>
          <Input
            id="descricao"
            {...register("descricao")}
            placeholder="Ex: Cabo óptico monomodo 6FO"
          />
          {errors.descricao && (
            <p className="text-xs text-destructive">{errors.descricao.message}</p>
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

        {/* Ativo */}
        <div className="flex items-center gap-3">
          <Switch
            id="ativo"
            checked={ativo}
            onCheckedChange={(v) => setValue("ativo", v)}
          />
          <Label htmlFor="ativo">Material ativo</Label>
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
            : isCreate ? "Cadastrar material" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
