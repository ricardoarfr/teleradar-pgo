"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useScreenAccess } from "@/hooks/use-screen-access";
import { useScreenPermissions } from "@/providers/screen-permissions-provider";
import { useAuth } from "@/providers/auth-provider";
import type { ScreenAction } from "@/lib/screens";

interface ActionGuardProps {
  screenKey: string;
  action: ScreenAction;
  children: React.ReactNode;
}

/**
 * Protege sub-páginas de ação (criar, editar, excluir).
 * Redireciona para /403 se o usuário não tiver a ação específica na tela.
 *
 * @example
 * <ActionGuard screenKey="contratos" action="create">
 *   <NovoContratoForm />
 * </ActionGuard>
 */
export function ActionGuard({ screenKey, action, children }: ActionGuardProps) {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { isLoading: permsLoading } = useScreenPermissions();
  const perms = useScreenAccess(screenKey);

  const isLoading = authLoading || permsLoading;
  const allowed = perms[action];

  useEffect(() => {
    if (!isLoading && !allowed) {
      router.replace("/403");
    }
  }, [isLoading, allowed, router]);

  if (isLoading) return null;
  if (!allowed) return null;

  return <>{children}</>;
}
