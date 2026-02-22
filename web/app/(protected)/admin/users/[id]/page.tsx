"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserStatusBadge } from "@/components/users/user-status-badge";
import { UserRoleBadge } from "@/components/users/user-role-badge";
import { UserActions } from "@/components/users/user-actions";
import { useUser, useChangeUserPassword, useChangeUserTenant } from "@/hooks/use-users";
import { useListTenants } from "@/hooks/use-tenants";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UserDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: user, isLoading, error } = useUser(id);
  const { user: currentUser } = useAuth();
  const { data: tenantsData } = useListTenants();
  const tenants = tenantsData?.results ?? [];

  const changePassword = useChangeUserPassword();
  const changeTenant = useChangeUserTenant();

  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<string | undefined>(undefined);

  const isAdminOrMaster =
    currentUser?.role === "MASTER" || currentUser?.role === "ADMIN";

  // Initialize tenant select once user is loaded
  const tenantValue =
    selectedTenant !== undefined
      ? selectedTenant
      : (user?.tenant_id ?? "NONE");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setPasswordError(null);
    try {
      await changePassword.mutateAsync({ userId: id, data: { new_password: newPassword } });
      setNewPassword("");
      toast({ title: "Senha alterada!", description: "A nova senha foi salva com sucesso." });
    } catch (err: any) {
      setPasswordError(err?.response?.data?.detail ?? "Erro ao alterar senha.");
    }
  };

  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tenantId = tenantValue === "NONE" ? null : tenantValue;
    try {
      await changeTenant.mutateAsync({ userId: id, data: { tenant_id: tenantId } });
      toast({ title: "Empresa vinculada!", description: "O vínculo foi atualizado com sucesso." });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err?.response?.data?.detail ?? "Erro ao vincular empresa.",
        variant: "destructive",
      });
    }
  };

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
            <p className="text-xs text-muted-foreground mb-1">Empresa</p>
            <p>
              {user.tenant_id
                ? (tenants.find((t) => t.id === user.tenant_id)?.name ?? user.tenant_id)
                : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      {isAdminOrMaster && currentUser && (
        <>
          {/* Vincular empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Empresa</CardTitle>
              <CardDescription>Vincule este usuário a uma empresa.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTenantSubmit} className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="tenant">Empresa</Label>
                  <Select
                    value={tenantValue}
                    onValueChange={(v) => setSelectedTenant(v)}
                  >
                    <SelectTrigger id="tenant">
                      <SelectValue placeholder="Selecione uma empresa..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Nenhuma</SelectItem>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={changeTenant.isPending}>
                  {changeTenant.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Alterar senha */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alterar senha</CardTitle>
              <CardDescription>
                Define uma nova senha para este usuário. Mínimo 8 caracteres.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  {passwordError && (
                    <p className="text-xs text-destructive">{passwordError}</p>
                  )}
                </div>
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? "Salvando..." : "Alterar"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Ações (bloquear, aprovar, etc.) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ações</CardTitle>
              <CardDescription>Gerencie o acesso deste usuário.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserActions user={user} currentUserRole={currentUser.role} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
