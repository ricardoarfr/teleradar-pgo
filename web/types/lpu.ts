export interface Classe {
  id: string;
  nome: string;
  descricao: string | null;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClasseCreate {
  nome: string;
  descricao?: string;
  ativa?: boolean;
}

export interface ClasseUpdate {
  nome?: string;
  descricao?: string;
  ativa?: boolean;
}

export interface Unidade {
  id: string;
  nome: string;
  sigla: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnidadeCreate {
  nome: string;
  sigla: string;
  ativa?: boolean;
}

export interface UnidadeUpdate {
  nome?: string;
  sigla?: string;
  ativa?: boolean;
}

export interface Servico {
  id: string;
  codigo: string;
  atividade: string;
  classe_id: string;
  unidade_id: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  classe?: Classe; // Populated via query parameter
  unidade?: Unidade; // Populated via query parameter
}

export interface ServicoCreate {
  codigo: string;
  atividade: string;
  classe_id: string;
  unidade_id: string;
  ativo?: boolean;
}

export interface ServicoUpdate {
  codigo?: string;
  atividade?: string;
  classe_id?: string;
  unidade_id?: string;
  ativo?: boolean;
}

export interface LPU {
  id: string;
  nome: string;
  parceiro_id: string;
  tenant_id: string;
  ativa: boolean;
  data_inicio: string | null;
  data_fim: string | null;
  created_at: string;
  updated_at: string;
}

export interface LPUCreate {
  nome: string;
  parceiro_id: string;
  ativa?: boolean;
  data_inicio?: string;
  data_fim?: string;
}

export interface LPUUpdate {
  nome?: string;
  parceiro_id?: string;
  ativa?: boolean;
  data_inicio?: string;
  data_fim?: string;
}

export interface LPUItem {
  id: string;
  lpu_id: string;
  servico_id: string;
  valor_unitario: number;
  valor_classe: number | null;
  created_at: string;
  updated_at: string;
  servico?: Servico; // Populated via query parameter
}

export interface LPUItemCreate {
  servico_id: string;
  valor_unitario: number;
  valor_classe?: number;
}

export interface LPUItemUpdate {
  valor_unitario?: number;
  valor_classe?: number;
}

export interface PagedResponse<T> {
  results: T[];
  total: number;
  page: number;
  per_page: number;
}
