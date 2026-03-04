import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, api } from "@/lib/api";
import type {
  ProduttivoConfig,
  ProduttivoForm,
  ProduttivoLocal,
  ProduttivoUser,
  ProduttivoWork,
  RelAtividadesResult,
  RelUsuarioResult,
} from "@/types/produttivo";

const PREFIX = "/modules/produttivo";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export function useProduttivoConfig() {
  return useQuery({
    queryKey: ["produttivo-config"],
    queryFn: () => apiGet<ProduttivoConfig>(`${PREFIX}/config`),
  });
}

export function useSaveCookie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cookie: string) => apiPost(`${PREFIX}/config/cookie`, { cookie }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["produttivo-config"] }),
  });
}

export function useSaveAccountId() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (account_id: string) => apiPost(`${PREFIX}/config/account`, { account_id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["produttivo-config"] }),
  });
}

export function useValidateCookie() {
  return useMutation({
    mutationFn: () => apiPost<{ valid: boolean }>(`${PREFIX}/config/validate`, {}),
  });
}

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

export function useProduttivoUsuarios() {
  return useQuery({
    queryKey: ["produttivo-usuarios"],
    queryFn: () => apiGet<ProduttivoUser[]>(`${PREFIX}/usuarios`),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

export function useProduttivoFormularios() {
  return useQuery({
    queryKey: ["produttivo-formularios"],
    queryFn: () => apiGet<ProduttivoForm[]>(`${PREFIX}/formularios`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduttivoWorks(formIds: number[]) {
  return useQuery({
    queryKey: ["produttivo-works", formIds],
    queryFn: () =>
      apiGet<ProduttivoWork[]>(`${PREFIX}/works`, { form_ids: formIds.join(",") }),
    enabled: formIds.length === 1,
  });
}

export function useProduttivoLocais(search?: string) {
  return useQuery({
    queryKey: ["produttivo-locais", search],
    queryFn: () => apiGet<ProduttivoLocal[]>(`${PREFIX}/locais`, search ? { search } : {}),
    staleTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

interface RelAtividadesParams {
  data_inicio: string;
  data_fim: string;
}

export function useRelatorioAtividades(params: RelAtividadesParams | null) {
  return useQuery({
    queryKey: ["produttivo-rel-atividades", params],
    queryFn: () =>
      apiGet<RelAtividadesResult>(`${PREFIX}/relatorio/atividades`, params as Record<string, unknown>),
    enabled: !!params,
  });
}

interface RelUsuarioParams {
  data_inicio: string;
  data_fim: string;
  user_ids?: string;
  form_ids?: string;
  resource_place_ids?: string;
  work_ids?: string;
}

export function useRelatorioUsuario(params: RelUsuarioParams | null) {
  return useQuery({
    queryKey: ["produttivo-rel-usuario", params],
    queryFn: () =>
      apiGet<RelUsuarioResult>(`${PREFIX}/relatorio/usuario`, params as Record<string, unknown>),
    enabled: !!params,
  });
}

// ---------------------------------------------------------------------------
// Excel downloads (direct URL with auth header handled via axios)
// ---------------------------------------------------------------------------

export function buildExcelUrl(
  report: "atividades" | "usuario",
  params: Record<string, string>
): string {
  const qs = new URLSearchParams(params).toString();
  return `/modules/produttivo/relatorio/${report}/excel?${qs}`;
}
