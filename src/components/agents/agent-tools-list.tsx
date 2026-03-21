import { useState } from "react";
import type { Agent, AgentTool, Tool, ToolCredential } from "../../types";
import type { GagentsHookConfig } from "../../hooks/types";
import {
  useAgentTools,
  useAddAgentTool,
  useRemoveAgentTool,
  useUpdateAgentTool,
} from "../../hooks";
import { useTools } from "../../hooks";
import { useToolCredentials } from "../../hooks";
import {
  Switch,
  Badge,
  Button,
  Skeleton,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Input,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@greatapps/greatauth-ui/ui";
import {
  Trash2,
  Plus,
  Wrench,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

interface AgentToolsListProps {
  agent: Agent;
  config: GagentsHookConfig;
}

export function AgentToolsList({ agent, config }: AgentToolsListProps) {
  const { data: agentToolsData, isLoading } = useAgentTools(config, agent.id);
  const { data: allToolsData } = useTools(config);
  const addMutation = useAddAgentTool(config);
  const removeMutation = useRemoveAgentTool(config);
  const updateMutation = useUpdateAgentTool(config);

  const [removeTarget, setRemoveTarget] = useState<AgentTool | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [configTarget, setConfigTarget] = useState<AgentTool | null>(null);
  const [configInstructions, setConfigInstructions] = useState("");
  const [configCredentialId, setConfigCredentialId] = useState<string>("");

  const { data: credentialsData } = useToolCredentials(config);
  const allCredentials: ToolCredential[] = credentialsData?.data || [];

  const agentTools = agentToolsData?.data || [];
  const allTools = (allToolsData?.data || []).filter((t: Tool) => !t.slug?.startsWith("gclinic_"));
  const assignedToolIds = new Set(agentTools.map((at) => at.id_tool));
  // Filter out internal gclinic_* tools from assigned tools display
  const visibleAgentTools = agentTools.filter((at) => {
    const tool = allTools.find((t: Tool) => t.id === at.id_tool);
    return !tool || !tool.slug?.startsWith("gclinic_");
  });
  const availableTools = allTools.filter((t: Tool) => !assignedToolIds.has(t.id));
  const filteredAvailable = availableTools.filter((t: Tool) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  function getToolInfo(idTool: number): Tool | undefined {
    return allTools.find((t) => t.id === idTool);
  }

  async function handleToggleEnabled(agentTool: AgentTool, checked: boolean) {
    try {
      await updateMutation.mutateAsync({
        idAgent: agent.id,
        id: agentTool.id,
        body: { enabled: checked },
      });
      toast.success(checked ? "Ferramenta ativada" : "Ferramenta desativada");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao alterar estado da ferramenta",
      );
    }
  }

  async function handleAdd(tool: Tool) {
    try {
      await addMutation.mutateAsync({
        idAgent: agent.id,
        body: { id_tool: tool.id },
      });
      toast.success("Ferramenta adicionada");
      setAddOpen(false);
      setSearch("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao adicionar ferramenta",
      );
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    try {
      await removeMutation.mutateAsync({
        idAgent: agent.id,
        id: removeTarget.id,
      });
      toast.success("Ferramenta removida");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao remover ferramenta",
      );
    } finally {
      setRemoveTarget(null);
    }
  }

  function openConfig(agentTool: AgentTool) {
    setConfigTarget(agentTool);
    setConfigInstructions(agentTool.custom_instructions || "");
    setConfigCredentialId(agentTool.id_tool_credential ? String(agentTool.id_tool_credential) : "");
  }

  async function handleSaveConfig() {
    if (!configTarget) return;
    try {
      const newCredentialId = configCredentialId ? parseInt(configCredentialId, 10) : null;
      await updateMutation.mutateAsync({
        idAgent: agent.id,
        id: configTarget.id,
        body: {
          custom_instructions: configInstructions.trim() || null,
          id_tool_credential: newCredentialId,
        },
      });
      toast.success("Configuração atualizada");
      setConfigTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar configuração",
      );
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {visibleAgentTools.length} ferramenta{visibleAgentTools.length !== 1 ? "s" : ""} associada{visibleAgentTools.length !== 1 ? "s" : ""}
        </h3>
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" disabled={availableTools.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Ferramenta
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            <div className="p-2">
              <Input
                placeholder="Buscar ferramenta\u2026"
                aria-label="Buscar ferramenta"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredAvailable.length === 0 ? (
                <p className="p-3 text-center text-sm text-muted-foreground">
                  Nenhuma ferramenta disponível
                </p>
              ) : (
                filteredAvailable.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => handleAdd(tool)}
                    disabled={addMutation.isPending}
                  >
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 font-medium">{tool.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {tool.type}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {visibleAgentTools.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Wrench className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhuma ferramenta associada. Clique em &apos;Adicionar Ferramenta&apos; para começar.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleAgentTools.map((agentTool) => {
            const tool = getToolInfo(agentTool.id_tool);
            return (
              <div
                key={agentTool.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {tool?.name || `Ferramenta #${agentTool.id_tool}`}
                    </span>
                    {tool?.type && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {tool.type}
                      </Badge>
                    )}
                  </div>
                  {agentTool.custom_instructions && (
                    <p className="truncate text-xs text-muted-foreground">
                      {agentTool.custom_instructions}
                    </p>
                  )}
                </div>

                <Switch
                  aria-label="Ativar/Desativar"
                  checked={agentTool.enabled}
                  onCheckedChange={(checked) =>
                    handleToggleEnabled(agentTool, checked)
                  }
                  disabled={updateMutation.isPending}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Configurar"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => openConfig(agentTool)}
                  title="Configurar instruções"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remover"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setRemoveTarget(agentTool)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Config dialog for custom_instructions */}
      <Dialog
        open={!!configTarget}
        onOpenChange={(open) => !open && setConfigTarget(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Instruções da Ferramenta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {configTarget && getToolInfo(configTarget.id_tool)?.type !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="tool-credential">Credencial</Label>
                <Select
                  value={configCredentialId || undefined}
                  onValueChange={(val) => setConfigCredentialId(val === "__none__" ? "" : val)}
                >
                  <SelectTrigger id="tool-credential">
                    <SelectValue placeholder="Selecione uma credencial (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhuma (automático)</SelectItem>
                    {allCredentials
                      .filter((c) => configTarget && c.id_tool === configTarget.id_tool && c.status === "active")
                      .map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.label || `Credencial #${c.id}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Vincule uma credencial específica a esta ferramenta neste agente.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="tool-instructions">Instruções Personalizadas</Label>
              <Textarea
                id="tool-instructions"
                name="instructions"
                value={configInstructions}
                onChange={(e) => setConfigInstructions(e.target.value)}
                placeholder="Instru\u00e7\u00f5es sobre como e quando o agente deve usar esta ferramenta\u2026"
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Este texto é adicionado ao prompt do agente para orientar o uso da ferramenta.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfigTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={updateMutation.isPending}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover ferramenta?</AlertDialogTitle>
            <AlertDialogDescription>
              A ferramenta será desassociada deste agente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removeMutation.isPending}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
