import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  User,
  UserListResponse,
  ListUsersParams,
  ConfirmApprovalRequest,
  ChangeRoleRequest,
  BlockRequest,
  ChangePasswordRequest,
  ChangeTenantRequest,
} from "@/types/user";

export function useUsers(params: ListUsersParams = {}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () =>
      apiGet<UserListResponse>("/admin/users", params as Record<string, unknown>),
  });
}

export function usePendingUsers() {
  return useQuery({
    queryKey: ["users", "pending"],
    queryFn: () => apiGet<User[]>("/admin/users/pending"),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => apiGet<User>(`/admin/users/${id}`),
    enabled: !!id,
  });
}

export function useApproveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiPost<{ message: string }>(`/admin/users/${userId}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useConfirmApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ConfirmApprovalRequest) =>
      apiPost<User>("/admin/users/confirm-approval", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: BlockRequest }) =>
      apiPost<User>(`/admin/users/${userId}/block`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiPost<User>(`/admin/users/${userId}/unblock`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useChangeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: ChangeRoleRequest }) =>
      apiPut<User>(`/admin/users/${userId}/role`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useChangeUserPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: ChangePasswordRequest }) =>
      apiPut<User>(`/admin/users/${userId}/password`, data),
    onSuccess: (_data, { userId }) => {
      qc.invalidateQueries({ queryKey: ["users", userId] });
    },
  });
}

export function useChangeUserTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: ChangeTenantRequest }) =>
      apiPut<User>(`/admin/users/${userId}/tenant`, data),
    onSuccess: (_data, { userId }) => {
      qc.invalidateQueries({ queryKey: ["users", userId] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
