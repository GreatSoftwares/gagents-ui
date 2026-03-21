'use client';

import type { IntegrationCardData, IntegrationCardState } from "../../hooks/use-integrations";
import { Badge, Button, Tooltip, TooltipContent, TooltipTrigger } from "@greatapps/greatauth-ui/ui";
import {
  CalendarSync,
  Plug,
  Settings,
  RefreshCw,
  Users,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib";

// ---------------------------------------------------------------------------
// Icon mapping — extend as new integrations are added
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  CalendarSync,
  Plug,
  Settings,
  RefreshCw,
  Users,
  Clock,
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Plug;
}

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

interface BadgeVariant {
  label: string;
  className: string;
}

const STATE_BADGES: Record<IntegrationCardState, BadgeVariant> = {
  available: {
    label: "Disponível",
    className: "bg-muted text-muted-foreground",
  },
  connected: {
    label: "Conectado",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  expired: {
    label: "Expirado",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  coming_soon: {
    label: "Em breve",
    className: "bg-muted text-muted-foreground",
  },
};

function getActionLabel(state: IntegrationCardState): string {
  switch (state) {
    case "available":
      return "Conectar";
    case "connected":
      return "Configurar";
    case "expired":
      return "Reconectar";
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface IntegrationCardProps {
  card: IntegrationCardData;
  onConnect: (card: IntegrationCardData) => void;
}

export function IntegrationCard({ card, onConnect }: IntegrationCardProps) {
  const { definition, state, sharedByAgentsCount } = card;
  const Icon = resolveIcon(definition.icon);
  const badge = STATE_BADGES[state];
  const actionLabel = getActionLabel(state);
  const isComingSoon = state === "coming_soon";

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border bg-card p-5 transition-shadow",
        isComingSoon
          ? "opacity-60 cursor-default"
          : "hover:shadow-md cursor-pointer",
      )}
      role="button"
      tabIndex={isComingSoon ? -1 : 0}
      aria-label={`${definition.name} — ${badge.label}`}
      aria-disabled={isComingSoon}
      onClick={() => !isComingSoon && onConnect(card)}
      onKeyDown={(e) => {
        if (!isComingSoon && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onConnect(card);
        }
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <Badge variant="outline" className={cn("text-xs", badge.className)}>
          {badge.label}
        </Badge>
      </div>

      {/* Name + description */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold leading-tight">{definition.name}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {definition.description}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        {sharedByAgentsCount > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                <Users className="h-3.5 w-3.5" />
                Compartilhada
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Esta credencial está disponível para todos os agentes da conta
            </TooltipContent>
          </Tooltip>
        ) : (
          <span />
        )}

        {!isComingSoon && (
          <Button
            variant={state === "expired" ? "destructive" : "outline"}
            size="sm"
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onConnect(card);
            }}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
