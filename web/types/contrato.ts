export type ContractStatus = "ACTIVE" | "SUSPENDED" | "CANCELLED";

export interface ServicoInfo {
  id: string;
  codigo: string;
  atividade: string;
}

export interface LogEntry {
  id: string;
  user_id: string | null;
  acao: string;
  descricao: string | null;
  created_at: string;
}

export interface Contrato {
  id: string;
  tenant_id: string;
  numero: number | null;
  client_id: string | null;
  estado: string | null;
  cidade: string | null;
  status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  servicos: ServicoInfo[];
  logs: LogEntry[];
}

export interface ContratoCreate {
  client_id?: string;
  estado?: string;
  cidade?: string;
  servico_ids: string[];
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface ContratoUpdate {
  client_id?: string;
  estado?: string;
  cidade?: string;
  servico_ids?: string[];
  status?: ContractStatus;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface PagedContratos {
  results: Contrato[];
  total: number;
  page: number;
  per_page: number;
}
