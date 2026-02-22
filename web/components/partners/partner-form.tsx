"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Partner, PartnerCreate, PartnerUpdate } from "@/types/partner";

// ─── Funções de máscara ────────────────────────────────────────────────────

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length === 0 ? "" : `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCPF(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskCNPJ(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function maskCEP(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function guessPersonType(cpf_cnpj: string | null): "PF" | "PJ" {
  if (!cpf_cnpj) return "PF";
  return cpf_cnpj.replace(/\D/g, "").length <= 11 ? "PF" : "PJ";
}

// ─── Schemas de validação ─────────────────────────────────────────────────

const cepField = z
  .string()
  .optional()
  .refine((v) => !v || v.replace(/\D/g, "").length === 8, "CEP inválido (use 00000-000)");

export const partnerCreateSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
    tenant_id: z.string().uuid("Tenant inválido"),
    person_type: z.enum(["PF", "PJ"]).default("PF"),
    cpf_cnpj: z.string().optional(),
    phone: z.string().optional(),
    address_cep: cepField,
    address_street: z.string().optional(),
    address_number: z.string().optional(),
    address_complement: z.string().optional(),
    address_neighborhood: z.string().optional(),
    address_city: z.string().optional(),
    address_state: z.string().max(2).optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.person_type === "PF" && !data.address_cep) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address_cep"],
        message: "CEP obrigatório para Pessoa Física",
      });
    }
  });

export const partnerUpdateSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  person_type: z.enum(["PF", "PJ"]).optional(),
  cpf_cnpj: z.string().optional(),
  phone: z.string().optional(),
  address_cep: cepField,
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().max(2).optional(),
  notes: z.string().optional(),
});

type CreateFormData = z.infer<typeof partnerCreateSchema>;
type UpdateFormData = z.infer<typeof partnerUpdateSchema>;

interface PartnerFormCreateProps {
  mode: "create";
  tenantId: string;
  onSubmit: (data: PartnerCreate) => Promise<void>;
  isSubmitting: boolean;
  apiError: string | null;
  onCancel: () => void;
}

interface PartnerFormEditProps {
  mode: "edit";
  partner: Partner;
  onSubmit: (data: PartnerUpdate) => Promise<void>;
  isSubmitting: boolean;
  apiError: string | null;
  onCancel: () => void;
}

type PartnerFormProps = PartnerFormCreateProps | PartnerFormEditProps;

export function PartnerForm(props: PartnerFormProps) {
  const isCreate = props.mode === "create";
  const [apiPopulated, setApiPopulated] = useState(false);

  const editPartner = !isCreate ? (props as PartnerFormEditProps).partner : null;
  const rawCpfCnpj = editPartner?.profile?.cpf_cnpj ?? "";
  const initialPersonType = guessPersonType(editPartner?.profile?.cpf_cnpj ?? null);
  const initialCpfCnpj = rawCpfCnpj
    ? initialPersonType === "PF"
      ? maskCPF(rawCpfCnpj)
      : maskCNPJ(rawCpfCnpj)
    : "";

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(partnerCreateSchema),
    defaultValues: isCreate
      ? { tenant_id: (props as PartnerFormCreateProps).tenantId, person_type: "PF" }
      : undefined,
  });

  const editForm = useForm<UpdateFormData>({
    resolver: zodResolver(partnerUpdateSchema),
    defaultValues: !isCreate
      ? {
          name: editPartner!.name,
          person_type: initialPersonType,
          cpf_cnpj: initialCpfCnpj,
          phone: maskPhone(editPartner!.profile?.phone ?? ""),
          address_cep: maskCEP(editPartner!.profile?.address_cep ?? ""),
          address_street: editPartner!.profile?.address_street ?? "",
          address_number: editPartner!.profile?.address_number ?? "",
          address_complement: editPartner!.profile?.address_complement ?? "",
          address_neighborhood: editPartner!.profile?.address_neighborhood ?? "",
          address_city: editPartner!.profile?.address_city ?? "",
          address_state: editPartner!.profile?.address_state ?? "",
          notes: editPartner!.profile?.notes ?? "",
        }
      : undefined,
  });

  const form = isCreate ? createForm : editForm;
  const { register, handleSubmit, watch, setValue, formState: { errors } } = form as any;

  const personType = (watch("person_type") as "PF" | "PJ") ?? "PF";
  const isPJ = personType === "PJ";

  // Campos preenchidos pela API ficam readonly apenas para PJ
  const apiReadonly = isPJ && apiPopulated;

  // ─── Tipo de pessoa ────────────────────────────────────────────────────
  const handlePersonTypeChange = (newType: "PF" | "PJ") => {
    setValue("person_type", newType);
    if (newType === "PF") {
      setApiPopulated(false);
    }
  };

  // ─── Auto-fill CEP via ViaCEP (apenas para PF) ─────────────────────────
  const handleCepChange = (raw: string) => {
    const masked = maskCEP(raw);
    setValue("address_cep", masked, { shouldValidate: true });
    if (masked.replace(/\D/g, "").length === 8) {
      fetch(`https://viacep.com.br/ws/${masked.replace(/\D/g, "")}/json/`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.erro) {
            setValue("address_street", data.logradouro ?? "");
            setValue("address_neighborhood", data.bairro ?? "");
            setValue("address_city", data.localidade ?? "");
            setValue("address_state", data.uf ?? "");
          }
        })
        .catch(() => {});
    }
  };

  // ─── Auto-fill CNPJ via BrasilAPI ─────────────────────────────────────
  const handleCnpjChange = (raw: string) => {
    const masked = maskCNPJ(raw);
    setValue("cpf_cnpj", masked, { shouldValidate: true });
    setApiPopulated(false);
    const digits = masked.replace(/\D/g, "");
    if (digits.length === 14) {
      fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          let filled = false;
          if (data.razao_social) {
            setValue("name", data.razao_social);
            filled = true;
          }
          if (data.cep) {
            setValue("address_cep", maskCEP(data.cep));
            setValue("address_street", data.logradouro ?? "");
            setValue("address_neighborhood", data.bairro ?? "");
            setValue("address_city", data.municipio ?? "");
            setValue("address_state", data.uf ?? "");
            if (data.numero) setValue("address_number", data.numero);
            if (data.complemento) setValue("address_complement", data.complemento);
            filled = true;
          }
          if (filled) setApiPopulated(true);
        })
        .catch(() => {});
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (isCreate) {
      await (props as PartnerFormCreateProps).onSubmit(data as PartnerCreate);
    } else {
      const clean: PartnerUpdate = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== "" && v !== undefined)
      ) as PartnerUpdate;
      await (props as PartnerFormEditProps).onSubmit(clean);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">

      {/* ── DADOS ──────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Dados
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {isPJ ? "Razão social" : "Nome completo"}{" "}
              {apiReadonly && (
                <span className="text-xs text-muted-foreground font-normal">(preenchido pela API)</span>
              )}
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder={isPJ ? "Razão social da empresa" : "Nome do parceiro"}
              readOnly={apiReadonly}
              className={apiReadonly ? "bg-muted cursor-not-allowed" : ""}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* E-mail (apenas criação) */}
          {isCreate && (
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" type="email" {...register("email")} placeholder="email@exemplo.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          )}
        </div>

        {/* Senha (apenas criação) */}
        {isCreate && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Senha de acesso *</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Mínimo 8 caracteres"
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="(11) 99999-9999"
              onChange={(e) =>
                setValue("phone", maskPhone(e.target.value), { shouldValidate: true })
              }
            />
          </div>

          {/* CPF ou CNPJ */}
          <div className="space-y-2">
            {isPJ ? (
              <>
                <Label htmlFor="cpf_cnpj">
                  CNPJ{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (preenche dados automaticamente)
                  </span>
                </Label>
                <Input
                  id="cpf_cnpj"
                  {...register("cpf_cnpj")}
                  placeholder="00.000.000/0000-00"
                  onChange={(e) => handleCnpjChange(e.target.value)}
                />
              </>
            ) : (
              <>
                <Label htmlFor="cpf_cnpj">CPF</Label>
                <Input
                  id="cpf_cnpj"
                  {...register("cpf_cnpj")}
                  placeholder="000.000.000-00"
                  onChange={(e) =>
                    setValue("cpf_cnpj", maskCPF(e.target.value), { shouldValidate: true })
                  }
                />
              </>
            )}
            {errors.cpf_cnpj && (
              <p className="text-xs text-destructive">{errors.cpf_cnpj.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── ENDEREÇO ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Endereço
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* CEP */}
          <div className="space-y-2">
            <Label htmlFor="address_cep">
              CEP {!isPJ && "*"}{" "}
              {apiReadonly ? (
                <span className="text-xs text-muted-foreground font-normal">(preenchido pela API)</span>
              ) : !isPJ ? (
                <span className="text-xs text-muted-foreground font-normal">(preenche endereço automaticamente)</span>
              ) : null}
            </Label>
            <Input
              id="address_cep"
              {...register("address_cep")}
              placeholder="00000-000"
              readOnly={apiReadonly}
              className={apiReadonly ? "bg-muted cursor-not-allowed" : ""}
              onChange={(e) => {
                if (!apiReadonly) handleCepChange(e.target.value);
              }}
            />
            {errors.address_cep && (
              <p className="text-xs text-destructive">{errors.address_cep.message}</p>
            )}
          </div>

          {/* Logradouro */}
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="address_street">Logradouro</Label>
            <Input
              id="address_street"
              {...register("address_street")}
              placeholder="Rua, Avenida..."
              readOnly={apiReadonly}
              className={apiReadonly ? "bg-muted cursor-not-allowed" : ""}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Número */}
          <div className="space-y-2">
            <Label htmlFor="address_number">Número</Label>
            <Input
              id="address_number"
              {...register("address_number")}
              placeholder="123"
              readOnly={apiReadonly}
              className={apiReadonly ? "bg-muted cursor-not-allowed" : ""}
            />
          </div>

          {/* Complemento — sempre editável */}
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="address_complement">Complemento</Label>
            <Input
              id="address_complement"
              {...register("address_complement")}
              placeholder="Apto, Sala..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Bairro */}
          <div className="space-y-2">
            <Label htmlFor="address_neighborhood">Bairro</Label>
            <Input
              id="address_neighborhood"
              {...register("address_neighborhood")}
              placeholder="Bairro"
              readOnly={apiReadonly}
              className={apiReadonly ? "bg-muted cursor-not-allowed" : ""}
            />
          </div>

          {/* Cidade */}
          <div className="space-y-2">
            <Label htmlFor="address_city">Cidade</Label>
            <Input
              id="address_city"
              {...register("address_city")}
              placeholder="Cidade"
              readOnly={apiReadonly}
              className={apiReadonly ? "bg-muted cursor-not-allowed" : ""}
            />
          </div>

          {/* UF */}
          <div className="space-y-2">
            <Label htmlFor="address_state">UF</Label>
            <Input
              id="address_state"
              {...register("address_state")}
              placeholder="PR"
              maxLength={2}
              readOnly={apiReadonly}
              className={`uppercase${apiReadonly ? " bg-muted cursor-not-allowed" : ""}`}
            />
          </div>
        </div>
      </div>

      {/* ── DETALHES ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Detalhes
        </h3>

        {/* Tipo de pessoa */}
        <div className="space-y-2">
          <Label>Tipo de pessoa</Label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="PF"
                checked={personType === "PF"}
                onChange={() => handlePersonTypeChange("PF")}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">Pessoa Física</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="PJ"
                checked={personType === "PJ"}
                onChange={() => handlePersonTypeChange("PJ")}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">Pessoa Jurídica</span>
            </label>
          </div>
          {apiReadonly && (
            <p className="text-xs text-muted-foreground">
              Os campos preenchidos automaticamente via CNPJ não podem ser editados.
            </p>
          )}
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <textarea
            id="notes"
            {...register("notes")}
            placeholder="Anotações internas sobre o parceiro..."
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
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
            ? "Cadastrar parceiro"
            : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
