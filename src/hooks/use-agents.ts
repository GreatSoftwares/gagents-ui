import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GagentsHookConfig } from "./types";
import { useGagentsClient } from "./types";

export function useAgents(config: GagentsHookConfig, params?: Record<string, string>) {
  const client = useGagentsClient(config);

  return useQuery({
    queryKey: ["greatagents", "agents", config.accountId, params],
    queryFn: () => client.listAgents(config.accountId, params),
    enabled: !!config.token && !!config.accountId,
    select: (res) => ({ data: res.data || [], total: res.total || 0 }),
  });
}

export function useAgent(config: GagentsHookConfig, id: number | null) {
  const client = useGagentsClient(config);

  return useQuery({
    queryKey: ["greatagents", "agent", config.accountId, id],
    queryFn: () => client.getAgent(config.accountId, id!),
    enabled: !!config.token && !!config.accountId && !!id,
    select: (res) => {
      const d = res.data;
      return Array.isArray(d) ? d[0] : d;
    },
  });
}

export function useCreateAgent(config: GagentsHookConfig) {
  const client = useGagentsClient(config);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: {
      title: string;
      prompt?: string;
      photo?: string;
      delay_typing?: number;
      waiting_time?: number;
    }) => client.createAgent(config.accountId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["greatagents", "agents"] });
    },
  });
}

export function useUpdateAgent(config: GagentsHookConfig) {
  const client = useGagentsClient(config);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: {
        title?: string;
        prompt?: string;
        photo?: string;
        delay_typing?: number;
        waiting_time?: number;
        active?: boolean;
      };
    }) => client.updateAgent(config.accountId, id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["greatagents", "agents"] });
      queryClient.invalidateQueries({
        queryKey: ["greatagents", "agent", config.accountId, variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["greatagents", "prompt-versions", config.accountId, variables.id],
      });
    },
  });
}

export function useDeleteAgent(config: GagentsHookConfig) {
  const client = useGagentsClient(config);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => client.deleteAgent(config.accountId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["greatagents", "agents"] });
    },
  });
}
