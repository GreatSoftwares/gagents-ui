import { useState, useRef, useCallback, useEffect } from "react";
import type { Agent, PromptVersion, Objective, AgentTool, Tool } from "../../types";
import type { GagentsHookConfig } from "../../hooks/types";
import { usePromptVersions } from "../../hooks";
import { useUpdateAgent } from "../../hooks";
import { useAgentTools } from "../../hooks";
import { useObjectives } from "../../hooks";
import { useTools } from "../../hooks";
import { Button, Input, Skeleton, Badge } from "@greatapps/greatauth-ui/ui";
import { FileText, Loader2, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface AgentPromptEditorProps {
  config: GagentsHookConfig;
  agent: Agent;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function computeDiff(
  oldText: string,
  newText: string,
): { type: "added" | "removed" | "equal"; line: string }[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const result: { type: "added" | "removed" | "equal"; line: string }[] = [];
  const maxLen = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLen; i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : undefined;
    const newLine = i < newLines.length ? newLines[i] : undefined;

    if (oldLine === newLine) {
      result.push({ type: "equal", line: newLine! });
    } else {
      if (oldLine !== undefined) {
        result.push({ type: "removed", line: oldLine });
      }
      if (newLine !== undefined) {
        result.push({ type: "added", line: newLine });
      }
    }
  }

  return result;
}

function buildPreview(
  promptText: string,
  objectives: Objective[],
  agentTools: AgentTool[],
  allTools: Tool[],
): string {
  let preview = promptText;

  const activeObjectives = objectives.filter((o) => o.active);
  if (activeObjectives.length > 0) {
    preview += "\n\n[SKILLS DISPONÍVEIS]\n";
    for (const obj of activeObjectives) {
      preview += `- ${obj.title}`;
      if (obj.prompt) preview += `: ${obj.prompt}`;
      preview += "\n";
    }
  }

  const enabledAgentTools = agentTools.filter((at) => at.enabled);
  if (enabledAgentTools.length > 0) {
    const toolMap = new Map(allTools.map((t) => [t.id, t]));
    preview += "\n[TOOLS DISPONÍVEIS]\n";
    for (const at of enabledAgentTools) {
      const tool = toolMap.get(at.id_tool);
      const name = tool?.name || `Tool #${at.id_tool}`;
      const desc = tool?.description ? `: ${tool.description}` : "";
      preview += `- ${name}${desc}`;
      if (at.custom_instructions) {
        preview += `\n  Instruções: ${at.custom_instructions}`;
      }
      preview += "\n";
    }
  }

  return preview;
}

export function AgentPromptEditor({ config, agent }: AgentPromptEditorProps) {
  const { data: versionsData, isLoading } = usePromptVersions(config, agent.id);
  const updateAgent = useUpdateAgent(config);
  const { data: objectivesData } = useObjectives(config, agent.id);
  const { data: agentToolsData } = useAgentTools(config, agent.id);
  const { data: toolsData } = useTools(config);

  const [trackedAgentId, setTrackedAgentId] = useState(agent.id);
  const [promptText, setPromptText] = useState(agent.prompt || "");
  const [changeNotes, setChangeNotes] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset prompt text when agent changes
  if (trackedAgentId !== agent.id) {
    setTrackedAgentId(agent.id);
    setPromptText(agent.prompt || "");
    setCompareVersionId(null);
  }

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(300, el.scrollHeight)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [promptText, autoResize]);

  // Tab key support
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const value = el.value;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      setPromptText(newValue);
      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    }
  }

  const versions = versionsData?.data || [];
  const sortedVersions = [...versions].sort(
    (a: PromptVersion, b: PromptVersion) =>
      new Date(b.datetime_add).getTime() - new Date(a.datetime_add).getTime(),
  );

  const currentVersion = sortedVersions.length > 0 ? sortedVersions[0] : null;
  const compareVersion = sortedVersions.find((v) => v.id === compareVersionId);

  // Diff: always compare selected older version against current
  const diffLines =
    currentVersion && compareVersion && compareVersion.id !== currentVersion.id
      ? computeDiff(compareVersion.prompt_content ?? "", currentVersion.prompt_content ?? "")
      : null;

  async function handleSave() {
    const body: Record<string, unknown> = {
      prompt: promptText.trim(),
    };
    if (changeNotes.trim()) {
      body.change_notes = changeNotes.trim();
    }

    try {
      await updateAgent.mutateAsync({ id: agent.id, body });
      setChangeNotes("");
      toast.success("Prompt salvo com sucesso");
    } catch {
      toast.error("Erro ao salvar prompt");
    }
  }

  function handleRestore(version: PromptVersion) {
    setPromptText(version.prompt_content ?? "");
    setChangeNotes(`Restaurado da v${version.version_number}`);
    toast.info("Prompt restaurado no editor. Clique em Salvar para confirmar.");
  }

  const charCount = promptText.length;
  const tokenEstimate = Math.ceil(charCount / 4);

  const objectives = objectivesData?.data || [];
  const agentTools = agentToolsData?.data || [];
  const allTools = toolsData?.data || [];
  const previewText = buildPreview(promptText, objectives, agentTools, allTools);

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
    <div className="flex flex-col gap-4 p-4 lg:flex-row">
      {/* Editor section */}
      <div className="min-w-0 flex-1 space-y-4">
        {/* Textarea */}
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva o prompt do sistema aqui..."
            disabled={updateAgent.isPending}
            className="w-full resize-none rounded-lg border bg-background p-3 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            style={{ minHeight: "300px" }}
          />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{charCount.toLocaleString("pt-BR")} caracteres</span>
            <span>·</span>
            <span>~{tokenEstimate.toLocaleString("pt-BR")} tokens</span>
          </div>
        </div>

        {/* Save row */}
        <div className="flex items-center gap-3">
          <Input
            value={changeNotes}
            onChange={(e) => setChangeNotes(e.target.value)}
            placeholder="O que mudou? (opcional)"
            disabled={updateAgent.isPending}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
            }}
          />
          <Button
            onClick={handleSave}
            disabled={updateAgent.isPending || !promptText.trim()}
          >
            {updateAgent.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar
          </Button>
        </div>

        {/* Preview section */}
        <div className="rounded-lg border">
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Preview do prompt final</span>
            {showPreview ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {showPreview && (
            <div className="border-t px-4 py-3">
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {previewText.split("\n").map((line, i) => {
                  const isSection =
                    line.startsWith("[SKILLS DISPONÍVEIS]") ||
                    line.startsWith("[TOOLS DISPONÍVEIS]");
                  return (
                    <span
                      key={i}
                      className={isSection ? "font-semibold text-muted-foreground" : ""}
                    >
                      {line}
                      {"\n"}
                    </span>
                  );
                })}
              </pre>
            </div>
          )}
        </div>

        {/* Diff panel (when comparing) */}
        {diffLines && compareVersion && currentVersion && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                Diferenças: v{compareVersion.version_number} → v{currentVersion.version_number} (actual)
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCompareVersionId(null)}
                className="text-xs"
              >
                Fechar
              </Button>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg border font-mono text-sm">
              {diffLines.map((line, i) => (
                <div
                  key={i}
                  className={`whitespace-pre-wrap px-3 py-0.5 ${
                    line.type === "added"
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : line.type === "removed"
                        ? "bg-red-500/10 text-red-700 dark:text-red-400"
                        : ""
                  }`}
                >
                  <span className="mr-2 inline-block w-4 select-none text-muted-foreground">
                    {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                  </span>
                  {line.line || " "}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeline section (right) */}
      <div className="w-full space-y-2 lg:w-80 lg:shrink-0">
        <h3 className="text-sm font-medium text-muted-foreground">
          Histórico de Versões
        </h3>
        {sortedVersions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma versão encontrada. Salve o prompt para criar a primeira versão.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedVersions.map((version, idx) => {
              const isCurrent = idx === 0;
              const isComparing = version.id === compareVersionId;
              return (
                <div
                  key={version.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : isComparing
                        ? "border-muted-foreground/30 bg-muted/50"
                        : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      v{version.version_number}
                    </span>
                    {isCurrent && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">
                        Actual
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatDate(version.datetime_add)}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{(version.prompt_content ?? "").length} chars</span>
                    <span>·</span>
                    <span className="truncate font-mono">
                      {(version.prompt_hash ?? "").slice(0, 8)}
                    </span>
                  </div>
                  {version.change_notes && (
                    <div className="mt-1.5 text-xs italic text-muted-foreground">
                      {version.change_notes}
                    </div>
                  )}
                  {!isCurrent && (
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setCompareVersionId(isComparing ? null : version.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <FileText className="h-3 w-3" />
                        {isComparing ? "Ocultar diff" : "Comparar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRestore(version)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restaurar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
