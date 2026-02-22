import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import type { Tenant, TenantCreate, TenantListResponse, TenantUpdate } from "@/types/tenant";

export function useListTenants(params?: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ["tenants", params],
    queryFn: () =>
      apiGet<TenantListResponse>("/tenants/", {
        per_page: 100,
        ...params,
      } as Record<string, unknown>),
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ["tenants", id],
    queryFn: () => apiGet<Tenant>(`/tenants/${id}`),
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TenantCreate) => apiPost<Tenant>("/tenants/", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TenantUpdate }) =>
      apiPut<Tenant>(`/tenants/${id}`, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      qc.invalidateQueries({ queryKey: ["tenants", id] });
    },
  });
}
