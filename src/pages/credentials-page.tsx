import { useState } from "react";
import { useToolCredentials } from "../hooks";
import { ToolCredentialsForm } from "../components/tools/tool-credentials-form";
import { Button } from "@greatapps/greatauth-ui/ui";
import { Plus } from "lucide-react";
import type { GagentsHookConfig } from "../hooks/types";

export interface CredentialsPageProps {
  config: GagentsHookConfig;
  gagentsApiUrl: string;
  title?: string;
  subtitle?: string;
}

export function CredentialsPage({
  config,
  gagentsApiUrl,
  title = "Credenciais",
  subtitle = "Gerencie as credenciais de autenticação das ferramentas",
}: CredentialsPageProps) {
  const { data: credentialsData, isLoading: credentialsLoading } =
    useToolCredentials(config);
  const [createOpen, setCreateOpen] = useState(false);

  const credentials = credentialsData?.data || [];

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nova Credencial
        </Button>
      </div>

      <ToolCredentialsForm
        config={config}
        gagentsApiUrl={gagentsApiUrl}
        credentials={credentials}
        isLoading={credentialsLoading}
        createOpen={createOpen}
        onCreateOpenChange={setCreateOpen}
      />
    </div>
  );
}
