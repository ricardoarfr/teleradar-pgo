"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserStatusBadge } from "@/components/users/user-status-badge";
import { useClients } from "@/hooks/use-clients";
import type { UserStatus } from "@/types/user";
import { formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Eye, Plus, Search } from "lucide-react";

export function ClientsTable() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<UserStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const params = {
    page,
    per_page: perPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filterStatus !== "ALL" ? { status: filterStatus } : {}),
  };

  const { data, isLoading } = useClients(params);

  const clients = data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout((window as any)._clientSearchTimeout);
    (window as any)._clientSearchTimeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 w-64"
            />
          </div>

          <Select
            value={filterStatus}
            onValueChange={(v) => { setFilterStatus(v as any); setPage(1); }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              <SelectItem value="APPROVED">Ativos</SelectItem>
              <SelectItem value="BLOCKED">Bloqueados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Link href="/clients/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      {/* Tabela */}
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-mail</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Telefone</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">CPF/CNPJ</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cidade</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cadastro</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{client.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.cpf_cnpj ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.address_city ?? "—"}</td>
                  <td className="px-4 py-3">
                    <UserStatusBadge status={client.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(client.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/clients/${client.id}`}>
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} cliente{total !== 1 ? "s" : ""} no total
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
