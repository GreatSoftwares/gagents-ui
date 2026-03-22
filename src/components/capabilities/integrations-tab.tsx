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
// Helpers
// ---------------------------------------------------------------------------

function getCardKey(card: IntegrationCardData): string {
  if (card.credentialId) {
    return `${card.definition.slug}-cred-${card.credentialId}`;
  }
  if (card.isAddNew) {
    return `${card.definition.slug}-add-new`;
  }
  return card.definition.slug;
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

  // Split into connected/expired cards and add-new/coming-soon cards
  const connectedCards = cards.filter(
    (c) => !c.isAddNew && (c.state === "connected" || c.state === "expired"),
  );
  const otherCards = cards.filter(
    (c) => c.isAddNew || c.state === "coming_soon",
  );

  return (
    <div className="space-y-6">
      {/* Connected accounts */}
      {connectedCards.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Contas conectadas
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {connectedCards.map((card) => (
              <IntegrationCard
                key={getCardKey(card)}
                card={card}
                onConnect={onConnect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add new / coming soon */}
      {otherCards.length > 0 && (
        <div>
          {connectedCards.length > 0 && (
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Adicionar integração
            </h3>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherCards.map((card) => (
              <IntegrationCard
                key={getCardKey(card)}
                card={card}
                onConnect={onConnect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
