'use client';

import { Loader2 } from "lucide-react";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@greatapps/greatauth-ui/ui";
import type { IntegrationDefinition } from "../../../data/integrations-registry";

export interface ConfigOption {
  id: string;
  label: string;
  description?: string;
}

interface ConfigStepProps {
  integration: IntegrationDefinition;
  /** Available options loaded from backend (e.g. calendars) */
  options: ConfigOption[];
  isLoading: boolean;
  selectedValue: string;
  onValueChange: (value: string) => void;
  /** Custom label for the select dropdown */
  selectLabel?: string;
  /** Custom placeholder */
  selectPlaceholder?: string;
}

export function ConfigStep({
  integration,
  options,
  isLoading,
  selectedValue,
  onValueChange,
  selectLabel,
  selectPlaceholder,
}: ConfigStepProps) {
  const label = selectLabel || getDefaultLabel(integration.slug);
  const placeholder =
    selectPlaceholder || getDefaultPlaceholder(integration.slug);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Configuração</h3>
        <p className="text-sm text-muted-foreground">
          Configure as opções específicas da integração.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2
            aria-hidden="true"
            className="h-6 w-6 animate-spin text-muted-foreground"
          />
          <p className="text-sm text-muted-foreground">
            Carregando opções...
          </p>
        </div>
      ) : options.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma opção disponível. A configuração padrão será usada.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="integration-config-select">{label}</Label>
          <Select value={selectedValue} onValueChange={onValueChange}>
            <SelectTrigger id="integration-config-select">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  <span>{opt.label}</span>
                  {opt.description && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({opt.description})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDefaultLabel(slug: string): string {
  switch (slug) {
    case "google_calendar":
      return "Calendário";
    default:
      return "Opção";
  }
}

function getDefaultPlaceholder(slug: string): string {
  switch (slug) {
    case "google_calendar":
      return "Selecione o calendário...";
    default:
      return "Selecione uma opção...";
  }
}
