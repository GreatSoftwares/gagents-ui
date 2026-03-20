import { useQuery } from "@tanstack/react-query";
import type { GagentsHookConfig } from "./types";
import { useGagentsClient } from "./types";

export function useConversations(config: GagentsHookConfig) {
  const client = useGagentsClient(config);

  return useQuery({
    queryKey: ["greatagents", "conversations", config.accountId],
    queryFn: () => client.listConversations(config.accountId),
    enabled: !!config.token && !!config.accountId,
    select: (res) => ({ data: res.data || [], total: res.total || 0 }),
  });
}

export function useAgentConversations(config: GagentsHookConfig, idAgent: number) {
  const client = useGagentsClient(config);

  return useQuery({
    queryKey: ["greatagents", "conversations", config.accountId, "agent", idAgent],
    queryFn: () => client.listAgentConversations(config.accountId, idAgent),
    enabled: !!config.token && !!config.accountId && !!idAgent,
    select: (res) => ({ data: res.data || [], total: res.total || 0 }),
  });
}

export function useConversation(config: GagentsHookConfig, id: number) {
  const client = useGagentsClient(config);

  return useQuery({
    queryKey: ["greatagents", "conversations", config.accountId, id],
    queryFn: () => client.getConversation(config.accountId, id),
    enabled: !!config.token && !!config.accountId && !!id,
    select: (res) => {
      const d = res.data;
      return Array.isArray(d) ? d[0] : d;
    },
  });
}
