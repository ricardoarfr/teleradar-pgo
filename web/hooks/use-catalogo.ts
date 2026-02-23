import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type {
  Classe,
  Unidade,
  Servico,
  LPU,
  LPUItem,
  Material,
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
  MaterialCreate,
  MaterialUpdate,
} from "@/types/catalogo"; // Alterado para /types/catalogo

// ===========================================================================
// CLASSE
// ===========================================================================

interface ListClassesParams {
  page?: number;
  per_page?: number;
  ativa?: boolean;
  search?: string;
  [key: string]: unknown;
}

export function useClasses(params: ListClassesParams = {}) {
  return useQuery({
    queryKey: ["catalogo-classes", params], // Key ajustada
    queryFn: () => apiGet<PagedResponse<Classe>>("/modules/catalogo/lpu/classes", params), // Rota ajustada
  });
}

export function useClasse(id: string) {
  return useQuery({
    queryKey: ["catalogo-classes", id], // Key ajustada
    queryFn: () => apiGet<Classe>(`/modules/catalogo/lpu/classes/${id}`), // Rota ajustada
    enabled: !!id,
  });
}

export function useCreateClasse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ClasseCreate) => apiPost<Classe>("/modules/catalogo/lpu/classes", data), // Rota ajustada
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalogo-classes"] }); // Key ajustada
    },
  });
}

export function useUpdateClasse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClasseUpdate }) =>
      apiPut<Classe>(`/modules/catalogo/lpu/classes/${id}`, data), // Rota ajustada
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["catalogo-classes"] }); // Key ajustada
      qc.invalidateQueries({ queryKey: ["catalogo-classes", id] }); // Key ajustada
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
  [key: string]: unknown;
}

export function useUnidades(params: ListUnidadesParams = {}) {
  return useQuery({
    queryKey: ["catalogo-unidades", params], // Key ajustada
    queryFn: () => apiGet<PagedResponse<Unidade>>("/modules/catalogo/lpu/unidades", params), // Rota ajustada
  });
}

export function useUnidade(id: string) {
  return useQuery({
    queryKey: ["catalogo-unidades", id], // Key ajustada
    queryFn: () => apiGet<Unidade>(`/modules/catalogo/lpu/unidades/${id}`), // Rota ajustada
    enabled: !!id,
  });
}

export function useCreateUnidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UnidadeCreate) => apiPost<Unidade>("/modules/catalogo/lpu/unidades", data), // Rota ajustada
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalogo-unidades"] }); // Key ajustada
    },
  });
}

export function useUpdateUnidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UnidadeUpdate }) =>
      apiPut<Unidade>(`/modules/catalogo/lpu/unidades/${id}`, data), // Rota ajustada
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["catalogo-unidades"] }); // Key ajustada
      qc.invalidateQueries({ queryKey: ["catalogo-unidades", id] }); // Key ajustada
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
  [key: string]: unknown;
}

export function useServicos(params: ListServicosParams = {}) {
  return useQuery({
    queryKey: ["catalogo-servicos", params], // Key ajustada
    queryFn: () => apiGet<PagedResponse<Servico>>("/modules/catalogo/lpu/servicos", params), // Rota ajustada
  });
}

export function useServico(id: string) {
  return useQuery({
    queryKey: ["catalogo-servicos", id], // Key ajustada
    queryFn: () => apiGet<Servico>(`/modules/catalogo/lpu/servicos/${id}`), // Rota ajustada
    enabled: !!id,
  });
}

export function useCreateServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ServicoCreate) => apiPost<Servico>("/modules/catalogo/lpu/servicos", data), // Rota ajustada
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalogo-servicos"] }); // Key ajustada
    },
  });
}

export function useUpdateServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServicoUpdate }) =>
      apiPut<Servico>(`/modules/catalogo/lpu/servicos/${id}`, data), // Rota ajustada
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["catalogo-servicos"] }); // Key ajustada
      qc.invalidateQueries({ queryKey: ["catalogo-servicos", id] }); // Key ajustada
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
  [key: string]: unknown;
}

export function useLPUs(params: ListLPUsParams = {}) {
  return useQuery({
    queryKey: ["catalogo-lpus", params], // Key ajustada
    queryFn: () => apiGet<PagedResponse<LPU>>("/modules/catalogo/lpu/lpus", params), // Rota ajustada
  });
}

