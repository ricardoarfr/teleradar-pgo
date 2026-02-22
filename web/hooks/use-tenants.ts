import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { TenantListResponse } from "@/types/tenant";

export function useListTenants() {
  return useQuery({
    queryKey: ["tenants"],
    queryFn: () => apiGet<TenantListResponse>("/tenants/", { per_page: 100 }),
  });
}
