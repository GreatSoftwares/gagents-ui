import { useEffect, useState } from "react";
import { useCreateAgent, useUpdateAgent } from "../../hooks";
import type { Agent } from "../../types";
import type { GagentsHookConfig } from "../../hooks/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Switch,
} from "@greatapps/greatauth-ui/ui";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImageCropUpload } from "@greatapps/greatauth-ui";

interface AgentFormDialogProps {
  config: GagentsHookConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: Agent;
  idAccount?: string | number | null;
}

interface FormState {
  title: string;
  photo: string;
  active: boolean;
  delayTyping: string;
  waitingTime: string;
  titleError: boolean;
}

function msToSeconds(ms: number | null | undefined): string {
  if (ms == null || ms === 0) return "";
  return String(Math.round(ms / 1000));
}

function secondsToMs(seconds: string): number | undefined {
  const val = parseFloat(seconds);
  if (isNaN(val) || val <= 0) return undefined;
  return Math.round(val * 1000);
}

function agentToFormState(agent: Agent): FormState {
  return {
    title: agent.title,
    photo: agent.photo || "",
    active: agent.active,
    delayTyping: msToSeconds(agent.delay_typing),
    waitingTime: msToSeconds(agent.waiting_time),
    titleError: false,
  };
}

const emptyFormState: FormState = {
  title: "",
  photo: "",
  active: true,
  delayTyping: "",
  waitingTime: "",
  titleError: false,
};

export function AgentFormDialog({
  config,
  open,
  onOpenChange,
  agent,
  idAccount,
}: AgentFormDialogProps) {
  const isEditing = !!agent;
  const createAgent = useCreateAgent(config);
  const updateAgent = useUpdateAgent(config);

  const [form, setForm] = useState<FormState>(emptyFormState);

  /* eslint-disable react-hooks/set-state-in-effect -- form state sync from props */
  useEffect(() => {
    if (agent) {
      setForm(agentToFormState(agent));
    } else {
      setForm(emptyFormState);
    }
  }, [agent, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isPending = createAgent.isPending || updateAgent.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      updateField("titleError", true);
      return;
    }

    const body: Record<string, unknown> = {
      title: form.title.trim(),
      active: form.active,
    };
    if (form.photo.trim()) body.photo = form.photo.trim();
    else if (isEditing) body.photo = "";

    const delayMs = secondsToMs(form.delayTyping);
    if (delayMs !== undefined) body.delay_typing = delayMs;
    else if (isEditing) body.delay_typing = 0;

    const waitingMs = secondsToMs(form.waitingTime);
    if (waitingMs !== undefined) body.waiting_time = waitingMs;
    else if (isEditing) body.waiting_time = 0;

    try {
      if (isEditing) {
        await updateAgent.mutateAsync({ id: agent.id, body });
        toast.success("Agente atualizado");
      } else {
        await createAgent.mutateAsync(
          body as { title: string; prompt?: string; photo?: string; delay_typing?: number; waiting_time?: number },
        );
        toast.success("Agente criado");
      }
      onOpenChange(false);
    } catch {
      toast.error(isEditing ? "Erro ao atualizar agente" : "Erro ao criar agente");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Agente" : "Novo Agente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <ImageCropUpload
              value={form.photo || null}
              onChange={(url) => updateField("photo", url)}
              onRemove={() => updateField("photo", "")}
              entityType="agents"
              entityId={agent?.id}
              idAccount={typeof idAccount === "string" ? Number(idAccount) : (idAccount ?? Number(config.accountId) ?? 0)}
              name={form.title || null}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-title">Nome do Agente *</Label>
            <Input
              id="agent-title"
              name="title"
              value={form.title}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  title: e.target.value,
                  titleError: e.target.value.trim() ? false : prev.titleError,
                }));
              }}
              placeholder="Ex: Assistente de Agendamento"
              required
              disabled={isPending}
            />
            {form.titleError && (
              <p className="text-sm text-destructive">Nome é obrigatório</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="agent-active"
              checked={form.active}
              onCheckedChange={(checked) => updateField("active", checked)}
              disabled={isPending}
            />
            <Label htmlFor="agent-active" className="cursor-pointer">
              {form.active ? "Ativo" : "Inativo"}
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agent-delay">Delay de Digitação (s)</Label>
              <Input
                id="agent-delay"
                name="delay"
                type="number"
                value={form.delayTyping}
                onChange={(e) => updateField("delayTyping", e.target.value)}
                placeholder="0"
                min="0"
                step="0.5"
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Tempo de simulação de digitação
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-waiting">Tempo de Espera (s)</Label>
              <Input
                id="agent-waiting"
                name="waiting"
                type="number"
                value={form.waitingTime}
                onChange={(e) => updateField("waitingTime", e.target.value)}
                placeholder="0"
                min="0"
                step="0.5"
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Espera por mensagens agrupadas
              </p>
            </div>
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
            <Button type="submit" disabled={isPending || !form.title.trim()}>
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
