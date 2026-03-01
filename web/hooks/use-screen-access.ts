"use client";

import { useScreenPermissions } from "@/providers/screen-permissions-provider";
import { getScreen } from "@/lib/screens";
import type { ScreenAction, ScreenActionSet } from "@/lib/screens";

const DENIED: ScreenActionSet = { view: false, create: false, edit: false, delete: false };

/**
 * Retorna as permissões de ação para uma tela específica.
 *
 * Fluxo de resolução:
 * 1. Se existir registro no banco (via /admin/profiles/my-permissions) → usa esse
 * 2. Se não houver registro no banco → usa defaultPermissions da definição da tela
 * 3. Se a tela não existir no registry → nega tudo
 *
 * @example
 * const { view, create, edit, delete: remove } = useScreenAccess("partners");
 * {create && <Button>Novo Parceiro</Button>}
 */
export function useScreenAccess(screenKey: string): ScreenActionSet {
  const { permissions, userRole } = useScreenPermissions();

  const screen = getScreen(screenKey);
  if (!screen || !userRole) return DENIED;

  // MASTER sempre tem acesso total — não pode ser restrito
  if (userRole === "MASTER") {
    return { view: true, create: true, edit: true, delete: true };
  }

  // Se o banco tem um registro explícito para esta tela, usa-o
  if (permissions && screenKey in permissions) {
    return permissions[screenKey];
  }

  // Fallback: defaultPermissions definido no registro da tela
  const defaults = screen.defaultPermissions[userRole];
  return defaults ?? DENIED;
}

/**
 * Verifica se o usuário pode executar uma ação específica em uma tela.
 * @example
 * const canCreate = useCanDo("partners", "create");
 */
export function useCanDo(screenKey: string, action: ScreenAction): boolean {
  const perms = useScreenAccess(screenKey);
  return perms[action];
}
