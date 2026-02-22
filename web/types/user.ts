export type UserRole = "MASTER" | "ADMIN" | "MANAGER" | "STAFF" | "PARTNER";
export type UserStatus = "PENDING" | "APPROVED" | "BLOCKED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  tenant_id: string | null;
  is_active: boolean;
  login_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  results: User[];
  total: number;
  page: number;
  per_page: number;
}

export interface ListUsersParams {
  role?: UserRole;
  user_status?: UserStatus;
  page?: number;
  per_page?: number;
}

export interface ConfirmApprovalRequest {
  user_id: string;
  code: string;
}

export interface ChangeRoleRequest {
  role: UserRole;
}

export interface BlockRequest {
  reason?: string;
}

export interface ChangePasswordRequest {
  new_password: string;
}

export interface ChangeTenantRequest {
  tenant_id: string | null;
}
