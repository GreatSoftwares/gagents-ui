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
} from "@greatapps/greatauth-ui/ui";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AgentFormDialogProps {
  config: GagentsHookConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: Agent;
}

export function AgentFormDialog({
  config,
  open,
  onOpenChange,
  agent,
}: AgentFormDialogProps) {
  const isEditing = !!agent;
  const createAgent = useCreateAgent(config);
  const updateAgent = useUpdateAgent(config);

  const [title, setTitle] = useState("");
  const [photo, setPhoto] = useState("");
  const [delayTyping, setDelayTyping] = useState("");
  const [waitingTime, setWaitingTime] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect -- form state sync from props */
  useEffect(() => {
    if (agent) {
      setTitle(agent.title);
      setPhoto(agent.photo || "");
      setDelayTyping(agent.delay_typing != null ? String(agent.delay_typing) : "");
      setWaitingTime(agent.waiting_time != null ? String(agent.waiting_time) : "");
    } else {
      setTitle("");
      setPhoto("");
      setDelayTyping("");
      setWaitingTime("");
    }
  }, [agent, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const isPending = createAgent.isPending || updateAgent.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const body: Record<string, unknown> = {
      title: title.trim(),
    };
    if (photo.trim()) body.photo = photo.trim();
    if (delayTyping.trim()) body.delay_typing = Number(delayTyping);
    if (waitingTime.trim()) body.waiting_time = Number(waitingTime);

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
          <div className="space-y-2">
            <Label htmlFor="agent-photo">Foto (URL)</Label>
            <Input
              id="agent-photo"
              name="photo"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              placeholder="https://exemplo.com/foto.jpg"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-title">Nome do Agente *</Label>
            <Input
              id="agent-title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Assistente de Agendamento"
              required
              disabled={isPending}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agent-delay">Delay de Digitação (ms)</Label>
              <Input
                id="agent-delay"
                name="delay"
                type="number"
                value={delayTyping}
                onChange={(e) => setDelayTyping(e.target.value)}
                placeholder="0"
                min="0"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-waiting">Tempo de Espera (ms)</Label>
              <Input
                id="agent-waiting"
                name="waiting"
                type="number"
                value={waitingTime}
                onChange={(e) => setWaitingTime(e.target.value)}
                placeholder="0"
                min="0"
                disabled={isPending}
              />
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
            <Button type="submit" disabled={isPending || !title.trim()}>
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
