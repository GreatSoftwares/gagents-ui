'use client';

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@greatapps/greatauth-ui/ui";
import { Blocks, Plug, Settings } from "lucide-react";

import type { GagentsHookConfig } from "../hooks/types";
import { CapabilitiesTab } from "../components/capabilities/capabilities-tab";
import { IntegrationsTab } from "../components/capabilities/integrations-tab";
import { AdvancedTab } from "../components/capabilities/advanced-tab";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AgentCapabilitiesPageProps {
  config: GagentsHookConfig;
  agentId: number;
  gagentsApiUrl: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentCapabilitiesPage({
  config,
  agentId,
  gagentsApiUrl,
}: AgentCapabilitiesPageProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Capacidades e Integrações</h2>
        <p className="text-sm text-muted-foreground">
          Configure o que este agente pode fazer e quais integrações ele utiliza.
        </p>
      </div>

      <Tabs defaultValue="capacidades">
        <TabsList>
          <TabsTrigger value="capacidades" className="flex items-center gap-1.5">
            <Blocks aria-hidden="true" className="h-3.5 w-3.5" />
            Capacidades
          </TabsTrigger>
          <TabsTrigger value="integracoes" className="flex items-center gap-1.5">
            <Plug aria-hidden="true" className="h-3.5 w-3.5" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="avancado" className="flex items-center gap-1.5">
            <Settings aria-hidden="true" className="h-3.5 w-3.5" />
            Avançado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="capacidades" className="mt-4">
          <CapabilitiesTab config={config} agentId={agentId} />
        </TabsContent>

        <TabsContent value="integracoes" className="mt-4">
          <IntegrationsTab config={config} agentId={agentId} />
        </TabsContent>

        <TabsContent value="avancado" className="mt-4">
          <AdvancedTab
            config={config}
            agentId={agentId}
            gagentsApiUrl={gagentsApiUrl}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
