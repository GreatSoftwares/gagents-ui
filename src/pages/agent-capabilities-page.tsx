'use client';

import { useState, useCallback } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@greatapps/greatauth-ui/ui";
import { Blocks, Plug, Settings } from "lucide-react";

import type { GagentsHookConfig } from "../hooks/types";
import type { IntegrationCardData } from "../hooks/use-integrations";
import type { WizardIntegrationMeta } from "../components/capabilities/types";
import { CapabilitiesTab } from "../components/capabilities/capabilities-tab";
import { IntegrationsTab } from "../components/capabilities/integrations-tab";
import { IntegrationWizard } from "../components/capabilities/integration-wizard";
import { AdvancedTab } from "../components/capabilities/advanced-tab";
import type { ConfigOption } from "../components/capabilities/wizard-steps/config-step";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AgentCapabilitiesPageProps {
  config: GagentsHookConfig;
  agentId: number;
  gagentsApiUrl: string;
  /**
   * Resolve wizard metadata for a given integration card.
   * The consuming app provides this so the wizard gets correct
   * capabilities, requirements, and config step flag.
   */
  resolveWizardMeta?: (card: IntegrationCardData) => WizardIntegrationMeta;
  /**
   * Callback to load config options after OAuth completes
   * (e.g. load Google Calendar list). Forwarded to IntegrationWizard.
   */
  loadConfigOptions?: (credentialId: number) => Promise<ConfigOption[]>;
  /** Called after wizard completes successfully. */
  onWizardComplete?: () => void;
}

// ---------------------------------------------------------------------------
// Default wizard meta resolver
// ---------------------------------------------------------------------------

function defaultResolveWizardMeta(card: IntegrationCardData): WizardIntegrationMeta {
  return {
    capabilities: [
      { label: card.definition.name, description: card.definition.description },
    ],
    requirements: [],
    hasConfigStep: false,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentCapabilitiesPage({
  config,
  agentId,
  gagentsApiUrl,
  resolveWizardMeta = defaultResolveWizardMeta,
  loadConfigOptions,
  onWizardComplete,
}: AgentCapabilitiesPageProps) {
  // Wizard dialog state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<IntegrationCardData | null>(null);

  const handleConnect = useCallback(
    (card: IntegrationCardData) => {
      setActiveCard(card);
      setWizardOpen(true);
    },
    [],
  );

  const handleWizardComplete = useCallback(() => {
    setWizardOpen(false);
    setActiveCard(null);
    onWizardComplete?.();
  }, [onWizardComplete]);

  const handleWizardOpenChange = useCallback((open: boolean) => {
    setWizardOpen(open);
    if (!open) setActiveCard(null);
  }, []);

  // Derive wizard meta from active card
  const wizardMeta = activeCard ? resolveWizardMeta(activeCard) : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Capacidades e Integrações</h2>
        <p className="text-sm text-muted-foreground">
          Configure o que este agente pode fazer e quais serviços externos ele utiliza.
        </p>
      </div>

      <Tabs defaultValue="capacidades">
        <TabsList>
          <TabsTrigger value="capacidades" className="flex items-center gap-1.5">
            <Blocks aria-hidden="true" className="h-3.5 w-3.5" />
            Capacidades
          </TabsTrigger>
          <TabsTrigger value="integracoes" className="flex items-center gap-1.5">
            <Plug aria-hidden="true" className="h-3.5 w-3.5" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="avancado" className="flex items-center gap-1.5">
            <Settings aria-hidden="true" className="h-3.5 w-3.5" />
            Avançado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="capacidades" className="mt-4">
          <CapabilitiesTab config={config} agentId={agentId} />
        </TabsContent>

        <TabsContent value="integracoes" className="mt-4">
          <IntegrationsTab
            config={config}
            agentId={agentId}
            onConnect={handleConnect}
          />
        </TabsContent>

        <TabsContent value="avancado" className="mt-4">
          <AdvancedTab
            config={config}
            agentId={agentId}
            gagentsApiUrl={gagentsApiUrl}
          />
        </TabsContent>
      </Tabs>

      {/* Integration Wizard Dialog */}
      {activeCard && wizardMeta && (
        <IntegrationWizard
          open={wizardOpen}
          onOpenChange={handleWizardOpenChange}
          integration={activeCard.definition}
          meta={wizardMeta}
          agentId={agentId}
          config={config}
          onComplete={handleWizardComplete}
          gagentsApiUrl={gagentsApiUrl}
          existingCredentialId={activeCard.credential?.id}
          loadConfigOptions={loadConfigOptions}
        />
      )}
    </div>
  );
}
