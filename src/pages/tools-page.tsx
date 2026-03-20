import { useState } from "react";
import { ToolsTable } from "../components/tools/tools-table";
import { ToolFormDialog } from "../components/tools/tool-form-dialog";
import { Button } from "@greatapps/greatauth-ui/ui";
import { Plus } from "lucide-react";
import type { GagentsHookConfig } from "../hooks/types";
import type { Tool } from "../types";

export interface ToolsPageProps {
  config: GagentsHookConfig;
  title?: string;
  subtitle?: string;
}

export function ToolsPage({
  config,
  title = "Ferramentas",
  subtitle = "Gerencie as ferramentas disponíveis para seus agentes",
}: ToolsPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTool, setEditTool] = useState<Tool | undefined>(undefined);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nova Ferramenta
        </Button>
      </div>

      <ToolsTable config={config} onEdit={(tool) => setEditTool(tool)} />

      <ToolFormDialog
        config={config}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <ToolFormDialog
        config={config}
        open={!!editTool}
        onOpenChange={(open) => !open && setEditTool(undefined)}
        tool={editTool}
      />
    </div>
  );
}
