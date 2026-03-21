'use client';

import { Check, Info } from "lucide-react";
import type { IntegrationDefinition } from "../../../data/integrations-registry";
import type { WizardIntegrationMeta } from "../types";

interface InfoStepProps {
  integration: IntegrationDefinition;
  meta: WizardIntegrationMeta;
}

export function InfoStep({ integration, meta }: InfoStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {meta.icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
            {meta.icon}
          </div>
        )}
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{integration.name}</h3>
          <p className="text-sm text-muted-foreground">
            {integration.description}
          </p>
        </div>
      </div>

      {/* Capabilities */}
      {meta.capabilities.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">O que esta integração permite:</h4>
          <ul className="space-y-2">
            {meta.capabilities.map((cap, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
                />
                <div>
                  <span className="font-medium">{cap.label}</span>
                  {cap.description && (
                    <span className="text-muted-foreground">
                      {" "}
                      — {cap.description}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Requirements */}
      {meta.requirements.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Requisitos:</h4>
          <ul className="space-y-2">
            {meta.requirements.map((req, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <Info
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-blue-500"
                />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