export function useLPU(id: string) {
  return useQuery({
    queryKey: ["catalogo-lpus", id], // Key ajustada
    queryFn: () => apiGet<LPU>(`/modules/catalogo/lpu/lpus/${id}`), // Rota ajustada
    enabled: !!id,
  });
}

export function useCreateLPU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LPUCreate) => apiPost<LPU>("/modules/catalogo/lpu/lpus", data), // Rota ajustada
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalogo-lpus"] }); // Key ajustada
    },
  });
}

export function useUpdateLPU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LPUUpdate }) =>
      apiPut<LPU>(`/modules/catalogo/lpu/lpus/${id}`, data), // Rota ajustada
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["catalogo-lpus"] }); // Key ajustada
      qc.invalidateQueries({ queryKey: ["catalogo-lpus", id] }); // Key ajustada
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
  [key: string]: unknown;
}

export function useLPUItems(lpuId: string, params: ListLPUItemsParams = {}) {
  return useQuery({
    queryKey: ["catalogo-lpus", lpuId, "items", params], // Key ajustada
    queryFn: () => apiGet<PagedResponse<LPUItem>>(`/modules/catalogo/lpu/lpus/${lpuId}/itens`, params), // Rota ajustada
    enabled: !!lpuId,
  });
}

export function useLPUItem(lpuId: string, itemId: string) {
  return useQuery({
    queryKey: ["catalogo-lpus", lpuId, "items", itemId], // Key ajustada
    queryFn: () => apiGet<LPUItem>(`/modules/catalogo/lpu/lpus/${lpuId}/itens/${itemId}`), // Rota ajustada
    enabled: !!lpuId && !!itemId,
  });
}

export function useAddLPUItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lpuId, data }: { lpuId: string; data: LPUItemCreate }) =>
      apiPost<LPUItem>(`/modules/catalogo/lpu/lpus/${lpuId}/itens`, data), // Rota ajustada
    onSuccess: (_data, { lpuId }) => {
      qc.invalidateQueries({ queryKey: ["catalogo-lpus", lpuId, "items"] }); // Key ajustada
    },
  });
}

export function useUpdateLPUItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lpuId, itemId, data }: { lpuId: string; itemId: string; data: LPUItemUpdate }) =>
      apiPut<LPUItem>(`/modules/catalogo/lpu/lpus/${lpuId}/itens/${itemId}`, data), // Rota ajustada
    onSuccess: (_data, { lpuId, itemId }) => {
      qc.invalidateQueries({ queryKey: ["catalogo-lpus", lpuId, "items"] }); // Key ajustada
      qc.invalidateQueries({ queryKey: ["catalogo-lpus", lpuId, "items", itemId] }); // Key ajustada
    },
  });
}

export function useRemoveLPUItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lpuId, itemId }: { lpuId: string; itemId: string }) =>
      apiDelete(`/modules/catalogo/lpu/lpus/${lpuId}/itens/${itemId}`), // Rota ajustada
    onSuccess: (_data, { lpuId }) => {
      qc.invalidateQueries({ queryKey: ["catalogo-lpus", lpuId, "items"] }); // Key ajustada
    },
  });
}

// ===========================================================================
// MATERIAL
// ===========================================================================

interface ListMateriaisParams {
  page?: number;
  per_page?: number;
  ativo?: boolean;
  unidade_id?: string;
  search?: string;
  [key: string]: unknown;
}

export function useMateriais(params: ListMateriaisParams = {}) {
  return useQuery({
    queryKey: ["catalogo-materiais", params],
    queryFn: () => apiGet<PagedResponse<Material>>("/modules/catalogo/materiais", params),
  });
}

export function useMaterial(id: string) {
  return useQuery({
    queryKey: ["catalogo-materiais", id],
    queryFn: () => apiGet<Material>(`/modules/catalogo/materiais/${id}`),
    enabled: !!id,
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MaterialCreate) => apiPost<Material>("/modules/catalogo/materiais", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalogo-materiais"] });
    },
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MaterialUpdate }) =>
      apiPut<Material>(`/modules/catalogo/materiais/${id}`, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["catalogo-materiais"] });
      qc.invalidateQueries({ queryKey: ["catalogo-materiais", id] });
    },
  });
}
