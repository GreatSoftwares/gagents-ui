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
  /** Credential ID — set for connected/expired cards, undefined for "add new" */
  credentialId?: number;
  /** Account label (email or label from credential) */
  accountLabel?: string;
  /** Whether this is the "add new account" card */
  isAddNew?: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Cross-references the static integrations registry with live data
 * (tools, tool_credentials, agent_tools) to produce card state for each
 * integration entry.
 *
 * Returns:
 * - One card per existing credential (connected/expired)
 * - One "add new" card per integration type
 * - Coming soon cards as before
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

    const result: IntegrationCardData[] = [];

    for (const def of INTEGRATIONS_REGISTRY) {
      // coming_soon short-circuit
      if (def.status === "coming_soon") {
        result.push({
          definition: def,
          state: "coming_soon" as const,
          credential: null,
          tool: null,
          sharedByAgentsCount: 0,
          linkedToAgent: false,
        });
        continue;
      }

      // Find tool record matching registry slug
      const matchedTool = tools.find((t) => t.slug === def.slug) ?? null;

      // Find ALL credentials for this integration
      // Credentials can be linked via id_tool OR id_platform_integration
      // We match by tool slug through the tool record
      const matchedCredentials = matchedTool
        ? credentials.filter((c) => c.id_tool === matchedTool.id)
        : [];

      // Also check credentials linked via platform_integration slug
      // (platform_integrations use the same slug convention)
      const piCredentials = credentials.filter(
        (c) =>
          c.id_platform_integration != null &&
          !c.id_tool &&
          // We can't directly match slug here since we don't have
          // platform_integrations data, but credentials with
          // id_platform_integration are for calendar integrations
          // which match by the registry slug
          matchedTool == null,
      );

      // Combine — prefer tool-based credentials, fallback to PI-based
      const allCredentials =
        matchedCredentials.length > 0 ? matchedCredentials : piCredentials;

      // Check if this agent has a linked agent_tool for this tool
      const linkedToAgent = matchedTool
        ? agentTools.some((at) => at.id_tool === matchedTool.id)
        : false;

      // Create one card per existing credential
      for (const cred of allCredentials) {
        const state: IntegrationCardState =
          cred.status === "expired" ? "expired" : "connected";

        // Derive account label from external_reference or label
        const accountLabel =
          cred.external_reference || cred.label || undefined;

        result.push({
          definition: def,
          state,
          credential: cred,
          tool: matchedTool,
          sharedByAgentsCount: 1,
          linkedToAgent,
          credentialId: cred.id,
          accountLabel,
        });
      }

      // Always add an "add new account" card for this integration type
      result.push({
        definition: def,
        state: "available" as const,
        credential: null,
        tool: matchedTool,
        sharedByAgentsCount: 0,
        linkedToAgent: false,
        isAddNew: true,
      });
    }

    return result;
  }, [credentialsData, toolsData, agentToolsData]);

  return { cards, isLoading };
}
