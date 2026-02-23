import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type {
  Classe,
  Unidade,
  Servico,
  LPU,
  LPUItem,
  PagedResponse,
  ClasseCreate,
  ClasseUpdate,
  UnidadeCreate,
  UnidadeUpdate,
  ServicoCreate,
  ServicoUpdate,
  LPUCreate,
  LPUUpdate,
  LPUItemCreate,
  LPUItemUpdate,
} from "@/types/lpu";

// ===========================================================================
// CLASSE
// ===========================================================================

interface ListClassesParams {
  page?: number;
  per_page?: number;
  ativa?: boolean;
  search?: string;
  [key: string]: unknown; // Add index signature
}

export function useClasses(params: ListClassesParams = {}) {
  return useQuery({
    queryKey: ["classes", params],
    queryFn: () => apiGet<PagedResponse<Classe>>("/modules/lpu/classes", params),
  });
}

export function useClasse(id: string) {
  return useQuery({
    queryKey: ["classes", id],
    queryFn: () => apiGet<Classe>(`/modules/lpu/classes/${id}`),
    enabled: !!id,
  });
}

export function useCreateClasse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ClasseCreate) => apiPost<Classe>("/modules/lpu/classes", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useUpdateClasse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClasseUpdate }) =>
      apiPut<Classe>(`/modules/lpu/classes/${id}`, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["classes", id] });
    },
  });
}

// ===========================================================================
// UNIDADE
// ===========================================================================

interface ListUnidadesParams {
  page?: number;
  per_page?: number;
  ativa?: boolean;
  search?: string;
  [key: string]: unknown; // Add index signature
}

export function useUnidades(params: ListUnidadesParams = {}) {
  return useQuery({
    queryKey: ["unidades", params],
    queryFn: () => apiGet<PagedResponse<Unidade>>("/modules/lpu/unidades", params),
  });
}

export function useUnidade(id: string) {
  return useQuery({
    queryKey: ["unidades", id],
    queryFn: () => apiGet<Unidade>(`/modules/lpu/unidades/${id}`),
    enabled: !!id,
  });
}

export function useCreateUnidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UnidadeCreate) => apiPost<Unidade>("/modules/lpu/unidades", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unidades"] });
    },
  });
}

export function useUpdateUnidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UnidadeUpdate }) =>
      apiPut<Unidade>(`/modules/lpu/unidades/${id}`, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["unidades"] });
      qc.invalidateQueries({ queryKey: ["unidades", id] });
    },
  });
}

// ===========================================================================
// SERVICO
// ===========================================================================

interface ListServicosParams {
  page?: number;
  per_page?: number;
  ativo?: boolean;
  classe_id?: string;
  unidade_id?: string;
  search?: string;
  [key: string]: unknown; // Add index signature
}

export function useServicos(params: ListServicosParams = {}) {
  return useQuery({
    queryKey: ["servicos", params],
    queryFn: () => apiGet<PagedResponse<Servico>>("/modules/lpu/servicos", params),
  });
}

export function useServico(id: string) {
  return useQuery({
    queryKey: ["servicos", id],
    queryFn: () => apiGet<Servico>(`/modules/lpu/servicos/${id}`),
    enabled: !!id,
  });
}

export function useCreateServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ServicoCreate) => apiPost<Servico>("/modules/lpu/servicos", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos"] });
    },
  });
}

export function useUpdateServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServicoUpdate }) =>
      apiPut<Servico>(`/modules/lpu/servicos/${id}`, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["servicos"] });
      qc.invalidateQueries({ queryKey: ["servicos", id] });
    },
  });
}

// ===========================================================================
// LPU
// ===========================================================================

interface ListLPUsParams {
  page?: number;
  per_page?: number;
  parceiro_id?: string;
  ativa?: boolean;
  search?: string;
  [key: string]: unknown; // Add index signature
}

export function useLPUs(params: ListLPUsParams = {}) {
  return useQuery({
    queryKey: ["lpus", params],
    queryFn: () => apiGet<PagedResponse<LPU>>("/modules/lpu/lpus", params),
  });
}

export function useLPU(id: string) {
  return useQuery({
    queryKey: ["lpus", id],
    queryFn: () => apiGet<LPU>(`/modules/lpu/lpus/${id}`),
    enabled: !!id,
  });
}

export function useCreateLPU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LPUCreate) => apiPost<LPU>("/modules/lpu/lpus", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lpus"] });
    },
  });
}

export function useUpdateLPU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LPUUpdate }) =>
      apiPut<LPU>(`/modules/lpu/lpus/${id}`, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["lpus"] });
      qc.invalidateQueries({ queryKey: ["lpus", id] });
    },
  });
}

// ===========================================================================
// LPU ITEM
// ===========================================================================

interface ListLPUItemsParams {
  page?: number;
  per_page?: number;
  search?: string;
  [key: string]: unknown; // Add index signature
}

export function useLPUItems(lpuId: string, params: ListLPUItemsParams = {}) {
  return useQuery({
    queryKey: ["lpus", lpuId, "items", params],
    queryFn: () => apiGet<PagedResponse<LPUItem>>(`/modules/lpu/lpus/${lpuId}/itens`, params),
    enabled: !!lpuId,
  });
}

export function useLPUItem(lpuId: string, itemId: string) {
  return useQuery({
    queryKey: ["lpus", lpuId, "items", itemId],
    queryFn: () => apiGet<LPUItem>(`/modules/lpu/lpus/${lpuId}/itens/${itemId}`),
    enabled: !!lpuId && !!itemId,
  });
}

export function useAddLPUItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lpuId, data }: { lpuId: string; data: LPUItemCreate }) =>
      apiPost<LPUItem>(`/modules/lpu/lpus/${lpuId}/itens`, data),
    onSuccess: (_data, { lpuId }) => {
      qc.invalidateQueries({ queryKey: ["lpus", lpuId, "items"] });
    },
  });
}

export function useUpdateLPUItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lpuId, itemId, data }: { lpuId: string; itemId: string; data: LPUItemUpdate }) =>
      apiPut<LPUItem>(`/modules/lpu/lpus/${lpuId}/itens/${itemId}`, data),
    onSuccess: (_data, { lpuId, itemId }) => {
      qc.invalidateQueries({ queryKey: ["lpus", lpuId, "items"] });
      qc.invalidateQueries({ queryKey: ["lpus", lpuId, "items", itemId] });
    },
  });
}

export function useRemoveLPUItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lpuId, itemId }: { lpuId: string; itemId: string }) =>
      apiDelete(`/modules/lpu/lpus/${lpuId}/itens/${itemId}`),
    onSuccess: (_data, { lpuId }) => {
      qc.invalidateQueries({ queryKey: ["lpus", lpuId, "items"] });
    },
  });
}
