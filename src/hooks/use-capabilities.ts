import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GagentsHookConfig } from "./types";
import { useGagentsClient } from "./types";
import type { CapabilitiesResponse, AgentCapability, AgentCapabilitiesPayload } from "../types/capabilities";

export function useCapabilities(config: GagentsHookConfig) {
  const client = useGagentsClient(config);

  return useQuery({
    queryKey: ["greatagents", "capabilities", config.accountId],
    queryFn: async (): Promise<CapabilitiesResponse> => {
      const res = await client.getCapabilities(config.accountId);
      return (res.data as unknown as CapabilitiesResponse) ?? { product: null, categories: [] };
    },
    enabled: !!config.token && !!config.accountId,
  });
}

export function useAgentCapabilities(config: GagentsHookConfig, agentId: number | null) {
  const client = useGagentsClient(config);

  return useQuery({
    queryKey: ["greatagents", "agent-capabilities", config.accountId, agentId],
    queryFn: async (): Promise<AgentCapability[]> => {
      const res = await client.getAgentCapabilities(config.accountId, agentId!);
      const d = res.data;
      return (Array.isArray(d) ? d : []) as AgentCapability[];
    },
    enabled: !!config.token && !!config.accountId && !!agentId,
  });
}

export function useUpdateAgentCapabilities(config: GagentsHookConfig) {
  const client = useGagentsClient(config);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agentId, payload }: { agentId: number; payload: AgentCapabilitiesPayload }) =>
      client.updateAgentCapabilities(config.accountId, agentId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["greatagents", "agent-capabilities", config.accountId, variables.agentId],
      });
      // Also invalidate agent-tools since capabilities map to tools
      queryClient.invalidateQueries({
        queryKey: ["greatagents", "agent-tools"],
      });
    },
  });
}
