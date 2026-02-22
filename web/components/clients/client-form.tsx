"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Client, ClientCreate, ClientUpdate } from "@/types/client";

// Schema de criação (todos os campos obrigatórios do negócio)
export const clientCreateSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  tenant_id: z.string().uuid("Tenant inválido"),
  cpf_cnpj: z.string().optional(),
  phone: z.string().optional(),
  address_cep: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().max(2).optional(),
  notes: z.string().optional(),
});

export const clientUpdateSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  cpf_cnpj: z.string().optional(),
  phone: z.string().optional(),
  address_cep: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().max(2).optional(),
  notes: z.string().optional(),
});

type CreateFormData = z.infer<typeof clientCreateSchema>;
type UpdateFormData = z.infer<typeof clientUpdateSchema>;

interface ClientFormCreateProps {
  mode: "create";
  tenantId: string;
  onSubmit: (data: ClientCreate) => Promise<void>;
  isSubmitting: boolean;
  apiError: string | null;
  onCancel: () => void;
}

interface ClientFormEditProps {
  mode: "edit";
  client: Client;
  onSubmit: (data: ClientUpdate) => Promise<void>;
  isSubmitting: boolean;
  apiError: string | null;
  onCancel: () => void;
}

type ClientFormProps = ClientFormCreateProps | ClientFormEditProps;

export function ClientForm(props: ClientFormProps) {
  const isCreate = props.mode === "create";

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(clientCreateSchema),
    defaultValues: isCreate
      ? { tenant_id: (props as ClientFormCreateProps).tenantId }
      : undefined,
  });

  const editForm = useForm<UpdateFormData>({
    resolver: zodResolver(clientUpdateSchema),
    defaultValues: !isCreate
      ? {
          name: (props as ClientFormEditProps).client.name,
          cpf_cnpj: (props as ClientFormEditProps).client.profile?.cpf_cnpj ?? "",
          phone: (props as ClientFormEditProps).client.profile?.phone ?? "",
          address_cep: (props as ClientFormEditProps).client.profile?.address_cep ?? "",
          address_street: (props as ClientFormEditProps).client.profile?.address_street ?? "",
          address_number: (props as ClientFormEditProps).client.profile?.address_number ?? "",
          address_complement: (props as ClientFormEditProps).client.profile?.address_complement ?? "",
          address_neighborhood: (props as ClientFormEditProps).client.profile?.address_neighborhood ?? "",
          address_city: (props as ClientFormEditProps).client.profile?.address_city ?? "",
          address_state: (props as ClientFormEditProps).client.profile?.address_state ?? "",
          notes: (props as ClientFormEditProps).client.profile?.notes ?? "",
        }
      : undefined,
  });

  const form = isCreate ? createForm : editForm;
  const { register, handleSubmit, formState: { errors } } = form as any;

  const handleFormSubmit = async (data: any) => {
    if (isCreate) {
      await (props as ClientFormCreateProps).onSubmit(data as ClientCreate);
    } else {
      const clean: ClientUpdate = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== "" && v !== undefined)
      ) as ClientUpdate;
      await (props as ClientFormEditProps).onSubmit(clean);
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
            <Input id="name" {...register("name")} placeholder="Nome do cliente" />
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

      {/* Dados de contato */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Contato e documento
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" {...register("phone")} placeholder="(99) 99999-9999" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf_cnpj">CPF / CNPJ</Label>
            <Input id="cpf_cnpj" {...register("cpf_cnpj")} placeholder="000.000.000-00" />
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
            <Label htmlFor="address_cep">CEP</Label>
            <Input id="address_cep" {...register("address_cep")} placeholder="00000-000" />
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
          placeholder="Anotações internas sobre o cliente..."
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
            ? "Cadastrar cliente"
            : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
