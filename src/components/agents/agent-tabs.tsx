import { useState, useCallback } from "react";
import type { Agent } from "../../types";
import type { GagentsHookConfig } from "../../hooks/types";
import type { IntegrationCardData } from "../../hooks/use-integrations";
import type { WizardIntegrationMeta } from "../capabilities/types";
import type { ConfigOption } from "../capabilities/wizard-steps/config-step";
import { AgentObjectivesList } from "./agent-objectives-list";
import { AgentPromptEditor } from "./agent-prompt-editor";
import { AgentConversationsPanel } from "../conversations/agent-conversations-panel";
import { CapabilitiesTab } from "../capabilities/capabilities-tab";
import { IntegrationsTab } from "../capabilities/integrations-tab";
import { IntegrationWizard } from "../capabilities/integration-wizard";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@greatapps/greatauth-ui/ui";
import { Target, FileText, MessageCircle, Blocks, Plug } from "lucide-react";

interface AgentTabsProps {
  agent: Agent;
  config: GagentsHookConfig;
  renderChatLink?: (inboxId: number) => React.ReactNode;
  gagentsApiUrl?: string;
  resolveWizardMeta?: (card: IntegrationCardData) => WizardIntegrationMeta;
  loadConfigOptions?: (credentialId: number) => Promise<ConfigOption[]>;
  onWizardComplete?: () => void;
}

export function AgentTabs({
  agent,
  config,
  renderChatLink,
  gagentsApiUrl,
  resolveWizardMeta,
  loadConfigOptions,
  onWizardComplete,
}: AgentTabsProps) {
  const apiUrl = gagentsApiUrl || config.baseUrl;

  // Wizard state for Integrações tab
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<IntegrationCardData | null>(null);

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

  return (
    <>
      <Tabs defaultValue="prompt">
        <TabsList>
          <TabsTrigger value="prompt" className="flex items-center gap-1.5">
            <FileText aria-hidden="true" className="h-3.5 w-3.5" />
            Prompt
          </TabsTrigger>
          <TabsTrigger value="objetivos" className="flex items-center gap-1.5">
            <Target aria-hidden="true" className="h-3.5 w-3.5" />
            Objetivos
          </TabsTrigger>
          <TabsTrigger value="capacidades" className="flex items-center gap-1.5">
            <Blocks aria-hidden="true" className="h-3.5 w-3.5" />
            Capacidades
          </TabsTrigger>
          <TabsTrigger value="integracoes" className="flex items-center gap-1.5">
            <Plug aria-hidden="true" className="h-3.5 w-3.5" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="conversas" className="flex items-center gap-1.5">
            <MessageCircle aria-hidden="true" className="h-3.5 w-3.5" />
            Conversas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompt" className="mt-4">
          <AgentPromptEditor agent={agent} config={config} />
        </TabsContent>

        <TabsContent value="objetivos" className="mt-4">
          <AgentObjectivesList agent={agent} config={config} />
        </TabsContent>

        <TabsContent value="capacidades" className="mt-4">
          <CapabilitiesTab config={config} agentId={agent.id} />
        </TabsContent>

        <TabsContent value="integracoes" className="mt-4">
          <IntegrationsTab config={config} agentId={agent.id} onConnect={handleConnect} />
        </TabsContent>

        <TabsContent value="conversas" className="mt-4">
          <AgentConversationsPanel
            agent={agent}
            config={config}
            renderChatLink={renderChatLink}
          />
        </TabsContent>
      </Tabs>

      {activeCard && wizardMeta && (
        <IntegrationWizard
          open={wizardOpen}
          onOpenChange={handleWizardClose}
          integration={activeCard.definition}
          meta={wizardMeta}
          agentId={agent.id}
          config={config}
          gagentsApiUrl={apiUrl}
          existingCredentialId={activeCard.credentialId}
          onComplete={handleWizardComplete}
          loadConfigOptions={loadConfigOptions}
        />
      )}
    </>
  );
}
