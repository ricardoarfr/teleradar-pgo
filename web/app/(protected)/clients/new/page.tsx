"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientForm } from "@/components/clients/client-form";
import { useCreateClient } from "@/hooks/use-clients";
import { getMeAction } from "@/actions/auth-actions";
import { useQuery } from "@tanstack/react-query";
import type { ClientCreate } from "@/types/client";
import { toast } from "@/components/ui/use-toast";

export default function NewClientPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const createClient = useCreateClient();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: getMeAction,
  });

  const tenantId = me?.tenant_id ?? "";

  const handleSubmit = async (data: ClientCreate) => {
    setApiError(null);
    try {
      await createClient.mutateAsync(data);
      toast({ title: "Cliente cadastrado!", description: "O cliente foi cadastrado com sucesso." });
      router.push("/clients");
    } catch (err: any) {
      setApiError(
        err?.response?.data?.detail ?? "Erro ao cadastrar cliente. Verifique os dados."
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
        <Link href="/clients" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para clientes
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo cliente</CardTitle>
          <CardDescription>
            Cadastre um novo cliente. Ele será ativado imediatamente e poderá acessar o portal do cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm
            mode="create"
            tenantId={tenantId}
            onSubmit={handleSubmit}
            isSubmitting={createClient.isPending}
            apiError={apiError}
            onCancel={() => router.push("/clients")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
