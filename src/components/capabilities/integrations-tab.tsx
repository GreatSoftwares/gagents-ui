'use client';

import type { GagentsHookConfig } from "../../hooks/types";
import { useIntegrationState, type IntegrationCardData } from "../../hooks/use-integrations";
import { IntegrationCard } from "./integration-card";
import { Plug, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface IntegrationsTabProps {
  config: GagentsHookConfig;
  agentId: number | null;
  /** Called when user clicks a card action (connect / configure / reconnect).
   *  The consuming app wires this to the wizard (Story 18.9). */
  onConnect: (card: IntegrationCardData) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IntegrationsTab({
  config,
  agentId,
  onConnect,
}: IntegrationsTabProps) {
  const { cards, isLoading } = useIntegrationState(config, agentId);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Empty state
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Plug className="h-10 w-10" />
        <p className="text-sm">Nenhuma integração disponível</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <IntegrationCard
          key={card.definition.slug}
          card={card}
          onConnect={onConnect}
        />
      ))}
    </div>
  );
}
