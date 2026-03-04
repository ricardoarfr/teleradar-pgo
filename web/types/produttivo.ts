export interface ProduttivoConfig {
  has_cookie: boolean;
  account_id: string;
  cookie_updated_at: string | null;
  produttivo_email: string | null;
}

export interface ProduttivoUser {
  id: number;
  nome: string;
  status: string;
}

export interface ProduttivoForm {
  id: number;
  nome: string;
  status: string;
}

export interface ProduttivoWork {
  id: number;
  titulo: string;
  numero: number | null;
  status: string;
}

export interface ProduttivoLocal {
  id: number;
  nome: string;
}

// --- Report 1 ---
export interface RelAtividadesFormRow {
  form_name: string;
  total: number;
}

export interface RelAtividadesUsuarioRow {
  user_name: string;
  total: number;
  [form: string]: string | number;
}

export interface RelAtividadesResult {
  periodo: { inicio: string; fim: string };
  total_fills: number;
  por_formulario: RelAtividadesFormRow[];
  por_usuario: RelAtividadesUsuarioRow[];
  cruzamento: {
    forms: string[];
    rows: { user_name: string; values: number[] }[];
  };
  forms_names: string[];
}

// --- Report 2 ---
export interface RelUsuarioRow {
  [key: string]: string | number;
}

export interface RelUsuarioResult {
  periodo: { inicio: string; fim: string };
  total: number;
  colunas: string[];
  linhas: RelUsuarioRow[];
  colunas_especificas: string[];
}
