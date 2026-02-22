"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldBan, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserStatusBadge } from "@/components/users/user-status-badge";
import { ClientForm } from "@/components/clients/client-form";
import { useClient, useUpdateClient, useBlockClient, useUnblockClient } from "@/hooks/use-clients";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import type { ClientUpdate } from "@/types/client";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [apiError, setApiError] = useState<string | null>(null);

  const { data: client, isLoading } = useClient(id);
  const updateClient = useUpdateClient();
  const blockClient = useBlockClient();
  const unblockClient = useUnblockClient();

  const handleUpdate = async (data: ClientUpdate) => {
    setApiError(null);
    try {
      await updateClient.mutateAsync({ id, data });
      toast({ title: "Cliente atualizado!", description: "As informações foram salvas." });
    } catch (err: any) {
      setApiError(err?.response?.data?.detail ?? "Erro ao atualizar cliente.");
    }
  };

  const handleBlock = async () => {
    try {
      await blockClient.mutateAsync(id);
      toast({ title: "Cliente bloqueado." });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err?.response?.data?.detail ?? "Não foi possível bloquear.",
        variant: "destructive",
      });
    }
  };

  const handleUnblock = async () => {
    try {
      await unblockClient.mutateAsync(id);
      toast({ title: "Cliente desbloqueado." });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err?.response?.data?.detail ?? "Não foi possível desbloquear.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Carregando...
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-4">
        <Link href="/clients" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para clientes
        </Link>
        <p className="text-sm text-muted-foreground">Cliente não encontrado.</p>
      </div>
    );
  }

  const isBlocked = client.status === "BLOCKED";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="mb-2">
        <Link href="/clients" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para clientes
        </Link>
      </div>

      {/* Header do cliente */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-muted-foreground text-sm">{client.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <UserStatusBadge status={client.status} />
            <span className="text-xs text-muted-foreground">
              Cadastrado em {formatDate(client.created_at)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {isBlocked ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnblock}
              disabled={unblockClient.isPending}
            >
              <ShieldCheck className="h-4 w-4" />
              Desbloquear
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBlock}
              disabled={blockClient.isPending}
              className="text-destructive border-destructive hover:bg-destructive/10"
            >
              <ShieldBan className="h-4 w-4" />
              Bloquear
            </Button>
          )}
        </div>
      </div>

      {/* Formulário de edição */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do cliente</CardTitle>
          <CardDescription>Edite os dados cadastrais do cliente.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm
            mode="edit"
            client={client}
            onSubmit={handleUpdate}
            isSubmitting={updateClient.isPending}
            apiError={apiError}
            onCancel={() => router.push("/clients")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
