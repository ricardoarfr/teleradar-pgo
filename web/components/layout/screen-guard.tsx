"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useScreenAccess } from "@/hooks/use-screen-access";
import { useScreenPermissions } from "@/providers/screen-permissions-provider";
import { useAuth } from "@/providers/auth-provider";

interface ScreenGuardProps {
  screenKey: string;
  children: React.ReactNode;
}

/**
 * Protege uma página verificando se o usuário tem permissão de visualização.
 * Se não tiver acesso, redireciona para /403.
 *
 * @example
 * // Em qualquer page.tsx:
 * export default function PartnersPage() {
 *   return (
 *     <ScreenGuard screenKey="partners">
 *       <PartnersTable />
 *     </ScreenGuard>
 *   );
 * }
 */
export function ScreenGuard({ screenKey, children }: ScreenGuardProps) {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { isLoading: permsLoading } = useScreenPermissions();
  const { view } = useScreenAccess(screenKey);

  const isLoading = authLoading || permsLoading;

  useEffect(() => {
    if (!isLoading && !view) {
      router.replace("/403");
    }
  }, [isLoading, view, router]);

  if (isLoading) return null;
  if (!view) return null;

  return <>{children}</>;
}
