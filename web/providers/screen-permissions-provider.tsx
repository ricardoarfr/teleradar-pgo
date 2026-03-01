"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/providers/auth-provider";
import { apiGet } from "@/lib/api";
import type { ScreenPermissionsMap } from "@/types/permission";
import type { UserRole } from "@/types/auth";

interface ScreenPermissionsContextValue {
  permissions: ScreenPermissionsMap | null;
  userRole: UserRole | null;
  isLoading: boolean;
  reload: () => Promise<void>;
}

const ScreenPermissionsContext = createContext<ScreenPermissionsContextValue | null>(null);

export function ScreenPermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<ScreenPermissionsMap | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setPermissions(null);
      return;
    }
    // MASTER não precisa buscar — tem tudo liberado
    if (user.role === "MASTER") {
      setPermissions(null);
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiGet<{ permissions: ScreenPermissionsMap }>("/admin/profiles/my-permissions");
      setPermissions(res.permissions);
    } catch {
      setPermissions(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScreenPermissionsContext.Provider
      value={{ permissions, userRole: user?.role ?? null, isLoading, reload: load }}
    >
      {children}
    </ScreenPermissionsContext.Provider>
  );
}

export function useScreenPermissions(): ScreenPermissionsContextValue {
  const ctx = useContext(ScreenPermissionsContext);
  if (!ctx) throw new Error("useScreenPermissions deve ser usado dentro de ScreenPermissionsProvider");
  return ctx;
}
