import type { UserRole } from "./user";

export type AppModule =
  | "users"
  | "tenants"
  | "contracts"
  | "projects"
  | "materials"
  | "payments"
  | "reports"
  | "admin"
  | "client_portal";

export type ModuleAction = "read" | "create" | "update" | "delete" | "approve";

export interface ModulePermission {
  module: AppModule;
  actions: ModuleAction[];
}

const allActions: ModuleAction[] = ["read", "create", "update", "delete", "approve"];

export const ROLE_PERMISSIONS: Record<UserRole, ModulePermission[]> = {
  MASTER: [
    { module: "admin", actions: allActions },
    { module: "users", actions: allActions },
    { module: "tenants", actions: allActions },
    { module: "contracts", actions: allActions },
    { module: "projects", actions: allActions },
    { module: "materials", actions: allActions },
    { module: "payments", actions: allActions },
    { module: "reports", actions: allActions },
    { module: "client_portal", actions: allActions },
  ],
  ADMIN: [
    { module: "users", actions: ["read", "update", "approve"] },
    { module: "tenants", actions: ["read", "create", "update"] },
    { module: "contracts", actions: ["read", "create", "update", "delete"] },
    { module: "projects", actions: ["read", "create", "update", "delete"] },
    { module: "materials", actions: ["read", "create", "update"] },
    { module: "payments", actions: ["read", "create", "update"] },
    { module: "reports", actions: ["read"] },
  ],
  MANAGER: [
    { module: "contracts", actions: ["read", "create", "update"] },
    { module: "projects", actions: ["read", "create", "update"] },
    { module: "materials", actions: ["read", "create"] },
    { module: "payments", actions: ["read"] },
    { module: "reports", actions: ["read"] },
  ],
  STAFF: [
    { module: "contracts", actions: ["read"] },
    { module: "projects", actions: ["read"] },
    { module: "materials", actions: ["read"] },
    { module: "reports", actions: ["read"] },
  ],
  PARTNER: [
    { module: "client_portal", actions: ["read"] },
  ],
};

export function hasPermission(
  role: UserRole,
  module: AppModule,
  action: ModuleAction
): boolean {
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  const modulePerm = permissions.find((p) => p.module === module);
  return modulePerm?.actions.includes(action) ?? false;
}

// --- Screen-level permissions (granular por tela) ---

export interface ScreenActionSet {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

/** Mapa de permissões: { screen_key → ScreenActionSet } */
export type ScreenPermissionsMap = Record<string, ScreenActionSet>;

/** Mapa completo para o painel de administração: { role → { screen_key → ScreenActionSet } } */
export type AllProfilesPermissions = Record<string, ScreenPermissionsMap>;
