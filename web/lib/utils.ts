import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { UserRole, UserStatus } from "@/types/user";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRole(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    MASTER: "Master",
    ADMIN: "Administrador",
    MANAGER: "Gerente",
    STAFF: "Colaborador",
    PARTNER: "Parceiro",
  };
  return labels[role] ?? role;
}

export function formatStatus(status: UserStatus): string {
  const labels: Record<UserStatus, string> = {
    PENDING: "Pendente",
    APPROVED: "Aprovado",
    BLOCKED: "Bloqueado",
  };
  return labels[status] ?? status;
}
