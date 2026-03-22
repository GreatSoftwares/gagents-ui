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
  Plus,
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
  Plus,
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

function getActionLabel(card: IntegrationCardData): string {
  if (card.isAddNew) return "Conectar";
  switch (card.state) {
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
  const { definition, state, sharedByAgentsCount, isAddNew, accountLabel } = card;
  const Icon = resolveIcon(definition.icon);
  const isComingSoon = state === "coming_soon";
  const actionLabel = getActionLabel(card);

  // "Add new" card uses a muted/outlined style
  if (isAddNew) {
    return (
      <div
        className={cn(
          "group relative flex flex-col gap-3 rounded-xl border border-dashed bg-card/50 p-5 transition-shadow",
          "hover:shadow-md hover:border-solid hover:bg-card cursor-pointer",
        )}
        role="button"
        tabIndex={0}
        aria-label={`Adicionar conta ${definition.name}`}
        onClick={() => onConnect(card)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onConnect(card);
          }
        }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary/60">
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
            Adicionar
          </Badge>
        </div>

        {/* Name + description */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold leading-tight text-muted-foreground">
            {definition.name}
          </h3>
          <p className="text-xs text-muted-foreground/70 leading-relaxed flex items-center gap-1">
            <Plus className="h-3 w-3" />
            Adicionar conta
          </p>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-end pt-1">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onConnect(card);
            }}
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    );
  }

  // Connected / expired / available card
  const badge = STATE_BADGES[state];

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
      aria-label={`${definition.name}${accountLabel ? ` — ${accountLabel}` : ""} — ${badge.label}`}
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

      {/* Name + account label */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold leading-tight">{definition.name}</h3>
        {accountLabel ? (
          <p className="text-xs text-muted-foreground leading-relaxed truncate" title={accountLabel}>
            {accountLabel}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {definition.description}
          </p>
        )}
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
