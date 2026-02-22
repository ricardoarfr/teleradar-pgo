export type TenantStatus = "ACTIVE" | "INACTIVE";

export interface Tenant {
  id: string;
  name: string;
  status: TenantStatus;
  created_at: string;
  updated_at: string;
}

export interface TenantListResponse {
  results: Tenant[];
  total: number;
  page: number;
  per_page: number;
}
