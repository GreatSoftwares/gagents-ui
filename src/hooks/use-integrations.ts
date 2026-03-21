import { useMemo } from "react";
import type { GagentsHookConfig } from "./types";
import { useToolCredentials } from "./use-settings";
import { useAgentTools } from "./use-agent-tools";
import { useTools } from "./use-tools";
import {
  INTEGRATIONS_REGISTRY,
  type IntegrationDefinition,
} from "../data/integrations-registry";
import type { AgentTool, Tool, ToolCredential } from "../types";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type IntegrationCardState =
  | "available"
  | "connected"
  | "expired"
  | "coming_soon";

export interface IntegrationCardData {
  /** Static definition from registry */
  definition: IntegrationDefinition;
  /** Resolved visual state */
  state: IntegrationCardState;
  /** Matching credential if one exists */
  credential: ToolCredential | null;
  /** Matching tool record if one exists */
  tool: Tool | null;
  /** How many agents share this credential */
  sharedByAgentsCount: number;
  /** Whether this agent has a linked agent_tool for this integration */
  linkedToAgent: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Cross-references the static integrations registry with live data
 * (tools, tool_credentials, agent_tools) to produce card state for each
 * integration entry.
 */
export function useIntegrationState(
  config: GagentsHookConfig,
  agentId: number | null,
) {
  const { data: credentialsData, isLoading: loadingCredentials } =
    useToolCredentials(config);
  const { data: toolsData, isLoading: loadingTools } = useTools(config);
  const { data: agentToolsData, isLoading: loadingAgentTools } = useAgentTools(
    config,
    agentId ?? 0,
  );

  const isLoading = loadingCredentials || loadingTools || loadingAgentTools;

  const cards: IntegrationCardData[] = useMemo(() => {
    const credentials: ToolCredential[] = credentialsData?.data ?? [];
    const tools: Tool[] = toolsData?.data ?? [];
    const agentTools: AgentTool[] = agentToolsData?.data ?? [];

    return INTEGRATIONS_REGISTRY.map((def) => {
      // coming_soon short-circuit
      if (def.status === "coming_soon") {
        return {
          definition: def,
          state: "coming_soon" as const,
          credential: null,
          tool: null,
          sharedByAgentsCount: 0,
          linkedToAgent: false,
        };
      }

      // Find tool record matching registry slug
      const matchedTool = tools.find((t) => t.slug === def.slug) ?? null;

      // Find credential for that tool
      const matchedCredential = matchedTool
        ? credentials.find((c) => c.id_tool === matchedTool.id) ?? null
        : null;

      // Check if this agent has a linked agent_tool for this tool
      const linkedToAgent = matchedTool
        ? agentTools.some((at) => at.id_tool === matchedTool.id)
        : false;

      // Sharing indicator: credential exists at account level (available to all agents)
      // When a credential is account-scoped, any agent can use it — show as "shared"
      const sharedByAgentsCount = matchedCredential ? 1 : 0;

      // Determine state
      let state: IntegrationCardState = "available";
      if (matchedCredential) {
        state =
          matchedCredential.status === "expired" ? "expired" : "connected";
      }

      return {
        definition: def,
        state,
        credential: matchedCredential,
        tool: matchedTool,
        sharedByAgentsCount,
        linkedToAgent,
      };
    });
  }, [credentialsData, toolsData, agentToolsData]);

  return { cards, isLoading };
}
