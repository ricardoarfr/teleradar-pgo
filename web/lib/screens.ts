import {
  Users,
  Building2,
  UserCheck,
  Settings2,
  ShieldCheck,
  FileText,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types/auth";

export type ScreenAction = "view" | "create" | "edit" | "delete";

export interface ScreenActionSet {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface ScreenDefinition {
  key: string;
  label: string;
  path: string;
  icon?: LucideIcon;
  /** Quais ações fazem sentido para esta tela */
  actions: ScreenAction[];
  /** Permissões padrão por role — usadas como fallback quando não há registro no banco */
  defaultPermissions: Partial<Record<UserRole, ScreenActionSet>>;
}

const none: ScreenActionSet = { view: false, create: false, edit: false, delete: false };
const viewOnly: ScreenActionSet = { view: true, create: false, edit: false, delete: false };
const full: ScreenActionSet = { view: true, create: true, edit: true, delete: true };
const viewCreate: ScreenActionSet = { view: true, create: true, edit: false, delete: false };
const viewCreateEdit: ScreenActionSet = { view: true, create: true, edit: true, delete: false };

/**
 * REGISTRO CENTRAL DE TELAS
 *
 * Toda nova tela DEVE ser adicionada aqui.
 * Sem registro: a tela não aparece no controle de perfis e não é protegida.
 */
export const SCREENS: ScreenDefinition[] = [
  {
    key: "contratos",
    label: "Contratos",
    path: "/contratos",
    icon: FileText,
    actions: ["view", "create", "edit", "delete"],
    defaultPermissions: {
      MASTER: full,
      ADMIN: full,
      MANAGER: full,
      STAFF: viewOnly,
      PARTNER: none,
    },
  },
  {
    key: "partners",
    label: "Parceiros",
    path: "/partners",
    icon: UserCheck,
    actions: ["view", "create", "edit", "delete"],
    defaultPermissions: {
      MASTER: full,
      ADMIN: full,
      MANAGER: viewCreateEdit,
      STAFF: viewOnly,
      PARTNER: none,
    },
  },
  {
    key: "companies",
    label: "Empresas",
    path: "/companies",
    icon: Building2,
    actions: ["view", "create", "edit", "delete"],
    defaultPermissions: {
      MASTER: full,
      ADMIN: viewCreateEdit,
      MANAGER: viewOnly,
      STAFF: none,
      PARTNER: none,
    },
  },
  {
    key: "catalogo",
    label: "Catálogo",
    path: "/catalogo",
    icon: Settings2,
    actions: ["view", "create", "edit", "delete"],
    defaultPermissions: {
      MASTER: full,
      ADMIN: full,
      MANAGER: viewCreateEdit,
      STAFF: viewOnly,
      PARTNER: none,
    },
  },
  {
    key: "admin.users",
    label: "Usuários",
    path: "/admin/users",
    icon: Users,
    actions: ["view", "create", "edit", "delete"],
    defaultPermissions: {
      MASTER: full,
      ADMIN: viewCreateEdit,
      MANAGER: none,
      STAFF: none,
      PARTNER: none,
    },
  },
  {
    key: "admin.profiles",
    label: "Perfis de Acesso",
    path: "/admin/profiles",
    icon: ShieldCheck,
    actions: ["view", "edit"],
    defaultPermissions: {
      MASTER: { view: true, create: false, edit: true, delete: false },
      ADMIN: none,
      MANAGER: none,
      STAFF: none,
      PARTNER: none,
    },
  },
];

/** Retorna a definição de uma tela pelo key */
export function getScreen(key: string): ScreenDefinition | undefined {
  return SCREENS.find((s) => s.key === key);
}

/** Retorna as telas que aparecem no sidebar (têm ícone) */
export function getSidebarScreens(): ScreenDefinition[] {
  return SCREENS.filter((s) => !!s.icon);
}
