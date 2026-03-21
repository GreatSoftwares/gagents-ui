'use client';

import { useState } from "react";
import type { GagentsHookConfig } from "../../hooks/types";
import { useToolCredentials } from "../../hooks";
import { ToolsTable } from "../tools/tools-table";
import { ToolCredentialsForm } from "../tools/tool-credentials-form";
import { ToolFormDialog } from "../tools/tool-form-dialog";
import type { Tool } from "../../types";
import { Info } from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AdvancedTabProps {
  config: GagentsHookConfig;
  agentId: number;
  gagentsApiUrl: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdvancedTab({ config, agentId, gagentsApiUrl }: AdvancedTabProps) {
  const { data: credentialsData, isLoading: isLoadingCredentials } =
    useToolCredentials(config);
  const credentials = credentialsData?.data ?? [];

  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [showToolForm, setShowToolForm] = useState(false);

  function handleEditTool(tool: Tool) {
    setEditingTool(tool);
    setShowToolForm(true);
  }

  function handleToolFormOpenChange(open: boolean) {
    setShowToolForm(open);
    if (!open) setEditingTool(null);
  }

  return (
    <div className="space-y-8">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Use as abas <strong>Capacidades</strong> e <strong>Integrações</strong> para
          configuração simplificada. Esta aba oferece controlo manual avançado sobre
          ferramentas e credenciais.
        </p>
      </div>

      {/* Ferramentas section */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium">Ferramentas</h3>
        <ToolsTable onEdit={handleEditTool} config={config} />
      </section>

      {/* Credenciais section */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium">Credenciais</h3>
        <ToolCredentialsForm
          credentials={credentials}
          isLoading={isLoadingCredentials}
          config={config}
          gagentsApiUrl={gagentsApiUrl}
        />
      </section>

      {/* Tool edit dialog */}
      <ToolFormDialog
        open={showToolForm}
        onOpenChange={handleToolFormOpenChange}
        tool={editingTool ?? undefined}
        config={config}
      />
    </div>
  );
}
