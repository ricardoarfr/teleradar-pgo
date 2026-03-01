import type { UserStatus } from "./user";

export interface PartnerProfile {
  id: string;
  user_id: string;
  tenant_id: string;
  person_type: string | null;
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

export interface Partner {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  tenant_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile: PartnerProfile | null;
}

export interface PartnerListItem {
  id: string;
  profile_id: string | null;
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

export interface PartnerListResponse {
  results: PartnerListItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface ListPartnersParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: UserStatus;
}

export interface PartnerCreate {
  name: string;
  email: string;
  password: string;
  tenant_id: string;
  person_type?: string;
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

export interface PartnerUpdate {
  name?: string;
  person_type?: string;
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
