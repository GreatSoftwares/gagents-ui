import { useState } from "react";
import type { Agent, Objective } from "../../types";
import type { GagentsHookConfig } from "../../hooks/types";
import {
  useObjectives,
  useCreateObjective,
  useUpdateObjective,
  useDeleteObjective,
} from "../../hooks";
import {
  Input,
  Button,
  Switch,
  Skeleton,
  Textarea,
  Label,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@greatapps/greatauth-ui/ui";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "../ui/sortable";
import { Trash2, Target, Pencil, Plus, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface AgentObjectivesListProps {
  agent: Agent;
  config: GagentsHookConfig;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface ObjectiveFormState {
  title: string;
  slug: string;
  prompt: string;
}

const EMPTY_FORM: ObjectiveFormState = { title: "", slug: "", prompt: "" };

export function AgentObjectivesList({ agent, config }: AgentObjectivesListProps) {
  const { data: objectivesData, isLoading } = useObjectives(config, agent.id);
  const createMutation = useCreateObjective(config);
  const updateMutation = useUpdateObjective(config);
  const deleteMutation = useDeleteObjective(config);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Objective | null>(null);
  const [form, setForm] = useState<ObjectiveFormState>(EMPTY_FORM);
  const [slugManual, setSlugManual] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Objective | null>(null);

  const objectives = objectivesData?.data || [];
  const sortedObjectives = [...objectives].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  async function handleReorder(newItems: Objective[]) {
    const updates = newItems
      .map((item, index) => ({ ...item, order: index + 1 }))
      .filter((item, index) => sortedObjectives[index]?.id !== item.id);

    try {
      for (const item of updates) {
        await updateMutation.mutateAsync({
          idAgent: agent.id,
          id: item.id,
          body: { order: item.order },
        });
      }
      toast.success("Ordem atualizada");
    } catch {
      toast.error("Erro ao reordenar objetivos");
    }
  }

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setSlugManual(false);
    setFormOpen(true);
  }

  function openEdit(objective: Objective) {
    setEditTarget(objective);
    setForm({
      title: objective.title,
      slug: objective.slug || "",
      prompt: objective.prompt || "",
    });
    setSlugManual(true);
    setFormOpen(true);
  }

  async function handleSubmit() {
    if (!form.title.trim()) return;

    const effectiveSlug = form.slug.trim() || slugify(form.title);
    const nextOrder =
      sortedObjectives.length > 0
        ? Math.max(...sortedObjectives.map((o) => o.order)) + 1
        : 1;

    try {
      if (editTarget) {
        await updateMutation.mutateAsync({
          idAgent: agent.id,
          id: editTarget.id,
          body: {
            title: form.title.trim(),
            slug: effectiveSlug,
            prompt: form.prompt.trim() || null,
          },
        });
        toast.success("Objetivo atualizado");
      } else {
        await createMutation.mutateAsync({
          idAgent: agent.id,
          body: {
            title: form.title.trim(),
            slug: effectiveSlug,
            prompt: form.prompt.trim() || null,
            order: nextOrder,
          },
        });
        toast.success("Objetivo criado");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : editTarget
            ? "Erro ao atualizar objetivo"
            : "Erro ao criar objetivo",
      );
    }
  }

  async function handleToggleActive(objective: Objective, checked: boolean) {
    try {
      await updateMutation.mutateAsync({
        idAgent: agent.id,
        id: objective.id,
        body: { active: checked },
      });
      toast.success(checked ? "Objetivo ativado" : "Objetivo desativado");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao alterar estado do objetivo",
      );
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    try {
      await deleteMutation.mutateAsync({
        idAgent: agent.id,
        id: removeTarget.id,
      });
      toast.success("Objetivo removido");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao remover o objetivo",
      );
    } finally {
      setRemoveTarget(null);
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
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            {sortedObjectives.length} objetivo{sortedObjectives.length !== 1 ? "s" : ""} definido{sortedObjectives.length !== 1 ? "s" : ""}
          </h3>
          <p className="text-xs text-muted-foreground">
            Objetivos são modos de conversa que o agente ativa automaticamente conforme a intenção do utilizador.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Novo Objetivo
        </Button>
      </div>

      {sortedObjectives.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Target className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum objetivo definido. Adicione objetivos para orientar o agente em diferentes contextos.
          </p>
        </div>
      ) : (
        <Sortable
          value={sortedObjectives}
          onValueChange={handleReorder}
          getItemValue={(item) => item.id}
        >
          <SortableContent className="space-y-2">
            {sortedObjectives.map((objective) => (
              <SortableItem
                key={objective.id}
                value={objective.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <SortableItemHandle className="shrink-0 text-muted-foreground hover:text-foreground">
                  <GripVertical className="h-5 w-5" />
                </SortableItemHandle>

                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {objective.title}
                    </span>
                    {objective.slug && (
                      <Badge variant="secondary" className="shrink-0 text-xs font-mono">
                        {objective.slug}
                      </Badge>
                    )}
                  </div>
                  {objective.prompt && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {objective.prompt}
                    </p>
                  )}
                </div>

                <Switch
                  checked={objective.active}
                  onCheckedChange={(checked) =>
                    handleToggleActive(objective, checked)
                  }
                  disabled={updateMutation.isPending}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => openEdit(objective)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setRemoveTarget(objective)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </SortableItem>
            ))}
          </SortableContent>
          <SortableOverlay>
            {({ value }) => {
              const obj = sortedObjectives.find((o) => o.id === value);
              return (
                <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-lg">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{obj?.title}</span>
                </div>
              );
            }}
          </SortableOverlay>
        </Sortable>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Editar Objetivo" : "Novo Objetivo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({
                    ...f,
                    title,
                    ...(!slugManual ? { slug: slugify(title) } : {}),
                  }));
                }}
                placeholder="Ex: Agendar Consulta"
              />
            </div>

            <div className="space-y-2">
              <Label>Slug (identificador) *</Label>
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
                placeholder="Ex: agendar-consulta"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Gerado automaticamente. Usado pelo agente para identificar o objetivo.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Instruções do Objetivo</Label>
              <Textarea
                value={form.prompt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, prompt: e.target.value }))
                }
                placeholder="Instruções detalhadas que o agente seguirá quando este objetivo for ativado. Ex: passos para agendar consulta, perguntas a fazer, validações necessárias..."
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Estas instruções são carregadas automaticamente quando o agente detecta que o utilizador precisa deste objetivo.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !form.title.trim() ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {editTarget ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover objetivo?</AlertDialogTitle>
            <AlertDialogDescription>
              O objetivo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={deleteMutation.isPending}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
