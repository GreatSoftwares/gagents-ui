/**
 * Types for the Integration Wizard flow.
 *
 * The wizard uses the base IntegrationDefinition from the integrations registry
 * and extends it with wizard-specific metadata via WizardIntegrationMeta.
 */

import type { IntegrationDefinition } from "../../data/integrations-registry";

// Re-export for convenience
export type { IntegrationDefinition };

// ---------------------------------------------------------------------------
// Wizard-specific metadata (passed alongside the registry definition)
// ---------------------------------------------------------------------------

export interface IntegrationCapability {
  label: string;
  description?: string;
}

export interface WizardIntegrationMeta {
  /** Icon as React node for the wizard header */
  icon?: React.ReactNode;
  /** Provider label for OAuth button (e.g. "Google") */
  providerLabel?: string;
  /** What this integration can do */
  capabilities: IntegrationCapability[];
  /** Required permissions / prerequisites */
  requirements: string[];
  /** Whether this integration has a config step */
  hasConfigStep: boolean;
}

// ---------------------------------------------------------------------------
// Wizard state types
// ---------------------------------------------------------------------------

export type WizardStep = "info" | "credentials" | "config" | "confirm";

export type OAuthStatus = "idle" | "waiting" | "success" | "error";

export interface OAuthResult {
  success: boolean;
  email?: string;
  error?: string;
  credentialId?: number;
}
