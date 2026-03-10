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
import type { TenantInfo } from "@/types/auth";

export default function NovoContratoPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const createContrato = useCreateContrato();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: getMeAction,
  });

  const isMaster = me?.role === "MASTER";
  const userTenants: TenantInfo[] = me?.tenants ?? [];
  const hasMultipleTenants = userTenants.length > 1;

  // MASTER: load all tenants from API
  // Non-MASTER with multiple tenants: use user's own tenants from /auth/me
  const { data: allTenantsData } = useListTenants({ per_page: 200 });

  // Determine available tenant options for the selector
  const selectorTenants: TenantInfo[] = isMaster
    ? (allTenantsData?.results ?? []).map((t) => ({ id: t.id, name: t.name }))
    : userTenants;

  // Show tenant selector when:
  // - MASTER (can pick any tenant), OR
  // - Non-MASTER user with more than 1 linked company
  const showTenantSelector = isMaster || hasMultipleTenants;

  // Effective tenant_id:
  // - If selector shown: use selectedTenantId
  // - If single tenant: auto-use the only tenant
  // - If master with no selection: nothing yet
  const effectiveTenantId =
    showTenantSelector
      ? selectedTenantId
      : userTenants.length === 1
      ? userTenants[0].id
      : "";

  const handleSubmit = async (data: ContratoCreate) => {
    setApiError(null);
    try {
      await createContrato.mutateAsync({ ...data, tenant_id: effectiveTenantId });
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

  // Non-MASTER user with no tenant linked
  if (!isMaster && userTenants.length === 0) {
    return (
      <div className="max-w-3xl">
        <div className="mb-6">
          <Link href="/contratos" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar para contratos
          </Link>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Seu usuário não está vinculado a nenhuma empresa. Contate o administrador.
          </CardContent>
        </Card>
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
          {/* Tenant selector: visible for MASTER (all companies) or multi-tenant users (own companies) */}
          {showTenantSelector && (
            <div className="space-y-2 pb-6 border-b">
              <Label htmlFor="tenant-select">Empresa *</Label>
              {isMaster ? (
                <p className="text-xs text-muted-foreground">
                  Como MASTER, escolha a empresa para a qual o contrato será criado.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Você está vinculado a múltiplas empresas. Selecione para qual empresa este contrato pertence.
                </p>
              )}
              <select
                id="tenant-select"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecione uma empresa...</option>
                {selectorTenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Block form until tenant is selected (when selector is required) */}
          {showTenantSelector && !selectedTenantId ? (
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
