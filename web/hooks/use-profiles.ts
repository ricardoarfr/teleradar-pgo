import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/api";
import type { AllProfilesPermissions, ScreenPermissionsMap } from "@/types/permission";

export function useAllProfilesPermissions() {
  return useQuery({
    queryKey: ["profiles", "permissions"],
    queryFn: () =>
      apiGet<{ permissions: AllProfilesPermissions }>("/admin/profiles/permissions").then(
        (r) => r.permissions
      ),
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ role, screens }: { role: string; screens: ScreenPermissionsMap }) =>
      apiPut<{ permissions: ScreenPermissionsMap }>(`/admin/profiles/permissions/${role}`, {
        screens,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles", "permissions"] });
    },
  });
}
