"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PartnerForm } from "@/components/partners/partner-form";
import { useCreatePartner } from "@/hooks/use-partners";
import { useListTenants } from "@/hooks/use-tenants";
import { getMeAction } from "@/actions/auth-actions";
import { useQuery } from "@tanstack/react-query";
import type { PartnerCreate } from "@/types/partner";
import { toast } from "@/components/ui/use-toast";

export default function NewPartnerPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const createPartner = useCreatePartner();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: getMeAction,
  });

  const isMasterWithoutTenant = me?.role === "MASTER" && !me?.tenant_id;

  const { data: tenantsData } = useListTenants();
  const tenants = tenantsData?.results ?? [];

  const tenantId = me?.tenant_id ?? selectedTenantId;

  const handleSubmit = async (data: PartnerCreate) => {
    setApiError(null);
    try {
      await createPartner.mutateAsync(data);
      toast({ title: "Parceiro cadastrado!", description: "O parceiro foi cadastrado com sucesso." });
      router.push("/partners");
    } catch (err: any) {
      setApiError(
        err?.response?.data?.detail ?? "Erro ao cadastrar parceiro. Verifique os dados."
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
        <Link href="/partners" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para parceiros
        </Link>
      </div>

      {/* Seletor de tenant para usuários MASTER sem tenant próprio */}
      {isMasterWithoutTenant && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Selecionar tenant</CardTitle>
            <CardDescription>
              Como MASTER, escolha o tenant onde o parceiro será criado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="tenant-select">Tenant *</Label>
              <select
                id="tenant-select"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecione um tenant...</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Novo parceiro</CardTitle>
          <CardDescription>
            Cadastre um novo parceiro. Ele será ativado imediatamente e poderá acessar o portal do parceiro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMasterWithoutTenant && !selectedTenantId ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Selecione um tenant acima para continuar.
            </p>
          ) : (
            <PartnerForm
              mode="create"
              tenantId={tenantId}
              onSubmit={handleSubmit}
              isSubmitting={createPartner.isPending}
              apiError={apiError}
              onCancel={() => router.push("/partners")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
