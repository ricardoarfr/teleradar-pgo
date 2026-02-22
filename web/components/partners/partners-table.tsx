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
import { usePartners } from "@/hooks/use-partners";
import type { UserStatus } from "@/types/user";
import { formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Eye, Plus, Search } from "lucide-react";

export function PartnersTable() {
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

  const { data, isLoading } = usePartners(params);

  const partners = data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout((window as any)._partnerSearchTimeout);
    (window as any)._partnerSearchTimeout = setTimeout(() => {
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

        <Link href="/partners/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Novo Parceiro
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
            ) : partners.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum parceiro encontrado.
                </td>
              </tr>
            ) : (
              partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{partner.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{partner.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{partner.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{partner.cpf_cnpj ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{partner.address_city ?? "—"}</td>
                  <td className="px-4 py-3">
                    <UserStatusBadge status={partner.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(partner.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/partners/${partner.id}`}>
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
            {total} parceiro{total !== 1 ? "s" : ""} no total
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
