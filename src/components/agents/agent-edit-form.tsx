import { useEffect, useState } from "react";
import { useUpdateAgent } from "../../hooks";
import type { Agent } from "../../types";
import type { GagentsHookConfig } from "../../hooks/types";
import {
  Button,
  Input,
  Label,
  Switch,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@greatapps/greatauth-ui/ui";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImageCropUpload } from "@greatapps/greatauth-ui";

interface AgentEditFormProps {
  config: GagentsHookConfig;
  agent: Agent;
  idAccount: string | number | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface FormState {
  title: string;
  photo: string;
  active: boolean;
  delayTyping: string;
  waitingTime: string;
  titleError: boolean;
}

function msToSeconds(ms: number | null): string {
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

export function AgentEditForm({ config, agent, idAccount, open, onOpenChange }: AgentEditFormProps) {
  const updateAgent = useUpdateAgent(config);
  const [form, setForm] = useState<FormState>(() => agentToFormState(agent));

  useEffect(() => {
    setForm(agentToFormState(agent));
  }, [agent]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

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
    else body.photo = "";

    const delayMs = secondsToMs(form.delayTyping);
    if (delayMs !== undefined) body.delay_typing = delayMs;
    else body.delay_typing = 0;

    const waitingMs = secondsToMs(form.waitingTime);
    if (waitingMs !== undefined) body.waiting_time = waitingMs;
    else body.waiting_time = 0;

    try {
      await updateAgent.mutateAsync({ id: agent.id, body });
      toast.success("Agente atualizado");
      onOpenChange?.(false);
    } catch {
      toast.error("Erro ao atualizar agente");
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-center">
        <ImageCropUpload
          value={form.photo || null}
          onChange={(url) => updateField("photo", url)}
          onRemove={() => updateField("photo", "")}
          entityType="agents"
          entityId={agent.id}
          idAccount={typeof idAccount === "string" ? Number(idAccount) : (idAccount ?? 0)}
          name={form.title || null}
          disabled={updateAgent.isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-title">Nome do Agente *</Label>
        <Input
          id="edit-title"
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
          disabled={updateAgent.isPending}
        />
        {form.titleError && (
          <p className="text-sm text-destructive">Nome é obrigatório</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="edit-active"
          checked={form.active}
          onCheckedChange={(checked) => updateField("active", checked)}
          disabled={updateAgent.isPending}
        />
        <Label htmlFor="edit-active" className="cursor-pointer">
          {form.active ? "Ativo" : "Inativo"}
        </Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-delay">Delay de Digitação (s)</Label>
          <Input
            id="edit-delay"
            name="delay"
            type="number"
            value={form.delayTyping}
            onChange={(e) => updateField("delayTyping", e.target.value)}
            placeholder="0"
            min="0"
            step="0.5"
            disabled={updateAgent.isPending}
          />
          <p className="text-xs text-muted-foreground">
            Tempo de simulação de digitação
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-waiting">Tempo de Espera (s)</Label>
          <Input
            id="edit-waiting"
            name="waiting"
            type="number"
            value={form.waitingTime}
            onChange={(e) => updateField("waitingTime", e.target.value)}
            placeholder="0"
            min="0"
            step="0.5"
            disabled={updateAgent.isPending}
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
          onClick={() => onOpenChange?.(false)}
          disabled={updateAgent.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={updateAgent.isPending}>
          {updateAgent.isPending && (
            <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
          )}
          Salvar
        </Button>
      </DialogFooter>
    </form>
  );

  if (open !== undefined && onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Agente</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return <div className="max-w-lg pt-4">{formContent}</div>;
}
