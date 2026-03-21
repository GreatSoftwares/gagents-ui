import type { Agent } from "../../types";
import type { GagentsHookConfig } from "../../hooks/types";
import type { IntegrationCardData } from "../../hooks/use-integrations";
import type { WizardIntegrationMeta } from "../capabilities/types";
import type { ConfigOption } from "../capabilities/wizard-steps/config-step";
import { AgentToolsList } from "./agent-tools-list";
import { AgentObjectivesList } from "./agent-objectives-list";
import { AgentPromptEditor } from "./agent-prompt-editor";
import { AgentConversationsPanel } from "../conversations/agent-conversations-panel";
import { AgentCapabilitiesPage } from "../../pages/agent-capabilities-page";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@greatapps/greatauth-ui/ui";
import { Wrench, Target, FileText, MessageCircle, Blocks } from "lucide-react";

interface AgentTabsProps {
  agent: Agent;
  config: GagentsHookConfig;
  renderChatLink?: (inboxId: number) => React.ReactNode;
  /** Required for the Capacidades tab — gagents API URL for OAuth flows and advanced features. Falls back to config.baseUrl. */
  gagentsApiUrl?: string;
  /** Resolve wizard metadata for a given integration card. */
  resolveWizardMeta?: (card: IntegrationCardData) => WizardIntegrationMeta;
  /** Callback to load config options after OAuth completes. */
  loadConfigOptions?: (credentialId: number) => Promise<ConfigOption[]>;
  /** Called after wizard completes successfully. */
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

  return (
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
        <TabsTrigger value="ferramentas" className="flex items-center gap-1.5">
          <Wrench aria-hidden="true" className="h-3.5 w-3.5" />
          Ferramentas
        </TabsTrigger>
        <TabsTrigger value="capacidades" className="flex items-center gap-1.5">
          <Blocks aria-hidden="true" className="h-3.5 w-3.5" />
          Capacidades
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

      <TabsContent value="ferramentas" className="mt-4">
        <AgentToolsList agent={agent} config={config} />
      </TabsContent>

      <TabsContent value="capacidades" className="mt-4">
        <AgentCapabilitiesPage
          config={config}
          agentId={agent.id}
          gagentsApiUrl={apiUrl}
          resolveWizardMeta={resolveWizardMeta}
          loadConfigOptions={loadConfigOptions}
          onWizardComplete={onWizardComplete}
        />
      </TabsContent>

      <TabsContent value="conversas" className="mt-4">
        <AgentConversationsPanel
          agent={agent}
          config={config}
          renderChatLink={renderChatLink}
        />
      </TabsContent>
    </Tabs>
  );
}
