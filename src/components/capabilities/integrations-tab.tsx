'use client';

import { useCallback } from "react";
import type { GagentsHookConfig } from "../../hooks/types";
import { useIntegrationState } from "../../hooks/use-integrations";
import { useAgentTools, useAddAgentTool, useRemoveAgentTool } from "../../hooks/use-agent-tools";
import { useCreateTool, useTools } from "../../hooks/use-tools";
import { Switch, Tooltip, TooltipContent, TooltipTrigger } from "@greatapps/greatauth-ui/ui";
import { Plug, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CalendarSync } from "lucide-react";
import { cn } from "../../lib";
import type { IntegrationCardData } from "../../hooks/use-integrations";
import type { Tool } from "../../types";

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
// Integration custom_instructions per slug
// ---------------------------------------------------------------------------

const INTEGRATION_INSTRUCTIONS: Record<string, string> = {
  "google-calendar": `Você tem acesso ao Google Calendar através da integração google-calendar.\nFunções disponíveis:\n- google_calendar_setup_oauth: Configurar conexão OAuth\n- google_calendar_check_status: Verificar status da conexão\n- google_calendar_list_events: Listar eventos do calendário\n- google_calendar_create_event: Criar novo evento\n- google_calendar_update_event: Atualizar evento existente\n- google_calendar_delete_event: Cancelar/remover evento\n\nUse EXATAMENTE os nomes de função listados acima.`,
};

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
  const { data: toolsData } = useTools(config);
  const addAgentTool = useAddAgentTool(config);
  const removeAgentTool = useRemoveAgentTool(config);
  const createTool = useCreateTool(config);

  const agentTools = agentToolsData?.data ?? [];
  const allTools = toolsData?.data ?? [];

  // Only show connected credentials (account-level)
  const connectedCards = cards.filter(
    (c) => !c.isAddNew && (c.state === "connected" || c.state === "expired"),
  );

  const handleToggle = useCallback(
    async (card: IntegrationCardData, checked: boolean) => {
      if (checked) {
        let toolId = card.tool?.id;

        // If no tool record exists for this integration, create one on-the-fly
        if (!toolId) {
          const existingTool = allTools.find((t) => t.slug === card.definition.slug);
          if (existingTool) {
            toolId = existingTool.id;
          } else {
            try {
              const result = await createTool.mutateAsync({
                name: card.definition.name,
                slug: card.definition.slug,
                type: "integration",
                description: card.definition.description,
              });
              const d = result?.data;
              toolId = (Array.isArray(d) ? d[0]?.id : (d as Tool | undefined)?.id) ?? undefined;
              if (!toolId) {
                console.error("[IntegrationsTab] Failed to create tool — no ID returned");
                return;
              }
            } catch (err) {
              console.error("[IntegrationsTab] Error creating tool:", err);
              return;
            }
          }
        }

        // Create agent_tool with custom_instructions for the integration
        const customInstructions = INTEGRATION_INSTRUCTIONS[card.definition.slug];
        addAgentTool.mutate({
          idAgent: agentId,
          body: {
            id_tool: toolId,
            enabled: true,
            ...(customInstructions ? { custom_instructions: customInstructions } : {}),
          },
        });
      } else {
        // Find the agent_tool to remove
        const toolId = card.tool?.id;
        if (toolId) {
          const agentTool = agentTools.find((at) => at.id_tool === toolId);
          if (agentTool) {
            removeAgentTool.mutate({ idAgent: agentId, id: agentTool.id });
          }
        }
      }
    },
    [agentTools, allTools, agentId, addAgentTool, removeAgentTool, createTool],
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
          const isMutating = addAgentTool.isPending || removeAgentTool.isPending || createTool.isPending;

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

              {/* Toggle — no longer blocked by missing tool record */}
              <Switch
                checked={isLinked}
                disabled={isMutating}
                onCheckedChange={(checked) => handleToggle(card, checked)}
                aria-label={`${isLinked ? "Desativar" : "Ativar"} ${card.definition.name} para este agente`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
