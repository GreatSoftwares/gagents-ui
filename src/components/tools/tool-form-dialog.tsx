import { useState } from "react";
import { useCreateTool, useUpdateTool } from "../../hooks";
import type { Tool } from "../../types";
import type { GagentsHookConfig } from "../../hooks/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@greatapps/greatauth-ui/ui";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const TOOL_AUTH_TYPES = [
  { value: "none", label: "Nenhuma" },
  { value: "api_key", label: "API Key" },
  { value: "oauth2", label: "OAuth 2.0" },
] as const;

interface ToolFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool?: Tool;
  config: GagentsHookConfig;
}

interface FormState {
  name: string;
  slug: string;
  type: string;
  description: string;
  functionDefinitions: string;
  nameError: boolean;
  slugError: boolean;
  typeError: boolean;
  jsonError: boolean;
}

function toolToFormState(tool?: Tool): FormState {
  return {
    name: tool?.name || "",
    slug: tool?.slug || "",
    type: tool?.type || "none",
    description: tool?.description || "",
    functionDefinitions: tool?.function_definitions
      ? formatJson(tool.function_definitions)
      : "",
    nameError: false,
    slugError: false,
    typeError: false,
    jsonError: false,
  };
}

function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isValidJson(str: string): boolean {
  if (!str.trim()) return true;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export function ToolFormDialog({
  open,
  onOpenChange,
  tool,
  config,
}: ToolFormDialogProps) {
  const isEditing = !!tool;
  const createTool = useCreateTool(config);
  const updateTool = useUpdateTool(config);
  const [form, setForm] = useState<FormState>(() => toolToFormState(tool));
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Reset form when dialog opens or tool changes
  const [lastResetKey, setLastResetKey] = useState(
    () => `${tool?.id}-${open}`,
  );
  const resetKey = `${tool?.id}-${open}`;
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setForm(toolToFormState(open ? tool : undefined));
    setSlugManuallyEdited(false);
  }

  const isPending = createTool.isPending || updateTool.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let hasError = false;

    if (!form.name.trim()) {
      setForm((prev) => ({ ...prev, nameError: true }));
      hasError = true;
    }
    const effectiveSlug = form.slug.trim() || slugify(form.name);
    if (!effectiveSlug) {
      setForm((prev) => ({ ...prev, slugError: true }));
      hasError = true;
    }
    if (!form.type) {
      setForm((prev) => ({ ...prev, typeError: true }));
      hasError = true;
    }
    if (!isValidJson(form.functionDefinitions)) {
      setForm((prev) => ({ ...prev, jsonError: true }));
      hasError = true;
    }

    if (hasError) return;

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      slug: effectiveSlug,
      type: form.type,
    };

    if (form.description.trim()) body.description = form.description.trim();
    else body.description = "";

    // JSONB critical rule: function_definitions must be sent as string
    if (form.functionDefinitions.trim()) {
      const parsed = JSON.parse(form.functionDefinitions.trim());
      body.function_definitions = JSON.stringify(parsed);
    } else {
      body.function_definitions = "";
    }

    try {
      if (isEditing) {
        await updateTool.mutateAsync({ id: tool.id, body });
        toast.success("Ferramenta atualizada");
      } else {
        await createTool.mutateAsync(
          body as { name: string; slug: string; type: string; description?: string; function_definitions?: string },
        );
        toast.success("Ferramenta criada");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : isEditing ? "Erro ao atualizar ferramenta" : "Erro ao criar ferramenta",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Ferramenta" : "Nova Ferramenta"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tool-name">Nome *</Label>
            <Input
              id="tool-name"
              name="name"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  name,
                  nameError: name.trim() ? false : prev.nameError,
                  ...(!slugManuallyEdited && !isEditing
                    ? { slug: slugify(name), slugError: false }
                    : {}),
                }));
              }}
              placeholder="Ex: Google Calendar"
              disabled={isPending}
            />
            {form.nameError && (
              <p className="text-sm text-destructive">Nome é obrigatório</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tool-slug">Slug (identificador único) *</Label>
            <Input
              id="tool-slug"
              name="slug"
              value={form.slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setForm((prev) => ({
                  ...prev,
                  slug: e.target.value,
                  slugError: e.target.value.trim() ? false : prev.slugError,
                }));
              }}
              placeholder="Ex: google-calendar"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Gerado automaticamente a partir do nome. Usado internamente para identificar a ferramenta.
            </p>
            {form.slugError && (
              <p className="text-sm text-destructive">Slug é obrigatório</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tool-type">Tipo de Autenticação *</Label>
            <Select
              value={form.type}
              onValueChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  type: value,
                  typeError: false,
                }));
              }}
              disabled={isPending}
            >
              <SelectTrigger id="tool-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TOOL_AUTH_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define se a ferramenta requer credenciais para funcionar.
            </p>
            {form.typeError && (
              <p className="text-sm text-destructive">Tipo é obrigatório</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tool-description">Descrição</Label>
            <Textarea
              id="tool-description"
              name="description"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Descri\u00e7\u00e3o da ferramenta\u2026"
              rows={3}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tool-function-defs">
              Definições de Função (JSON)
            </Label>
            <Textarea
              id="tool-function-defs"
              name="functionDefs"
              value={form.functionDefinitions}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  functionDefinitions: e.target.value,
                  jsonError: false,
                }));
              }}
              placeholder={`[
  {
    "type": "function",
    "function": {
      "name": "nome_da_funcao",
      "description": "O que a fun\u00e7\u00e3o faz",
      "parameters": {
        "type": "object",
        "properties": { \u2026 },
        "required": [\u2026]
      }
    }
  }
]`}
              rows={10}
              className="font-mono text-sm"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Array de definições no formato OpenAI Function Calling.
            </p>
            {form.jsonError && (
              <p className="text-sm text-destructive">JSON inválido</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isEditing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
