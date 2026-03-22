'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from "@greatapps/greatauth-ui/ui";
import { Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";

import type { GagentsHookConfig } from "../../hooks/types";
import type { IntegrationDefinition } from "../../data/integrations-registry";
import type {
  WizardIntegrationMeta,
  OAuthResult,
  OAuthStatus,
  WizardStep,
} from "./types";
import { InfoStep } from "./wizard-steps/info-step";
import { CredentialsStep } from "./wizard-steps/credentials-step";
import { ConfigStep, type ConfigOption } from "./wizard-steps/config-step";
import { ConfirmStep } from "./wizard-steps/confirm-step";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS: WizardStep[] = ["info", "credentials", "config", "confirm"];

const STEP_LABELS: Record<WizardStep, string> = {
  info: "Informação",
  credentials: "Credenciais",
  config: "Configuração",
  confirm: "Confirmação",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface IntegrationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Base integration definition from registry */
  integration: IntegrationDefinition;
  /** Wizard-specific metadata (capabilities, requirements, etc.) */
  meta: WizardIntegrationMeta;
  agentId: string | number;
  config: GagentsHookConfig;
  onComplete: () => void;
  /** gagents-r3-api base URL (used to build OAuth URLs) */
  gagentsApiUrl: string;
  /**
   * Existing credential ID -- when set, the wizard opens in edit mode
   * (step 2 shows "Reconectar" and step 3 is pre-filled).
   */
  existingCredentialId?: number;
  /**
   * Callback to load config options after OAuth completes.
   * e.g. load Google Calendar list. Returns ConfigOption[].
   */
  loadConfigOptions?: (credentialId: number) => Promise<ConfigOption[]>;
  /**
   * Existing config value to pre-fill the config step in edit/reconnect mode.
   */
  existingConfigValue?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IntegrationWizard({
  open,
  onOpenChange,
  integration,
  meta,
  agentId: _agentId,
  config,
  onComplete,
  gagentsApiUrl,
  existingCredentialId,
  loadConfigOptions,
  existingConfigValue,
}: IntegrationWizardProps) {
  const isReconnect = !!existingCredentialId;

  // Step navigation
  const [currentStep, setCurrentStep] = useState<WizardStep>("info");
  const currentIndex = STEPS.indexOf(currentStep);

  // OAuth state
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus>("idle");
  const [oauthResult, setOauthResult] = useState<OAuthResult | null>(null);
  const popupRef = useRef<Window | null>(null);
  const popupPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // API Key state
  const [apiKey, setApiKey] = useState("");

  // Config state
  const [configOptions, setConfigOptions] = useState<ConfigOption[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [selectedConfigValue, setSelectedConfigValue] = useState("");

  // Confirm state
  const [enableOnComplete, setEnableOnComplete] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clean up popup poll interval on unmount
  useEffect(() => {
    return () => {
      if (popupPollRef.current) {
        clearInterval(popupPollRef.current);
      }
    };
  }, []);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep("info");
      setOauthStatus("idle");
      setOauthResult(null);
      setApiKey("");
      setConfigOptions([]);
      setConfigLoading(false);
      setSelectedConfigValue(existingConfigValue ?? "");
      setEnableOnComplete(true);
      setIsSubmitting(false);
    } else {
      // Close any lingering popup
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      // Clear popup poll interval
      if (popupPollRef.current) {
        clearInterval(popupPollRef.current);
        popupPollRef.current = null;
      }
    }
  }, [open]);

  // -----------------------------------------------------------------------
  // OAuth popup message listener
  // -----------------------------------------------------------------------

  const handleOAuthMessage = useCallback(
    (event: MessageEvent) => {
      // Validate origin against gagents API URL
      try {
        if (event.origin !== new URL(gagentsApiUrl).origin) return;
      } catch {
        return;
      }

      // Only accept messages from our popup -- check for known data shape
      if (!event.data || typeof event.data !== "object") return;
      const msg = event.data as {
        type?: string;
        success?: boolean;
        email?: string;
        error?: string;
        credentialId?: number;
      };

      if (msg.type !== "oauth-callback") return;

      if (msg.success) {
        setOauthStatus("success");
        setOauthResult({
          success: true,
          email: msg.email,
          credentialId: msg.credentialId,
        });

        // Auto-load config options if available
        const credId = msg.credentialId || existingCredentialId;
        if (credId && loadConfigOptions && meta.hasConfigStep) {
          setConfigLoading(true);
          loadConfigOptions(credId)
            .then((opts) => {
              setConfigOptions(opts);
              if (opts.length === 1) {
                setSelectedConfigValue(opts[0].id);
              }
            })
            .catch(() => setConfigOptions([]))
            .finally(() => setConfigLoading(false));
        }

        // Auto-advance to next step after a brief delay
        setTimeout(() => {
          setCurrentStep(meta.hasConfigStep ? "config" : "confirm");
        }, 1200);
      } else {
        setOauthStatus("error");
        setOauthResult({
          success: false,
          error: msg.error || "Falha na autorização",
        });
      }
    },
    [gagentsApiUrl, existingCredentialId, meta.hasConfigStep, loadConfigOptions],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [open, handleOAuthMessage]);

  // -----------------------------------------------------------------------
  // OAuth start
  // -----------------------------------------------------------------------

  async function startOAuth() {
    const { language = "pt-br", idWl = 1, accountId, token } = config;

    setOauthStatus("waiting");

    try {
      // 1. Get auth URL from backend
      // If reconnecting an existing credential, pass credential_id so the
      // backend updates that specific credential instead of creating a new one.
      let authorizeUrl = `${gagentsApiUrl}/v1/${language}/${idWl}/accounts/${accountId}/oauth/authorize/${integration.slug}`;
      if (existingCredentialId) {
        authorizeUrl += `?credential_id=${existingCredentialId}`;
      }
      const response = await fetch(authorizeUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (result.status !== 1 || !result.data?.auth_url) {
        setOauthStatus("error");
        setOauthResult({
          success: false,
          error: result.message || "Erro ao obter URL de autorização",
        });
        return;
      }

      // 2. Open auth URL in popup
      const popup = window.open(
        result.data.auth_url,
        "oauth-popup",
        "width=500,height=600,scrollbars=yes,resizable=yes",
      );
      popupRef.current = popup;

      // Poll for popup closed without completing
      if (popup) {
        if (popupPollRef.current) {
          clearInterval(popupPollRef.current);
        }
        popupPollRef.current = setInterval(() => {
          if (popup.closed) {
            if (popupPollRef.current) {
              clearInterval(popupPollRef.current);
              popupPollRef.current = null;
            }
            setOauthStatus((prev) =>
              prev === "waiting" ? "error" : prev,
            );
            setOauthResult((prev) =>
              prev === null
                ? { success: false, error: "Janela fechada antes de concluir" }
                : prev,
            );
          }
        }, 500);
      }
    } catch (err) {
      setOauthStatus("error");
      setOauthResult({
        success: false,
        error: "Erro de rede ao obter URL de autorização",
      });
    }
  }

  // -----------------------------------------------------------------------
  // Navigation
  // -----------------------------------------------------------------------

  function canAdvance(): boolean {
    switch (currentStep) {
      case "info":
        return true;
      case "credentials":
        if (integration.authType === "oauth2") {
          return oauthStatus === "success";
        }
        return apiKey.trim().length > 0;
      case "config":
        // Config step is optional -- can always advance
        return true;
      case "confirm":
        return true;
      default:
        return false;
    }
  }

  function goNext() {
    if (!canAdvance()) return;

    // Skip config step if not needed
    if (currentStep === "credentials" && !meta.hasConfigStep) {
      setCurrentStep("confirm");
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  }

  function goPrev() {
    // Skip config step backwards if not needed
    if (currentStep === "confirm" && !meta.hasConfigStep) {
      setCurrentStep("credentials");
      return;
    }

    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  }

  // -----------------------------------------------------------------------
  // Complete
  // -----------------------------------------------------------------------

  async function handleComplete() {
    setIsSubmitting(true);
    try {
      // The actual credential creation happened during OAuth callback
      // or will happen via API key submission. Here we just finalize.
      //
      // For OAuth, the credential was already created by the backend callback.
      // The parent component handles any additional linking (agent_tool creation)
      // via the onComplete callback.

      onComplete();
      onOpenChange(false);
      toast.success(
        `${integration.name} ${isReconnect ? "reconectado" : "configurado"} com sucesso!`,
      );
    } catch {
      toast.error("Erro ao finalizar configuração");
    } finally {
      setIsSubmitting(false);
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const selectedConfigOption =
    configOptions.find((o) => o.id === selectedConfigValue) || null;

  const isLastStep = currentStep === "confirm";

  // Effective steps (may skip config)
  const effectiveSteps = meta.hasConfigStep
    ? STEPS
    : STEPS.filter((s) => s !== "config");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{integration.name}</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <StepIndicator steps={effectiveSteps} currentStep={currentStep} />

        {/* Step content */}
        <div className="min-h-[280px] py-2">
          {currentStep === "info" && (
            <InfoStep
              integration={integration}
              meta={meta}
            />
          )}
          {currentStep === "credentials" && (
            <CredentialsStep
              integration={integration}
              meta={meta}
              oauthStatus={oauthStatus}
              oauthResult={oauthResult}
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
              onStartOAuth={startOAuth}
              isReconnect={isReconnect}
            />
          )}
          {currentStep === "config" && (
            <ConfigStep
              integration={integration}
              options={configOptions}
              isLoading={configLoading}
              selectedValue={selectedConfigValue}
              onValueChange={setSelectedConfigValue}
            />
          )}
          {currentStep === "confirm" && (
            <ConfirmStep
              integration={integration}
              oauthResult={oauthResult}
              selectedConfigOption={selectedConfigOption}
              enableOnComplete={enableOnComplete}
              onEnableChange={setEnableOnComplete}
            />
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div>
            {currentStep === "info" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={goPrev}
                className="gap-1"
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                Voltar
              </Button>
            )}
          </div>
          <div>
            {isLastStep ? (
              <Button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
                className="gap-1"
              >
                {isSubmitting ? (
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                ) : (
                  <Check aria-hidden="true" className="h-4 w-4" />
                )}
                Concluir
              </Button>
            ) : (
              <Button
                type="button"
                onClick={goNext}
                disabled={!canAdvance()}
                className="gap-1"
              >
                Continuar
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({
  steps,
  currentStep,
}: {
  steps: WizardStep[];
  currentStep: WizardStep;
}) {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div
      className="flex items-center justify-center gap-1 py-2"
      role="list"
      aria-label="Passos do assistente"
    >
      {steps.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = step === currentStep;

        return (
          <div key={step} className="flex items-center" role="listitem">
            {/* Circle */}
            <div
              className={`
                flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium
                transition-colors duration-200
                ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-green-600 text-white"
                      : "bg-muted text-muted-foreground"
                }
              `}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`${STEP_LABELS[step]}${isCompleted ? " (concluído)" : isCurrent ? " (atual)" : ""}`}
            >
              {isCompleted ? (
                <Check aria-hidden="true" className="h-3.5 w-3.5" />
              ) : (
                i + 1
              )}
            </div>
            {/* Label */}
            <span
              className={`
                ml-1.5 hidden text-xs sm:inline
                ${isCurrent ? "font-medium text-foreground" : "text-muted-foreground"}
              `}
            >
              {STEP_LABELS[step]}
            </span>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={`
                  mx-2 h-px w-6
                  ${i < currentIndex ? "bg-green-600" : "bg-border"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
