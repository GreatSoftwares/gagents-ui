import type { Agent } from "../../types";
import type { GagentsHookConfig } from "../../hooks/types";
import { useAgentConversations, useGagentsContacts, useObjectives } from "../../hooks";
import { AgentConversationsTable } from "./agent-conversations-table";

interface AgentConversationsPanelProps {
  agent: Agent;
  config: GagentsHookConfig;
  renderChatLink?: (inboxId: number) => React.ReactNode;
}

export function AgentConversationsPanel({
  agent,
  config,
  renderChatLink,
}: AgentConversationsPanelProps) {
  const { data: conversationsData, isLoading } = useAgentConversations(
    config,
    agent.id,
  );
  const { data: contactsData } = useGagentsContacts(config);
  const { data: objectivesData } = useObjectives(config, agent.id);

  const conversations = conversationsData?.data || [];
  const contactsMap = new Map(
    (contactsData?.data || []).map((c) => [c.id, c.name]),
  );
  const objectivesMap = new Map(
    (objectivesData?.data || []).map((o) => [o.id, o.title]),
  );

  return (
    <div className="p-4">
      <AgentConversationsTable
        conversations={conversations}
        isLoading={isLoading}
        contactsMap={contactsMap}
        objectivesMap={objectivesMap}
        config={config}
        renderChatLink={renderChatLink}
      />
    </div>
  );
}
