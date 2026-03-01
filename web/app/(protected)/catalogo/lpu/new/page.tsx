"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LPUForm } from "@/components/catalogo/lpu/lpu-form";
import { useCreateLPU } from "@/hooks/use-catalogo";
import { usePartners } from "@/hooks/use-partners";
import { useListTenants } from "@/hooks/use-tenants";
import { getMeAction } from "@/actions/auth-actions";
import { toast } from "@/components/ui/use-toast";
import type { LPUCreate } from "@/types/catalogo";

export default function LPUCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMeAction });
  const isMasterWithoutTenant = me?.role === "MASTER" && !me?.tenant_id;

  // MASTER pode chegar com ?tenant_id= pré-selecionado vindo da tabela
  const [selectedTenantId, setSelectedTenantId] = useState(
    searchParams.get("tenant_id") ?? ""
  );

  const { data: tenantsData } = useListTenants();
  const tenants = tenantsData?.results ?? [];

  // tenant efetivo: próprio do usuário ou o selecionado pelo MASTER
  const effectiveTenantId = me?.tenant_id ?? (selectedTenantId || undefined);

  const createLPU = useCreateLPU(effectiveTenantId);
  const { data: partnersData } = usePartners({ per_page: 200 });
  const parceiros = partnersData?.results ?? [];

  const handleSubmit = async (data: LPUCreate) => {
    setApiError(null);
    try {
      const lpu = await createLPU.mutateAsync(data);
      toast({ title: "LPU cadastrada!", description: "A LPU foi cadastrada com sucesso." });
      router.push(`/catalogo/lpu/${lpu.id}${effectiveTenantId ? `?tenant_id=${effectiveTenantId}` : ""}`);
    } catch (err: any) {
      setApiError(
        err?.response?.data?.detail ?? "Erro ao cadastrar LPU. Verifique os dados."
      );
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
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/catalogo/lpu"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para LPUs
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova LPU</CardTitle>
          <CardDescription>
            Cadastre uma nova Lista de Preços Unitários vinculada a um parceiro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isMasterWithoutTenant && (
            <div className="space-y-2 pb-6 border-b">
              <Label htmlFor="tenant-select">Tenant *</Label>
              <p className="text-xs text-muted-foreground">
                Como MASTER, escolha o tenant onde a LPU será criada.
              </p>
              <select
                id="tenant-select"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecione um tenant...</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {isMasterWithoutTenant && !selectedTenantId ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Selecione um tenant acima para continuar.
            </p>
          ) : (
            <LPUForm
              mode="create"
              parceiros={parceiros}
              onSubmit={handleSubmit}
              isSubmitting={createLPU.isPending}
              apiError={apiError}
              onCancel={() => router.push("/catalogo/lpu")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
