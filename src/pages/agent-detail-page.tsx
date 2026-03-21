import { useState } from "react";
import { useAgent } from "../hooks";
import { AgentTabs } from "../components/agents/agent-tabs";
import { AgentEditForm } from "../components/agents/agent-edit-form";
import { Badge, Button, Skeleton } from "@greatapps/greatauth-ui/ui";
import { EntityAvatar } from "@greatapps/greatauth-ui";
import { ArrowLeft, Pencil } from "lucide-react";
import type { GagentsHookConfig } from "../hooks/types";

export interface AgentDetailPageProps {
  config: GagentsHookConfig;
  agentId: number;
  onBack?: () => void;
  renderChatLink?: (inboxId: number) => React.ReactNode;
}

export function AgentDetailPage({
  config,
  agentId,
  onBack,
  renderChatLink,
}: AgentDetailPageProps) {
  const { data: agent, isLoading } = useAgent(config, agentId);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8">
        <p className="text-muted-foreground">Agente não encontrado</p>
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para agentes
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="rounded-lg border p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
          <div className="flex items-start gap-3 flex-1">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Voltar"
                className="shrink-0 mt-1"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            <EntityAvatar photo={agent.photo} name={agent.title} size="xl" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold">{agent.title}</h1>
                <Badge
                  variant={agent.active ? "default" : "destructive"}
                  className="text-xs"
                >
                  {agent.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="shrink-0 self-start"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      <AgentTabs
        agent={agent}
        config={config}
        renderChatLink={renderChatLink}
      />

      {editOpen && (
        <AgentEditForm
          agent={agent}
          config={config}
          idAccount={config.accountId}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  );
}
