import { useState } from "react";
import { AgentsTable } from "../components/agents/agents-table";
import { AgentFormDialog } from "../components/agents/agent-form-dialog";
import { Button } from "@greatapps/greatauth-ui/ui";
import { Plus } from "lucide-react";
import type { GagentsHookConfig } from "../hooks/types";

export interface AgentsPageProps {
  config: GagentsHookConfig;
  onNavigateToAgent?: (agentId: number) => void;
  title?: string;
  subtitle?: string;
}

export function AgentsPage({
  config,
  onNavigateToAgent,
  title = "Agentes AI",
  subtitle = "Gerencie seus agentes de atendimento inteligente",
}: AgentsPageProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Novo Agente
        </Button>
      </div>

      <AgentsTable config={config} onNavigateToAgent={onNavigateToAgent} />

      <AgentFormDialog
        config={config}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
