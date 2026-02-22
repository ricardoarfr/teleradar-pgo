"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserStatusBadge } from "./user-status-badge";
import { UserRoleBadge } from "./user-role-badge";
import { useUsers, usePendingUsers } from "@/hooks/use-users";
import type { UserRole, UserStatus } from "@/types/user";
import { formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Eye, Plus } from "lucide-react";

export function UsersTable() {
  const [tab, setTab] = useState<"all" | "pending">("all");
  const [filterRole, setFilterRole] = useState<UserRole | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<UserStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const params = {
    page,
    per_page: perPage,
    ...(filterRole !== "ALL" ? { role: filterRole } : {}),
    ...(filterStatus !== "ALL" ? { user_status: filterStatus } : {}),
  };

  const { data: allData, isLoading: allLoading } = useUsers(tab === "all" ? params : {});
  const { data: pendingData, isLoading: pendingLoading } = usePendingUsers();

  const isLoading = tab === "all" ? allLoading : pendingLoading;
  const users = tab === "all" ? allData?.results ?? [] : pendingData ?? [];
  const total = tab === "all" ? allData?.total ?? 0 : (pendingData?.length ?? 0);
  const totalPages = tab === "all" ? Math.ceil(total / perPage) : 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => { setTab("all"); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              tab === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => { setTab("pending"); setPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md ${
              tab === "pending"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Pendentes
            {(pendingData?.length ?? 0) > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 px-1.5 rounded-full text-xs">
                {pendingData?.length}
              </Badge>
            )}
          </button>
        </div>
        <Link href="/admin/users/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </Link>
      </div>

      {/* Filtros (apenas na aba todos) */}
      {tab === "all" && (
        <div className="flex gap-3">
          <Select
            value={filterRole}
            onValueChange={(v) => { setFilterRole(v as any); setPage(1); }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os roles</SelectItem>
              <SelectItem value="MASTER">Master</SelectItem>
              <SelectItem value="ADMIN">Administrador</SelectItem>
              <SelectItem value="MANAGER">Gerente</SelectItem>
              <SelectItem value="STAFF">Colaborador</SelectItem>
              <SelectItem value="CLIENT">Cliente</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterStatus}
            onValueChange={(v) => { setFilterStatus(v as any); setPage(1); }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              <SelectItem value="APPROVED">Aprovados</SelectItem>
              <SelectItem value="PENDING">Pendentes</SelectItem>
              <SelectItem value="BLOCKED">Bloqueados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-mail</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cadastro</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <UserRoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3">
                    <UserStatusBadge status={user.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/users/${user.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {tab === "all" && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} usuário{total !== 1 ? "s" : ""} no total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
