"use client";

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserStatusBadge } from "@/components/users/user-status-badge";
import { UserRoleBadge } from "@/components/users/user-role-badge";
import { UserActions } from "@/components/users/user-actions";
import { useUser } from "@/hooks/use-users";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, AlertTriangle } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UserDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: user, isLoading, error } = useUser(id);
  const { user: currentUser } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-destructive font-medium">Usuário não encontrado.</p>
        <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">
          ← Voltar para usuários
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Usuários
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      {/* Dados principais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Role</p>
              <UserRoleBadge role={user.role} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <UserStatusBadge status={user.status} />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Cadastrado em</p>
              <p>{formatDate(user.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Atualizado em</p>
              <p>{formatDate(user.updated_at)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tentativas de login</p>
              <p className={user.login_attempts >= 5 ? "text-destructive font-medium" : ""}>
                {user.login_attempts}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Bloqueado até</p>
              <p>{user.locked_until ? formatDate(user.locked_until) : "—"}</p>
            </div>
          </div>

          <div className="text-sm">
            <p className="text-xs text-muted-foreground mb-1">Tenant</p>
            <p>{user.tenant_id ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      {currentUser && (currentUser.role === "MASTER" || currentUser.role === "ADMIN") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações</CardTitle>
            <CardDescription>Gerencie o acesso deste usuário.</CardDescription>
          </CardHeader>
          <CardContent>
            <UserActions user={user} currentUserRole={currentUser.role} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
