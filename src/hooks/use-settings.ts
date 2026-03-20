import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ToolCredential } from "../types";
import type { GagentsHookConfig } from "./types";
import { useGagentsClient } from "./types";

// --- Prompt Versions (read-only) ---

export function usePromptVersions(config: GagentsHookConfig, idAgent: number) {
  const client = useGagentsClient(config);

  return useQuery({
    queryKey: ["greatagents", "prompt-versions", config.accountId, idAgent],
    queryFn: () => client.listPromptVersions(config.accountId, idAgent),
    enabled: !!config.token && !!config.accountId && !!idAgent,
    select: (res) => ({ data: res.data || [], total: res.total || 0 }),
  });
}

// --- Tool Credentials (CRUD) ---

export function useToolCredentials(config: GagentsHookConfig) {
  const client = useGagentsClient(config);

  return useQuery({
    queryKey: ["greatagents", "tool-credentials", config.accountId],
    queryFn: () => client.listToolCredentials(config.accountId),
    enabled: !!config.token && !!config.accountId,
    select: (res) => ({ data: res.data || [], total: res.total || 0 }),
  });
}

export function useCreateToolCredential(config: GagentsHookConfig) {
  const client = useGagentsClient(config);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      body: Pick<ToolCredential, "id_tool" | "label" | "credentials_encrypted"> &
        Partial<Pick<ToolCredential, "expires_at">>,
    ) => client.createToolCredential(config.accountId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["greatagents", "tool-credentials"] });
    },
  });
}

export function useUpdateToolCredential(config: GagentsHookConfig) {
  const client = useGagentsClient(config);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: Partial<
        Pick<ToolCredential, "id_tool" | "label" | "credentials_encrypted" | "expires_at" | "status">
      >;
    }) => client.updateToolCredential(config.accountId, id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["greatagents", "tool-credentials"] });
    },
  });
}

export function useDeleteToolCredential(config: GagentsHookConfig) {
  const client = useGagentsClient(config);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => client.deleteToolCredential(config.accountId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["greatagents", "tool-credentials"] });
    },
  });
}

// --- Contact Users (read-only) ---

export function useContactUsers(config: GagentsHookConfig) {
  const client = useGagentsClient(config);

  return useQuery({
    queryKey: ["greatagents", "contact-users", config.accountId],
    queryFn: () => client.listContactUsers(config.accountId),
    enabled: !!config.token && !!config.accountId,
    select: (res) => ({ data: res.data || [], total: res.total || 0 }),
  });
}
