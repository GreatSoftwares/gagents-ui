import { useState } from "react";
import type { Conversation } from "../../types";
import type { GagentsHookConfig } from "../../hooks/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
  Badge,
} from "@greatapps/greatauth-ui/ui";
import { MessageCircle, ExternalLink } from "lucide-react";
import { ConversationView } from "./conversation-view";

interface AgentConversationsTableProps {
  conversations: Conversation[];
  isLoading: boolean;
  contactsMap?: Map<number, string>;
  objectivesMap?: Map<number, string>;
  config: GagentsHookConfig;
  renderChatLink?: (inboxId: number) => React.ReactNode;
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}m atrás`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h atrás`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d atrás`;
  return date.toLocaleDateString("pt-BR");
}

export function AgentConversationsTable({
  conversations,
  isLoading,
  contactsMap,
  objectivesMap,
  config,
  renderChatLink,
}: AgentConversationsTableProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <MessageCircle className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Nenhuma conversa encontrada.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Objetivo</TableHead>
            <TableHead className="text-right">Mensagens</TableHead>
            <TableHead className="text-right">Tokens</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead>Atualizado em</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.map((conversation) => (
            <TableRow
              key={conversation.id}
              className="cursor-pointer"
              onClick={() =>
                setSelectedId(
                  selectedId === conversation.id ? null : conversation.id,
                )
              }
              data-state={selectedId === conversation.id ? "selected" : undefined}
            >
              <TableCell className="font-mono text-xs">
                {conversation.id}
              </TableCell>
              <TableCell>
                {contactsMap?.get(conversation.id_contact) ?? conversation.id_contact}
              </TableCell>
              <TableCell>
                {conversation.id_objective && objectivesMap?.get(conversation.id_objective) ? (
                  <Badge variant="secondary" className="text-xs">
                    {objectivesMap.get(conversation.id_objective)}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {conversation.message_count ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {conversation.usage_tokens ?? "—"}
              </TableCell>
              <TableCell>
                {new Date(conversation.datetime_add).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell>
                {formatRelativeDate(conversation.datetime_alt)}
              </TableCell>
              <TableCell>
                {conversation.id_external ? (
                  renderChatLink ? (
                    <span onClick={(e) => e.stopPropagation()}>
                      {renderChatLink(conversation.id_external)}
                    </span>
                  ) : (
                    <a
                      href={`/gchat/inbox/${conversation.id_external}`}
                      title="Ver no Chat"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedId && (
        <ConversationView
          conversationId={selectedId}
          onClose={() => setSelectedId(null)}
          contactsMap={contactsMap}
          config={config}
          renderChatLink={renderChatLink}
        />
      )}
    </div>
  );
}
