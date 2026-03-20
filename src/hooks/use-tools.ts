import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GagentsHookConfig } from "./types";
import { useGagentsClient } from "./types";

export function useTools(config: GagentsHookConfig, params?: Record<string, string>) {
  const client = useGagentsClient(config);

  return useQuery({
    queryKey: ["greatagents", "tools", config.accountId, params],
    queryFn: () => client.listTools(config.accountId, params),
    enabled: !!config.token && !!config.accountId,
    select: (res) => ({ data: res.data || [], total: res.total || 0 }),
  });
}

export function useTool(config: GagentsHookConfig, id: number | null) {
  const client = useGagentsClient(config);

  return useQuery({
    queryKey: ["greatagents", "tool", config.accountId, id],
    queryFn: () => client.getTool(config.accountId, id!),
    enabled: !!config.token && !!config.accountId && !!id,
    select: (res) => {
      const d = res.data;
      return Array.isArray(d) ? d[0] : d;
    },
  });
}

export function useCreateTool(config: GagentsHookConfig) {
  const client = useGagentsClient(config);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: {
      name: string;
      slug: string;
      type: string;
      description?: string;
      function_definitions?: string;
    }) => client.createTool(config.accountId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["greatagents", "tools"] });
    },
  });
}

export function useUpdateTool(config: GagentsHookConfig) {
  const client = useGagentsClient(config);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: {
        name?: string;
        type?: string;
        description?: string;
        function_definitions?: string;
      };
    }) => client.updateTool(config.accountId, id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["greatagents", "tools"] });
      queryClient.invalidateQueries({
        queryKey: ["greatagents", "tool", config.accountId, variables.id],
      });
    },
  });
}

export function useDeleteTool(config: GagentsHookConfig) {
  const client = useGagentsClient(config);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => client.deleteTool(config.accountId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["greatagents", "tools"] });
    },
  });
}
