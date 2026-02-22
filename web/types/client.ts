import type { UserStatus } from "./user";

export interface ClientProfile {
  id: string;
  user_id: string;
  tenant_id: string;
  cpf_cnpj: string | null;
  phone: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_cep: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  tenant_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile: ClientProfile | null;
}

export interface ClientListItem {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  tenant_id: string | null;
  is_active: boolean;
  created_at: string;
  phone: string | null;
  cpf_cnpj: string | null;
  address_city: string | null;
}

export interface ClientListResponse {
  results: ClientListItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface ListClientsParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: UserStatus;
}

export interface ClientCreate {
  name: string;
  email: string;
  password: string;
  tenant_id: string;
  cpf_cnpj?: string;
  phone?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_cep?: string;
  notes?: string;
}

export interface ClientUpdate {
  name?: string;
  cpf_cnpj?: string;
  phone?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_cep?: string;
  notes?: string;
}
