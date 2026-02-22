"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTenant, useUpdateTenant } from "@/hooks/use-tenants";
import { toast } from "@/components/ui/use-toast";
import type { TenantStatus } from "@/types/tenant";

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: company, isLoading } = useTenant(id);
  const updateTenant = useUpdateTenant();

  const [name, setName] = useState("");
  const [status, setStatus] = useState<TenantStatus>("ACTIVE");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (company) {
      setName(company.name);
      setStatus(company.status);
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("O nome deve ter pelo menos 2 caracteres.");
      return;
    }
    setError(null);
    try {
      await updateTenant.mutateAsync({ id, data: { name: trimmed, status } });
      toast({ title: "Empresa atualizada!", description: "Os dados foram salvos com sucesso." });
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Erro ao atualizar empresa.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Carregando...
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Empresa não encontrada.
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link
          href="/companies"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para empresas
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{company.name}</CardTitle>
          <CardDescription>Edite os dados da empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da empresa *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="ACTIVE"
                    checked={status === "ACTIVE"}
                    onChange={() => setStatus("ACTIVE")}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">Ativa</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="INACTIVE"
                    checked={status === "INACTIVE"}
                    onChange={() => setStatus("INACTIVE")}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">Inativa</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push("/companies")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateTenant.isPending}>
                {updateTenant.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
