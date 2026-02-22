"use client";

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

const cepRequired = z
  .string()
  .min(1, "CEP obrigatório")
  .refine((v) => v.replace(/\D/g, "").length === 8, "CEP inválido (use 00000-000)");

const cepOptional = z
  .string()
  .optional()
  .refine((v) => !v || v.replace(/\D/g, "").length === 8, "CEP inválido (use 00000-000)");

export const partnerCreateSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  tenant_id: z.string().uuid("Tenant inválido"),
  person_type: z.enum(["PF", "PJ"]).default("PF"),
  cpf_cnpj: z.string().optional(),
  phone: z.string().optional(),
  address_cep: cepRequired,
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().max(2).optional(),
  notes: z.string().optional(),
});

export const partnerUpdateSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  person_type: z.enum(["PF", "PJ"]).optional(),
  cpf_cnpj: z.string().optional(),
  phone: z.string().optional(),
  address_cep: cepOptional,
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

  // ─── Auto-fill CEP via ViaCEP ──────────────────────────────────────────
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
    const digits = masked.replace(/\D/g, "");
    if (digits.length === 14) {
      fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          if (data.razao_social) setValue("name", data.razao_social);
          if (data.cep) {
            const cepMasked = maskCEP(data.cep);
            setValue("address_cep", cepMasked);
            setValue("address_street", data.logradouro ?? "");
            setValue("address_neighborhood", data.bairro ?? "");
            setValue("address_city", data.municipio ?? "");
            setValue("address_state", data.uf ?? "");
            if (data.numero) setValue("address_number", data.numero);
            if (data.complemento) setValue("address_complement", data.complemento);
          }
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Dados básicos */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Dados básicos
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo *</Label>
            <Input id="name" {...register("name")} placeholder="Nome do parceiro" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {isCreate && (
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" type="email" {...register("email")} placeholder="email@exemplo.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          )}
        </div>

        {isCreate && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Senha de acesso *</Label>
              <Input id="password" type="password" {...register("password")} placeholder="Mínimo 8 caracteres" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Tipo de pessoa + Documento */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Contato e documento
        </h3>

        {/* Tipo de pessoa */}
        <div className="space-y-2">
          <Label>Tipo de pessoa</Label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                {...register("person_type")}
                value="PF"
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">Pessoa Física</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                {...register("person_type")}
                value="PJ"
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">Pessoa Jurídica</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Telefone com máscara */}
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

          {/* CPF ou CNPJ com máscara e auto-fill */}
          <div className="space-y-2">
            {personType === "PF" ? (
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
            ) : (
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
            )}
            {errors.cpf_cnpj && (
              <p className="text-xs text-destructive">{errors.cpf_cnpj.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Endereço
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="address_cep">
              CEP *{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (preenche endereço automaticamente)
              </span>
            </Label>
            <Input
              id="address_cep"
              {...register("address_cep")}
              placeholder="00000-000"
              onChange={(e) => handleCepChange(e.target.value)}
            />
            {errors.address_cep && (
              <p className="text-xs text-destructive">{errors.address_cep.message}</p>
            )}
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="address_street">Logradouro</Label>
            <Input id="address_street" {...register("address_street")} placeholder="Rua, Avenida..." />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="address_number">Número</Label>
            <Input id="address_number" {...register("address_number")} placeholder="123" />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="address_complement">Complemento</Label>
            <Input id="address_complement" {...register("address_complement")} placeholder="Apto, Sala..." />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="address_neighborhood">Bairro</Label>
            <Input id="address_neighborhood" {...register("address_neighborhood")} placeholder="Bairro" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_city">Cidade</Label>
            <Input id="address_city" {...register("address_city")} placeholder="Cidade" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_state">UF</Label>
            <Input
              id="address_state"
              {...register("address_state")}
              placeholder="PR"
              maxLength={2}
              className="uppercase"
            />
          </div>
        </div>
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
