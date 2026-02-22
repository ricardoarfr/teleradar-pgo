"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateTenant } from "@/hooks/use-tenants";
import { toast } from "@/components/ui/use-toast";

export default function NewCompanyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createTenant = useCreateTenant();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("O nome deve ter pelo menos 2 caracteres.");
      return;
    }
    setError(null);
    try {
      await createTenant.mutateAsync({ name: trimmed });
      toast({ title: "Empresa criada!", description: "A empresa foi cadastrada com sucesso." });
      router.push("/companies");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Erro ao criar empresa. Tente novamente.");
    }
  };

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
          <CardTitle>Nova empresa</CardTitle>
          <CardDescription>
            Cadastre uma nova empresa. Ela ficará ativa imediatamente e poderá receber parceiros e usuários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da empresa *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Internetlev Telecom"
                autoFocus
              />
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push("/companies")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createTenant.isPending}>
                {createTenant.isPending ? "Criando..." : "Criar empresa"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
