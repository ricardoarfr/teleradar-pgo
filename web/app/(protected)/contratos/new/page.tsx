"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ContratoForm } from "@/components/contratos/contrato-form";
import { useCreateContrato } from "@/hooks/use-contratos";
import { useListTenants } from "@/hooks/use-tenants";
import { getMeAction } from "@/actions/auth-actions";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import type { ContratoCreate } from "@/types/contrato";

export default function NovoContratoPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const createContrato = useCreateContrato();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: getMeAction,
  });

  const isMasterWithoutTenant = me?.role === "MASTER" && !me?.tenant_id;

  const { data: tenantsData } = useListTenants();
  const tenants = tenantsData?.results ?? [];

  const tenantId = me?.tenant_id ?? selectedTenantId;

  const handleSubmit = async (data: ContratoCreate) => {
    setApiError(null);
    try {
      await createContrato.mutateAsync({ ...data, tenant_id: tenantId });
      toast({ title: "Contrato cadastrado!", description: "O contrato foi criado com sucesso." });
      router.push("/contratos");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") {
        setApiError(detail);
      } else if (Array.isArray(detail) && detail.length > 0) {
        setApiError(detail.map((e: any) => e.msg ?? String(e)).join("; "));
      } else if (err?.response?.status) {
        setApiError(`Erro ${err.response.status}: ${err?.response?.statusText ?? "Falha ao cadastrar contrato."}`);
      } else {
        setApiError("Erro ao cadastrar contrato. Verifique os dados e tente novamente.");
      }
    }
  };

  if (!me) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Carregando...
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href="/contratos"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para contratos
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo Contrato</CardTitle>
          <CardDescription>Preencha os dados para cadastrar um novo contrato.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isMasterWithoutTenant && (
            <div className="space-y-2 pb-6 border-b">
              <Label htmlFor="tenant-select">Empresa *</Label>
              <p className="text-xs text-muted-foreground">
                Como MASTER, escolha a empresa para a qual o contrato será criado.
              </p>
              <select
                id="tenant-select"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecione uma empresa...</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isMasterWithoutTenant && !selectedTenantId ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Selecione uma empresa acima para continuar.
            </p>
          ) : (
            <ContratoForm
              mode="create"
              onSubmit={handleSubmit}
              isSubmitting={createContrato.isPending}
              apiError={apiError}
              onCancel={() => router.push("/contratos")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
