"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SCREENS } from "@/lib/screens";
import type { ScreenAction } from "@/lib/screens";
import { useAllProfilesPermissions, useUpdateRolePermissions } from "@/hooks/use-profiles";
import type { AllProfilesPermissions, ScreenPermissionsMap, ScreenActionSet } from "@/types/permission";
import { Loader2, Save } from "lucide-react";
import { useScreenPermissions } from "@/providers/screen-permissions-provider";

const EDITABLE_ROLES = ["ADMIN", "MANAGER", "STAFF", "PARTNER"] as const;
type EditableRole = typeof EDITABLE_ROLES[number];

const ACTION_LABELS: Record<ScreenAction, string> = {
  view: "Ver",
  create: "Criar",
  edit: "Editar",
  delete: "Excluir",
};

function buildDefaultPerms(dbData: AllProfilesPermissions | undefined): Record<EditableRole, ScreenPermissionsMap> {
  const result = {} as Record<EditableRole, ScreenPermissionsMap>;
  for (const role of EDITABLE_ROLES) {
    result[role] = {};
    for (const screen of SCREENS) {
      const fromDb = dbData?.[role]?.[screen.key];
      const defaults = screen.defaultPermissions[role as keyof typeof screen.defaultPermissions];
      result[role][screen.key] = fromDb ?? defaults ?? { view: false, create: false, edit: false, delete: false };
    }
  }
  return result;
}

export function ProfilesMatrix() {
  const { data: dbPerms, isLoading } = useAllProfilesPermissions();
  const updateMutation = useUpdateRolePermissions();
  const { reload: reloadMyPerms } = useScreenPermissions();
  const { toast } = useToast();

  const [localPerms, setLocalPerms] = useState<Record<EditableRole, ScreenPermissionsMap>>(() =>
    buildDefaultPerms(undefined)
  );
  const [dirty, setDirty] = useState<Set<EditableRole>>(new Set());

  useEffect(() => {
    if (dbPerms) {
      setLocalPerms(buildDefaultPerms(dbPerms));
      setDirty(new Set());
    }
  }, [dbPerms]);

  function toggle(role: EditableRole, screenKey: string, action: ScreenAction) {
    setLocalPerms((prev) => {
      const current = prev[role][screenKey];
      const next = { ...current, [action]: !current[action] };

      // Se desligar "view", desliga tudo automaticamente
      if (action === "view" && !next.view) {
        next.create = false;
        next.edit = false;
        next.delete = false;
      }
      // Se ligar create/edit/delete, liga "view" automaticamente
      if ((action === "create" || action === "edit" || action === "delete") && next[action]) {
        next.view = true;
      }

      return {
        ...prev,
        [role]: { ...prev[role], [screenKey]: next },
      };
    });
    setDirty((prev) => new Set(prev).add(role));
  }

  async function saveRole(role: EditableRole) {
    try {
      await updateMutation.mutateAsync({ role, screens: localPerms[role] });
      await reloadMyPerms();
      setDirty((prev) => {
        const next = new Set(prev);
        next.delete(role);
        return next;
      });
      toast({ title: "Permissões salvas", description: `Perfil ${role} atualizado com sucesso.` });
    } catch {
      toast({ title: "Erro ao salvar", description: "Não foi possível salvar as permissões.", variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {EDITABLE_ROLES.map((role) => (
        <div key={role} className="rounded-lg border overflow-hidden">
          {/* Header do perfil */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">{role}</Badge>
              {dirty.has(role) && (
                <span className="text-xs text-amber-600 font-medium">Alterações não salvas</span>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => saveRole(role)}
              disabled={!dirty.has(role) || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Salvar {role}
            </Button>
          </div>

          {/* Tabela de telas x ações */}
          <table className="w-full text-sm">
            <thead className="bg-muted/20">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground w-48">Tela</th>
                {(["view", "create", "edit", "delete"] as ScreenAction[]).map((action) => (
                  <th key={action} className="px-4 py-2 text-center font-medium text-muted-foreground w-24">
                    {ACTION_LABELS[action]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {SCREENS.map((screen) => {
                const perms = localPerms[role][screen.key];
                return (
                  <tr key={screen.key} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{screen.label}</td>
                    {(["view", "create", "edit", "delete"] as ScreenAction[]).map((action) => {
                      const supported = screen.actions.includes(action);
                      return (
                        <td key={action} className="px-4 py-3 text-center">
                          {supported ? (
                            <Switch
                              checked={perms[action]}
                              onCheckedChange={() => toggle(role, screen.key, action)}
                              disabled={action !== "view" && !perms.view}
                              className="mx-auto"
                            />
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
