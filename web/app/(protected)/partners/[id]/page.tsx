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
import { PartnerForm } from "@/components/partners/partner-form";
import { usePartner, useUpdatePartner, useBlockPartner, useUnblockPartner } from "@/hooks/use-partners";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import type { PartnerUpdate } from "@/types/partner";

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [apiError, setApiError] = useState<string | null>(null);

  const { data: partner, isLoading } = usePartner(id);
  const updatePartner = useUpdatePartner();
  const blockPartner = useBlockPartner();
  const unblockPartner = useUnblockPartner();

  const handleUpdate = async (data: PartnerUpdate) => {
    setApiError(null);
    try {
      await updatePartner.mutateAsync({ id, data });
      toast({ title: "Parceiro atualizado!", description: "As informações foram salvas." });
    } catch (err: any) {
      setApiError(err?.response?.data?.detail ?? "Erro ao atualizar parceiro.");
    }
  };

  const handleBlock = async () => {
    try {
      await blockPartner.mutateAsync(id);
      toast({ title: "Parceiro bloqueado." });
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
      await unblockPartner.mutateAsync(id);
      toast({ title: "Parceiro desbloqueado." });
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

  if (!partner) {
    return (
      <div className="space-y-4">
        <Link href="/partners" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para parceiros
        </Link>
        <p className="text-sm text-muted-foreground">Parceiro não encontrado.</p>
      </div>
    );
  }

  const isBlocked = partner.status === "BLOCKED";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="mb-2">
        <Link href="/partners" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para parceiros
        </Link>
      </div>

      {/* Header do parceiro */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{partner.name}</h1>
          <p className="text-muted-foreground text-sm">{partner.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <UserStatusBadge status={partner.status} />
            <span className="text-xs text-muted-foreground">
              Cadastrado em {formatDate(partner.created_at)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {isBlocked ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnblock}
              disabled={unblockPartner.isPending}
            >
              <ShieldCheck className="h-4 w-4" />
              Desbloquear
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBlock}
              disabled={blockPartner.isPending}
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
          <CardTitle>Informações do parceiro</CardTitle>
          <CardDescription>Edite os dados cadastrais do parceiro.</CardDescription>
        </CardHeader>
        <CardContent>
          <PartnerForm
            mode="edit"
            partner={partner}
            onSubmit={handleUpdate}
            isSubmitting={updatePartner.isPending}
            apiError={apiError}
            onCancel={() => router.push("/partners")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
