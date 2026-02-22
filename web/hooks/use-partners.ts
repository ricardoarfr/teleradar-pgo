import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  Partner,
  PartnerListResponse,
  ListPartnersParams,
  PartnerCreate,
  PartnerUpdate,
} from "@/types/partner";

export function usePartners(params: ListPartnersParams = {}) {
  return useQuery({
    queryKey: ["partners", params],
    queryFn: () =>
      apiGet<PartnerListResponse>("/admin/partners/", params as Record<string, unknown>),
  });
}

export function usePartner(id: string) {
  return useQuery({
    queryKey: ["partners", id],
    queryFn: () => apiGet<Partner>(`/admin/partners/${id}`),
    enabled: !!id,
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PartnerCreate) => apiPost<Partner>("/admin/partners/", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
    },
  });
}

export function useUpdatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PartnerUpdate }) =>
      apiPut<Partner>(`/admin/partners/${id}`, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["partners", id] });
    },
  });
}

export function useBlockPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<Partner>(`/admin/partners/${id}/block`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
    },
  });
}

export function useUnblockPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<Partner>(`/admin/partners/${id}/unblock`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
    },
  });
}
