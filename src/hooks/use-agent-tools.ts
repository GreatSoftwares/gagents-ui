import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GagentsHookConfig } from "./types";
import { useGagentsClient } from "./types";

export function useAgentTools(config: GagentsHookConfig, idAgent: number) {
  const client = useGagentsClient(config);

  return useQuery({
    queryKey: ["greatagents", "agent-tools", config.accountId, idAgent],
    queryFn: () => client.listAgentTools(config.accountId, idAgent),
    enabled: !!config.token && !!config.accountId && !!idAgent,
    select: (res) => ({ data: res.data || [], total: res.total || 0 }),
  });
}

export function useAddAgentTool(config: GagentsHookConfig) {
  const client = useGagentsClient(config);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      idAgent,
      body,
    }: {
      idAgent: number;
      body: { id_tool: number; enabled?: boolean };
    }) => client.addAgentTool(config.accountId, idAgent, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["greatagents", "agent-tools"] });
    },
  });
}

export function useRemoveAgentTool(config: GagentsHookConfig) {
  const client = useGagentsClient(config);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idAgent, id }: { idAgent: number; id: number }) =>
      client.removeAgentTool(config.accountId, idAgent, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["greatagents", "agent-tools"] });
    },
  });
}

export function useUpdateAgentTool(config: GagentsHookConfig) {
  const client = useGagentsClient(config);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      idAgent,
      id,
      body,
    }: {
      idAgent: number;
      id: number;
      body: Partial<{
        enabled: boolean;
        custom_instructions: string | null;
        parameter_mappings: string | null;
        id_tool_credential: number | null;
      }>;
    }) => client.updateAgentTool(config.accountId, idAgent, id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["greatagents", "agent-tools", config.accountId, variables.idAgent],
      });
    },
  });
}
