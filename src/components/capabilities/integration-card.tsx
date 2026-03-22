'use client';

import { useState } from "react";
import type { IntegrationCardData, IntegrationCardState } from "../../hooks/use-integrations";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@greatapps/greatauth-ui/ui";
import {
  CalendarSync,
  Plug,
  Settings,
  RefreshCw,
  Clock,
  Plus,
  MoreVertical,
  Unplug,
  Trash2,
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface IntegrationCardProps {
  card: IntegrationCardData;
  onConnect: (card: IntegrationCardData) => void;
  onReconnect?: (card: IntegrationCardData) => void;
  onDisconnect?: (card: IntegrationCardData) => void;
  onDelete?: (card: IntegrationCardData) => void;
}

export function IntegrationCard({
  card,
  onConnect,
  onReconnect,
  onDisconnect,
  onDelete,
}: IntegrationCardProps) {
  const { definition, state, isAddNew, accountLabel } = card;
  const Icon = resolveIcon(definition.icon);
  const isComingSoon = state === "coming_soon";
  const isConnected = state === "connected" || state === "expired";

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // "Add new" card — clean outline style with single "Conectar" button
  if (isAddNew) {
    return (
      <div
        className={cn(
          "group relative flex flex-col gap-3 rounded-xl border bg-card/50 p-5 transition-all",
          "hover:shadow-md hover:bg-card cursor-pointer",
        )}
        role="button"
        tabIndex={0}
        aria-label={`Conectar ${definition.name}`}
        onClick={() => onConnect(card)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onConnect(card);
          }
        }}
      >
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary/60">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <h3 className="text-sm font-semibold leading-tight text-foreground">
              {definition.name}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Conectar nova conta
            </p>
          </div>
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
            Conectar
          </Button>
        </div>
      </div>
    );
  }

  // Coming soon card
  if (isComingSoon) {
    const badge = STATE_BADGES[state];
    return (
      <div
        className="group relative flex flex-col gap-3 rounded-xl border bg-card p-5 opacity-60 cursor-default"
        aria-disabled
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant="outline" className={cn("text-xs", badge.className)}>
            {badge.label}
          </Badge>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold leading-tight">{definition.name}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {definition.description}
          </p>
        </div>
      </div>
    );
  }

  // Connected / expired card
  const badge = STATE_BADGES[state];

  return (
    <>
      <div
        className="group relative flex flex-col gap-3 rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <h3 className="text-sm font-semibold leading-tight">{definition.name}</h3>
              {accountLabel && (
                <p className="text-xs text-muted-foreground leading-relaxed truncate" title={accountLabel}>
                  {accountLabel}
                </p>
              )}
            </div>
          </div>
          <Badge variant="outline" className={cn("text-xs shrink-0", badge.className)}>
            {badge.label}
          </Badge>
        </div>

        {/* Footer with "Configurar" dropdown */}
        <div className="mt-auto flex items-center justify-end gap-2 pt-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
              >
                <Settings className="h-3.5 w-3.5" />
                Configurar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onReconnect?.(card)}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reconectar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDisconnect?.(card)}
                className="gap-2"
              >
                <Unplug className="h-4 w-4" />
                Desconectar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover integração?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação vai remover a credencial
              {accountLabel ? ` (${accountLabel})` : ""} de {definition.name}.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.(card);
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
