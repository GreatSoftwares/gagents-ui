'use client';

import { useMemo, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToolCredentials, useAgents, useTools } from "../hooks";
import { IntegrationCard } from "../components/capabilities/integration-card";
import { IntegrationWizard } from "../components/capabilities/integration-wizard";
import { useIntegrationState, type IntegrationCardData } from "../hooks/use-integrations";
import { useDeleteToolCredential, useUpdateToolCredential } from "../hooks/use-settings";
import type { WizardIntegrationMeta } from "../components/capabilities/types";
import type { ConfigOption } from "../components/capabilities/wizard-steps/config-step";
import { Plug, Loader2 } from "lucide-react";
import type { GagentsHookConfig } from "../hooks/types";
import type { Agent, Tool, ToolCredential } from "../types";

export interface IntegrationsManagementPageProps {
  config: GagentsHookConfig;
  gagentsApiUrl: string;
  /** Resolve wizard metadata for a given integration card. */
  resolveWizardMeta?: (card: IntegrationCardData) => WizardIntegrationMeta;
  /** Load config options after OAuth completes (e.g. list of calendars). */
  loadConfigOptions?: (credentialId: number) => Promise<ConfigOption[]>;
  /** Called after wizard completes successfully. */
  onWizardComplete?: () => void;
  title?: string;
  subtitle?: string;
}

export function IntegrationsManagementPage({
  config,
  gagentsApiUrl,
  resolveWizardMeta,
  loadConfigOptions,
  onWizardComplete,
  title = "Integrações",
  subtitle = "Gerencie as integrações da conta.",
}: IntegrationsManagementPageProps) {
  const queryClient = useQueryClient();

  // Integration cards state (account-level, agentId=null)
  const { cards, isLoading: cardsLoading } = useIntegrationState(config, null);

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<IntegrationCardData | null>(null);

  // Mutations for card actions
  const deleteCredential = useDeleteToolCredential(config);
  const updateCredential = useUpdateToolCredential(config);

  const handleConnect = useCallback((card: IntegrationCardData) => {
    setActiveCard(card);
    setWizardOpen(true);
  }, []);

  const handleReconnect = useCallback((card: IntegrationCardData) => {
    setActiveCard(card);
    setWizardOpen(true);
  }, []);

  const handleDisconnect = useCallback((card: IntegrationCardData) => {
    if (!card.credentialId) return;
    updateCredential.mutate({
      id: card.credentialId,
      body: { status: "inactive" },
    });
  }, [updateCredential]);

  const handleDelete = useCallback((card: IntegrationCardData) => {
    if (!card.credentialId) return;
    deleteCredential.mutate(card.credentialId);
  }, [deleteCredential]);

  const handleWizardClose = useCallback((open: boolean) => {
    if (!open) {
      setActiveCard(null);
    }
    setWizardOpen(open);
  }, []);

  const handleWizardComplete = useCallback(() => {
    // Invalidate queries BEFORE closing so data refreshes
    queryClient.invalidateQueries({ queryKey: ["greatagents", "tool-credentials"] });
    queryClient.invalidateQueries({ queryKey: ["greatagents", "tools"] });
    queryClient.invalidateQueries({ queryKey: ["greatagents", "agent-tools"] });

    setWizardOpen(false);
    setActiveCard(null);
    onWizardComplete?.();
  }, [onWizardComplete, queryClient]);

  // Resolve wizard meta with sensible defaults
  const wizardMeta: WizardIntegrationMeta | null = activeCard
    ? (resolveWizardMeta?.(activeCard) ?? {
        capabilities: [],
        requirements: [],
        hasConfigStep: false,
      })
    : null;

  // Split integration cards
  const connectedCards = cards.filter(
    (c) => !c.isAddNew && (c.state === "connected" || c.state === "expired"),
  );
  const otherCards = cards.filter(
    (c) => c.isAddNew || c.state === "coming_soon",
  );

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {cardsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Plug className="h-10 w-10" />
          <p className="text-sm">Nenhuma integração disponível</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connected accounts */}
          {connectedCards.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Contas conectadas
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {connectedCards.map((card) => (
                  <IntegrationCard
                    key={`${card.definition.slug}-cred-${card.credentialId}`}
                    card={card}
                    onConnect={handleConnect}
                    onReconnect={handleReconnect}
                    onDisconnect={handleDisconnect}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Add new / coming soon */}
          {otherCards.length > 0 && (
            <div>
              {connectedCards.length > 0 && (
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Adicionar integração
                </h3>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherCards.map((card) => {
                  const key = card.isAddNew
                    ? `${card.definition.slug}-add-new`
                    : card.definition.slug;
                  return (
                    <IntegrationCard
                      key={key}
                      card={card}
                      onConnect={handleConnect}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Integration Wizard */}
      {activeCard && wizardMeta && (
        <IntegrationWizard
          open={wizardOpen}
          onOpenChange={handleWizardClose}
          integration={activeCard.definition}
          meta={wizardMeta}
          agentId={0}
          config={config}
          gagentsApiUrl={gagentsApiUrl}
          existingCredentialId={activeCard.credentialId}
          onComplete={handleWizardComplete}
          loadConfigOptions={loadConfigOptions}
        />
      )}
    </div>
  );
}
