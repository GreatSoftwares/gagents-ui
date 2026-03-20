import { useConversation } from "../../hooks";
import type { GagentsHookConfig } from "../../hooks/types";
import { Skeleton, Button } from "@greatapps/greatauth-ui/ui";
import { X, MessageSquare } from "lucide-react";

interface ConversationViewProps {
  conversationId: number;
  onClose: () => void;
  contactsMap?: Map<number, string>;
  config: GagentsHookConfig;
  renderChatLink?: (inboxId: number) => React.ReactNode;
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("pt-BR");
}

export function ConversationView({
  conversationId,
  onClose,
  contactsMap,
  config,
  renderChatLink,
}: ConversationViewProps) {
  const { data: conversation, isLoading } = useConversation(config, conversationId);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Conversa não encontrada.
          </p>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Detalhes da conversa #{conversation.id}</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {conversation.id_external ? (
        renderChatLink ? (
          renderChatLink(conversation.id_external)
        ) : (
          <Button variant="outline" size="sm" asChild>
            <a href={`/gchat/inbox/${conversation.id_external}`}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Ver no Chat
            </a>
          </Button>
        )
      ) : null}

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <span className="text-muted-foreground">Thread ID</span>
          <p className="font-mono text-xs mt-0.5">
            {conversation.openai_thread_id || "—"}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Contato</span>
          <p className="mt-0.5">
            {contactsMap?.get(conversation.id_contact) ?? conversation.id_contact}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Agente</span>
          <p className="mt-0.5">{conversation.id_agent ?? "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Mensagens</span>
          <p className="mt-0.5">{conversation.message_count ?? "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Tokens</span>
          <p className="mt-0.5">{conversation.usage_tokens ?? "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Rotações de Thread</span>
          <p className="mt-0.5">{conversation.rotation_count ?? "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Criado em</span>
          <p className="mt-0.5">
            {formatDateTime(conversation.datetime_add)}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Atualizado em</span>
          <p className="mt-0.5">
            {formatDateTime(conversation.datetime_alt)}
          </p>
        </div>
      </div>
    </div>
  );
}
