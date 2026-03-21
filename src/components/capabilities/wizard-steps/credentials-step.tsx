'use client';

import { CheckCircle2, Loader2, AlertCircle, Shield } from "lucide-react";
import { Button, Input, Label } from "@greatapps/greatauth-ui/ui";
import type { IntegrationDefinition } from "../../../data/integrations-registry";
import type { WizardIntegrationMeta, OAuthStatus, OAuthResult } from "../types";

interface CredentialsStepProps {
  integration: IntegrationDefinition;
  meta: WizardIntegrationMeta;
  oauthStatus: OAuthStatus;
  oauthResult: OAuthResult | null;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onStartOAuth: () => void;
  isReconnect?: boolean;
}

export function CredentialsStep({
  integration,
  meta,
  oauthStatus,
  oauthResult,
  apiKey,
  onApiKeyChange,
  onStartOAuth,
  isReconnect = false,
}: CredentialsStepProps) {
  if (integration.authType === "oauth2") {
    return (
      <OAuthCredentials
        integration={integration}
        meta={meta}
        oauthStatus={oauthStatus}
        oauthResult={oauthResult}
        onStartOAuth={onStartOAuth}
        isReconnect={isReconnect}
      />
    );
  }

  return <ApiKeyCredentials apiKey={apiKey} onApiKeyChange={onApiKeyChange} />;
}

// ---------------------------------------------------------------------------
// OAuth flow UI
// ---------------------------------------------------------------------------

function OAuthCredentials({
  integration,
  meta,
  oauthStatus,
  oauthResult,
  onStartOAuth,
  isReconnect,
}: {
  integration: IntegrationDefinition;
  meta: WizardIntegrationMeta;
  oauthStatus: OAuthStatus;
  oauthResult: OAuthResult | null;
  onStartOAuth: () => void;
  isReconnect: boolean;
}) {
  const providerLabel = meta.providerLabel || integration.name;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Autenticação</h3>
        <p className="text-sm text-muted-foreground">
          {isReconnect
            ? `Reconecte sua conta ${providerLabel} para renovar a autorização.`
            : `Conecte sua conta ${providerLabel} para permitir o acesso.`}
        </p>
      </div>

      {/* OAuth status area */}
      <div className="flex flex-col items-center gap-4 rounded-lg border p-6">
        {oauthStatus === "idle" && (
          <Button onClick={onStartOAuth} size="lg" className="gap-2">
            {meta.icon}
            {isReconnect
              ? `Reconectar com ${providerLabel}`
              : `Conectar com ${providerLabel}`}
          </Button>
        )}

        {oauthStatus === "waiting" && (
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2
              aria-hidden="true"
              className="h-8 w-8 animate-spin text-muted-foreground"
            />
            <div>
              <p className="text-sm font-medium">Aguardando autorização...</p>
              <p className="text-xs text-muted-foreground">
                Complete o login na janela que foi aberta.
              </p>
            </div>
          </div>
        )}

        {oauthStatus === "success" && oauthResult && (
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2
              aria-hidden="true"
              className="h-8 w-8 text-green-600"
            />
            <div>
              <p className="text-sm font-medium text-green-700">
                Conectado com sucesso!
              </p>
              {oauthResult.email && (
                <p className="text-xs text-muted-foreground">
                  {oauthResult.email}
                </p>
              )}
            </div>
          </div>
        )}

        {oauthStatus === "error" && (
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle
              aria-hidden="true"
              className="h-8 w-8 text-destructive"
            />
            <div>
              <p className="text-sm font-medium text-destructive">
                Falha na conexão
              </p>
              {oauthResult?.error && (
                <p className="text-xs text-muted-foreground">
                  {oauthResult.error}
                </p>
              )}
            </div>
            <Button variant="outline" onClick={onStartOAuth} size="sm">
              Tentar novamente
            </Button>
          </div>
        )}
      </div>

      {/* Security note */}
      <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
        <Shield
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
        />
        <p className="text-xs text-muted-foreground">
          Seus dados estão seguros. Usamos OAuth 2.0 para autenticação — nunca
          armazenamos sua senha. Você pode revogar o acesso a qualquer momento
          nas configurações da sua conta {providerLabel}.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// API Key flow UI
// ---------------------------------------------------------------------------

function ApiKeyCredentials({
  apiKey,
  onApiKeyChange,
}: {
  apiKey: string;
  onApiKeyChange: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Autenticação</h3>
        <p className="text-sm text-muted-foreground">
          Insira a chave de API para conectar a integração.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="integration-api-key">Chave de API</Label>
        <Input
          id="integration-api-key"
          type="password"
          autoComplete="off"
          placeholder="Insira sua chave de API..."
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
        />
      </div>

      <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
        <Shield
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
        />
        <p className="text-xs text-muted-foreground">
          Sua chave de API é armazenada de forma segura e encriptada. Nunca é
          exposta no frontend.
        </p>
      </div>
    </div>
  );
}
