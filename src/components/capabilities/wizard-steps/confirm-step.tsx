'use client';

import { CheckCircle2 } from "lucide-react";
import { Label } from "@greatapps/greatauth-ui/ui";
import type { IntegrationDefinition } from "../../../data/integrations-registry";
import type { OAuthResult } from "../types";
import type { ConfigOption } from "./config-step";

interface ConfirmStepProps {
  integration: IntegrationDefinition;
  oauthResult: OAuthResult | null;
  selectedConfigOption: ConfigOption | null;
  enableOnComplete: boolean;
  onEnableChange: (enabled: boolean) => void;
}

export function ConfirmStep({
  integration,
  oauthResult,
  selectedConfigOption,
  enableOnComplete,
  onEnableChange,
}: ConfirmStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Confirmação</h3>
        <p className="text-sm text-muted-foreground">
          Revise as configurações antes de concluir.
        </p>
      </div>

      {/* Summary */}
      <div className="space-y-3 rounded-lg border p-4">
        <SummaryRow label="Integração" value={integration.name} />

        {oauthResult?.email && (
          <SummaryRow label="Conta conectada" value={oauthResult.email} />
        )}

        {selectedConfigOption && (
          <SummaryRow
            label={getConfigLabel(integration.slug)}
            value={selectedConfigOption.label}
          />
        )}

        <SummaryRow
          label="Tipo de autenticação"
          value={integration.authType === "oauth2" ? "OAuth 2.0" : "API Key"}
        />
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="enable-on-complete" className="text-sm font-medium">
            Ativar imediatamente
          </Label>
          <p className="text-xs text-muted-foreground">
            A integração ficará ativa assim que concluir o assistente.
          </p>
        </div>
        <button
          id="enable-on-complete"
          role="switch"
          type="button"
          aria-checked={enableOnComplete}
          onClick={() => onEnableChange(!enableOnComplete)}
          className={`
            relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
            transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-ring focus-visible:ring-offset-2
            ${enableOnComplete ? "bg-primary" : "bg-muted"}
          `}
        >
          <span
            aria-hidden="true"
            className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg
              ring-0 transition duration-200 ease-in-out
              ${enableOnComplete ? "translate-x-5" : "translate-x-0"}
            `}
          />
        </button>
      </div>

      {/* Success indicator */}
      <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 dark:bg-green-950/20">
        <CheckCircle2
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-green-600"
        />
        <p className="text-xs text-green-700 dark:text-green-400">
          Tudo pronto! Clique em &quot;Concluir&quot; para finalizar a
          configuração.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function getConfigLabel(slug: string): string {
  switch (slug) {
    case "google_calendar":
      return "Calendário";
    default:
      return "Configuração";
  }
}
