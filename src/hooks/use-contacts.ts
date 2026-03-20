import { useQuery } from "@tanstack/react-query";
import type { GagentsHookConfig } from "./types";
import { useGagentsClient } from "./types";

export function useGagentsContacts(config: GagentsHookConfig, params?: Record<string, string>) {
  const client = useGagentsClient(config);

  return useQuery({
    queryKey: ["greatagents", "contacts", config.accountId, params],
    queryFn: () => client.listGagentsContacts(config.accountId, params),
    enabled: !!config.token && !!config.accountId,
    select: (res) => ({ data: res.data || [], total: res.total || 0 }),
  });
}
