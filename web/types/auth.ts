export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface TokenPayload {
  sub: string;
  type: "access" | "refresh";
  exp: number;
  iat: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  tenant_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type UserRole = "MASTER" | "ADMIN" | "MANAGER" | "STAFF" | "PARTNER";
export type UserStatus = "PENDING" | "APPROVED" | "BLOCKED";
