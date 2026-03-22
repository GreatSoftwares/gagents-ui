import type { Agent } from "../../types";
import type { GagentsHookConfig } from "../../hooks/types";
import { AgentObjectivesList } from "./agent-objectives-list";
import { AgentPromptEditor } from "./agent-prompt-editor";
import { AgentConversationsPanel } from "../conversations/agent-conversations-panel";
import { CapabilitiesTab } from "../capabilities/capabilities-tab";
import { IntegrationsTab } from "../capabilities/integrations-tab";
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
}

export function AgentTabs({
  agent,
  config,
  renderChatLink,
}: AgentTabsProps) {
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
        <IntegrationsTab config={config} agentId={agent.id} />
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
