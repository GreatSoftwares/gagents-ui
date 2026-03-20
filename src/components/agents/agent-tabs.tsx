import type { Agent } from "../../types";
import type { GagentsHookConfig } from "../../hooks/types";
import { AgentToolsList } from "./agent-tools-list";
import { AgentObjectivesList } from "./agent-objectives-list";
import { AgentPromptEditor } from "./agent-prompt-editor";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@greatapps/greatauth-ui/ui";
import { Wrench, Target, FileText, MessageCircle } from "lucide-react";

interface AgentTabsProps {
  agent: Agent;
  config: GagentsHookConfig;
  renderConversationsTab?: (agent: Agent) => React.ReactNode;
}

export function AgentTabs({ agent, config, renderConversationsTab }: AgentTabsProps) {
  return (
    <Tabs defaultValue="prompt">
      <TabsList>
        <TabsTrigger value="prompt" className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Prompt
        </TabsTrigger>
        <TabsTrigger value="objetivos" className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5" />
          Objetivos
        </TabsTrigger>
        <TabsTrigger value="ferramentas" className="flex items-center gap-1.5">
          <Wrench className="h-3.5 w-3.5" />
          Ferramentas
        </TabsTrigger>
        {renderConversationsTab && (
          <TabsTrigger value="conversas" className="flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" />
            Conversas
          </TabsTrigger>
        )}
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

      {renderConversationsTab && (
        <TabsContent value="conversas" className="mt-4">
          {renderConversationsTab(agent)}
        </TabsContent>
      )}
    </Tabs>
  );
}
