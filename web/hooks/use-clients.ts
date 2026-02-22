import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  Client,
  ClientListResponse,
  ListClientsParams,
  ClientCreate,
  ClientUpdate,
} from "@/types/client";

export function useClients(params: ListClientsParams = {}) {
  return useQuery({
    queryKey: ["clients", params],
    queryFn: () =>
      apiGet<ClientListResponse>("/admin/clients/", params as Record<string, unknown>),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: () => apiGet<Client>(`/admin/clients/${id}`),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ClientCreate) => apiPost<Client>("/admin/clients/", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientUpdate }) =>
      apiPut<Client>(`/admin/clients/${id}`, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["clients", id] });
    },
  });
}

export function useBlockClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<Client>(`/admin/clients/${id}/block`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUnblockClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<Client>(`/admin/clients/${id}/unblock`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
