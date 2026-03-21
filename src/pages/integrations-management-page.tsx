'use client';

import { useState, useMemo } from "react";
import { useToolCredentials, useAgents, useTools } from "../hooks";
import { ToolCredentialsForm } from "../components/tools/tool-credentials-form";
import { IntegrationsTab } from "../components/capabilities/integrations-tab";
import {
  Badge,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@greatapps/greatauth-ui/ui";
import { Plus, Plug, KeyRound, Info } from "lucide-react";
import type { GagentsHookConfig } from "../hooks/types";
import type { IntegrationCardData } from "../hooks/use-integrations";
import type { Agent, Tool, ToolCredential } from "../types";

export interface IntegrationsManagementPageProps {
  config: GagentsHookConfig;
  gagentsApiUrl: string;
  /** Called when user clicks connect/reconnect on an integration card. */
  onConnect?: (card: IntegrationCardData) => void;
  title?: string;
  subtitle?: string;
}

/**
 * Build a map of credential id → list of agent names that use it.
 * Cross-references tools (which link credential via id) with agents
 * that have agent_tools referencing those tools.
 *
 * Since we don't have an account-level agent_tools endpoint, we
 * approximate by checking which tools are linked to credentials and
 * showing credential-level stats.
 */
function useCredentialAgentSummary(
  credentials: ToolCredential[],
  tools: Tool[],
  agents: Agent[],
) {
  return useMemo(() => {
    // Build a set of tool IDs that have credentials
    const toolIdsWithCredentials = new Set(
      credentials.map((c) => c.id_tool).filter(Boolean),
    );

    // Count how many credentials are linked to tools that agents could use
    const linkedCount = credentials.filter(
      (c) => c.id_tool && toolIdsWithCredentials.has(c.id_tool),
    ).length;

    return {
      totalCredentials: credentials.length,
      linkedToTools: linkedCount,
      totalAgents: agents.length,
      totalTools: tools.length,
    };
  }, [credentials, tools, agents]);
}

export function IntegrationsManagementPage({
  config,
  gagentsApiUrl,
  onConnect,
  title = "Integrações e Credenciais",
  subtitle = "Gerencie todas as integrações e credenciais da conta.",
}: IntegrationsManagementPageProps) {
  const { data: credentialsData, isLoading: credentialsLoading } =
    useToolCredentials(config);
  const { data: agentsData } = useAgents(config);
  const { data: toolsData } = useTools(config);
  const [createOpen, setCreateOpen] = useState(false);

  const credentials = credentialsData?.data || [];
  const agents: Agent[] = agentsData?.data || [];
  const tools: Tool[] = toolsData?.data || [];

  const summary = useCredentialAgentSummary(credentials, tools, agents);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="credentials" className="gap-2">
            <KeyRound className="h-4 w-4" />
            Credenciais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="mt-4">
          <IntegrationsTab
            config={config}
            agentId={null}
            onConnect={onConnect ?? (() => {})}
          />
        </TabsContent>

        <TabsContent value="credentials" className="mt-4">
          {/* Summary bar */}
          {!credentialsLoading && (
            <div className="flex items-center gap-4 rounded-lg border bg-muted/50 px-4 py-3 mb-4">
              <Info className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span>
                  <Badge variant="secondary" className="mr-1">
                    {summary.totalCredentials}
                  </Badge>
                  {summary.totalCredentials === 1
                    ? "credencial configurada"
                    : "credenciais configuradas"}
                </span>
                <span className="text-muted-foreground">|</span>
                <span>
                  <Badge variant="secondary" className="mr-1">
                    {summary.linkedToTools}
                  </Badge>
                  {summary.linkedToTools === 1
                    ? "vinculada a ferramentas"
                    : "vinculadas a ferramentas"}
                </span>
                <span className="text-muted-foreground">|</span>
                <span>
                  <Badge variant="secondary" className="mr-1">
                    {summary.totalAgents}
                  </Badge>
                  {summary.totalAgents === 1
                    ? "agente na conta"
                    : "agentes na conta"}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end mb-4">
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Credencial
            </Button>
          </div>

          <ToolCredentialsForm
            config={config}
            gagentsApiUrl={gagentsApiUrl}
            credentials={credentials}
            isLoading={credentialsLoading}
            createOpen={createOpen}
            onCreateOpenChange={setCreateOpen}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
