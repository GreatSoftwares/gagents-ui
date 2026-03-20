import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GagentsHookConfig } from "./types";
import { useGagentsClient } from "./types";

export function useObjectives(config: GagentsHookConfig, idAgent: number) {
  const client = useGagentsClient(config);

  return useQuery({
    queryKey: ["greatagents", "objectives", config.accountId, idAgent],
    queryFn: () => client.listObjectives(config.accountId, idAgent),
    enabled: !!config.token && !!config.accountId && !!idAgent,
    select: (res) => ({ data: res.data || [], total: res.total || 0 }),
  });
}

export function useCreateObjective(config: GagentsHookConfig) {
  const client = useGagentsClient(config);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      idAgent,
      body,
    }: {
      idAgent: number;
      body: {
        title: string;
        slug?: string;
        prompt?: string | null;
        order?: number;
        active?: boolean;
      };
    }) => client.createObjective(config.accountId, idAgent, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["greatagents", "objectives"] });
    },
  });
}

export function useUpdateObjective(config: GagentsHookConfig) {
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
        title: string;
        slug: string;
        prompt: string | null;
        order: number;
        active: boolean;
      }>;
    }) => client.updateObjective(config.accountId, idAgent, id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["greatagents", "objectives"] });
    },
  });
}

export function useDeleteObjective(config: GagentsHookConfig) {
  const client = useGagentsClient(config);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idAgent, id }: { idAgent: number; id: number }) =>
      client.deleteObjective(config.accountId, idAgent, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["greatagents", "objectives"] });
    },
  });
}
