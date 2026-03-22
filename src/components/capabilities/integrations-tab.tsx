'use client';

import { useCallback } from "react";
import type { GagentsHookConfig } from "../../hooks/types";
import { useIntegrationState } from "../../hooks/use-integrations";
import { useAgentTools, useAddAgentTool, useRemoveAgentTool } from "../../hooks/use-agent-tools";
import { Switch, Tooltip, TooltipContent, TooltipTrigger } from "@greatapps/greatauth-ui/ui";
import { Plug, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CalendarSync } from "lucide-react";
import { cn } from "../../lib";

// ---------------------------------------------------------------------------
// Icon mapping
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  CalendarSync,
  Plug,
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Plug;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface IntegrationsTabProps {
  config: GagentsHookConfig;
  agentId: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IntegrationsTab({
  config,
  agentId,
}: IntegrationsTabProps) {
  const { cards, isLoading } = useIntegrationState(config, agentId);
  const { data: agentToolsData, isLoading: agentToolsLoading } = useAgentTools(config, agentId);
  const addAgentTool = useAddAgentTool(config);
  const removeAgentTool = useRemoveAgentTool(config);

  const agentTools = agentToolsData?.data ?? [];

  // Only show connected credentials (account-level)
  const connectedCards = cards.filter(
    (c) => !c.isAddNew && (c.state === "connected" || c.state === "expired"),
  );

  const handleToggle = useCallback(
    (toolId: number, checked: boolean) => {
      if (checked) {
        // Add agent_tool linking this agent to this tool
        addAgentTool.mutate({
          idAgent: agentId,
          body: { id_tool: toolId, enabled: true },
        });
      } else {
        // Find the agent_tool to remove
        const agentTool = agentTools.find((at) => at.id_tool === toolId);
        if (agentTool) {
          removeAgentTool.mutate({ idAgent: agentId, id: agentTool.id });
        }
      }
    },
    [agentTools, agentId, addAgentTool, removeAgentTool],
  );

  // Loading state
  if (isLoading || agentToolsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Empty state — no integrations connected at account level
  if (connectedCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Plug className="h-10 w-10" />
        <p className="text-sm font-medium">Nenhuma integração conectada</p>
        <p className="text-xs text-center max-w-sm">
          Conecte integrações na página de Integrações da conta para que possam
          ser ativadas neste agente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Ative ou desative as integrações conectadas na conta para este agente.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {connectedCards.map((card) => {
          const Icon = resolveIcon(card.definition.icon);
          const isLinked = card.linkedToAgent;
          const isMutating = addAgentTool.isPending || removeAgentTool.isPending;

          return (
            <div
              key={`${card.definition.slug}-cred-${card.credentialId}`}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow",
                isLinked ? "border-primary/30 shadow-sm" : "opacity-75",
              )}
            >
              {/* Icon */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4.5 w-4.5" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium leading-tight truncate">
                  {card.definition.name}
                </h4>
                {card.accountLabel && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs text-muted-foreground truncate" title={card.accountLabel}>
                        {card.accountLabel}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>{card.accountLabel}</TooltipContent>
                  </Tooltip>
                )}
                {card.state === "expired" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">Expirado</p>
                )}
              </div>

              {/* Toggle */}
              <Switch
                checked={isLinked}
                disabled={isMutating || !card.tool}
                onCheckedChange={(checked) =>
                  card.tool && handleToggle(card.tool.id, checked)
                }
                aria-label={`${isLinked ? "Desativar" : "Ativar"} ${card.definition.name} para este agente`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
