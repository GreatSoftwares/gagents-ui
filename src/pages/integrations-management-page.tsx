'use client';

import { useMemo, useCallback, useState } from "react";
import { useToolCredentials, useAgents, useTools } from "../hooks";
import { ToolCredentialsForm } from "../components/tools/tool-credentials-form";
import { IntegrationCard } from "../components/capabilities/integration-card";
import { IntegrationWizard } from "../components/capabilities/integration-wizard";
import { useIntegrationState, type IntegrationCardData } from "../hooks/use-integrations";
import type { WizardIntegrationMeta } from "../components/capabilities/types";
import type { ConfigOption } from "../components/capabilities/wizard-steps/config-step";
import {
  Badge,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@greatapps/greatauth-ui/ui";
import { Plug, KeyRound, Info, Loader2 } from "lucide-react";
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

/**
 * Build a map of credential id -> list of agent names that use it.
 */
function useCredentialAgentSummary(
  credentials: ToolCredential[],
  tools: Tool[],
  agents: Agent[],
) {
  return useMemo(() => {
    const toolIdsWithCredentials = new Set(
      credentials.map((c) => c.id_tool).filter(Boolean),
    );

    const linkedCount = credentials.filter(
      (c) => c.id_tool && toolIdsWithCredentials.has(c.id_tool),
    ).length;

    return {
      totalCredentials: credentials.length,
      linkedToTools: linkedCount,
      totalAgents: agents.length,
      totalTools: tools.length,
    };
  }, [credentials, tools, agents]);
}

export function IntegrationsManagementPage({
  config,
  gagentsApiUrl,
  resolveWizardMeta,
  loadConfigOptions,
  onWizardComplete,
  title = "Integrações e Credenciais",
  subtitle = "Gerencie todas as integrações e credenciais da conta.",
}: IntegrationsManagementPageProps) {
  const { data: credentialsData, isLoading: credentialsLoading } =
    useToolCredentials(config);
  const { data: agentsData } = useAgents(config);
  const { data: toolsData } = useTools(config);
  // Integration cards state (account-level, agentId=null)
  const { cards, isLoading: cardsLoading } = useIntegrationState(config, null);

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<IntegrationCardData | null>(null);

  const credentials = credentialsData?.data || [];
  const agents: Agent[] = agentsData?.data || [];
  const tools: Tool[] = toolsData?.data || [];

  const summary = useCredentialAgentSummary(credentials, tools, agents);

  const handleConnect = useCallback((card: IntegrationCardData) => {
    setActiveCard(card);
    setWizardOpen(true);
  }, []);

  const handleWizardClose = useCallback((open: boolean) => {
    if (!open) {
      setActiveCard(null);
    }
    setWizardOpen(open);
  }, []);

  const handleWizardComplete = useCallback(() => {
    setWizardOpen(false);
    setActiveCard(null);
    onWizardComplete?.();
  }, [onWizardComplete]);

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

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="credentials" className="gap-2">
            <KeyRound className="h-4 w-4" />
            Credenciais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="mt-4">
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
        </TabsContent>

        <TabsContent value="credentials" className="mt-4">
          {/* Summary bar */}
          {!credentialsLoading && (
            <div className="flex items-center gap-4 rounded-lg border bg-muted/50 px-4 py-3 mb-4">
              <Info className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span>
                  <Badge variant="secondary" className="mr-1">
                    {summary.totalCredentials}
                  </Badge>
                  {summary.totalCredentials === 1
                    ? "credencial configurada"
                    : "credenciais configuradas"}
                </span>
                <span className="text-muted-foreground">|</span>
                <span>
                  <Badge variant="secondary" className="mr-1">
                    {summary.linkedToTools}
                  </Badge>
                  {summary.linkedToTools === 1
                    ? "vinculada a ferramentas"
                    : "vinculadas a ferramentas"}
                </span>
                <span className="text-muted-foreground">|</span>
                <span>
                  <Badge variant="secondary" className="mr-1">
                    {summary.totalAgents}
                  </Badge>
                  {summary.totalAgents === 1
                    ? "agente na conta"
                    : "agentes na conta"}
                </span>
              </div>
            </div>
          )}

          <ToolCredentialsForm
            config={config}
            gagentsApiUrl={gagentsApiUrl}
            credentials={credentials}
            isLoading={credentialsLoading}
          />
        </TabsContent>
      </Tabs>

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
