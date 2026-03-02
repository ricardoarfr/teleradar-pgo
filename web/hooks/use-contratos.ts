import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { Contrato, ContratoCreate, ContratoUpdate, PagedContratos } from "@/types/contrato";

interface ListContratosParams {
  page?: number;
  per_page?: number;
  status?: string;
  [key: string]: unknown;
}

export function useContratos(params: ListContratosParams = {}) {
  return useQuery({
    queryKey: ["contratos", params],
    queryFn: () => apiGet<PagedContratos>("/modules/contracts", params),
  });
}

export function useContrato(id: string) {
  return useQuery({
    queryKey: ["contratos", id],
    queryFn: () => apiGet<Contrato>(`/modules/contracts/${id}`),
    enabled: !!id,
  });
}

export function useCreateContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ContratoCreate) => apiPost<Contrato>("/modules/contracts", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contratos"] });
    },
  });
}

export function useUpdateContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContratoUpdate }) =>
      apiPut<Contrato>(`/modules/contracts/${id}`, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["contratos"] });
      qc.invalidateQueries({ queryKey: ["contratos", id] });
    },
  });
}

export function useDeleteContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/modules/contracts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contratos"] });
    },
  });
}
