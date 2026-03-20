import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Tool, ToolCredential } from "../../types";
import type { GagentsHookConfig } from "../../hooks/types";
import {
  useCreateToolCredential,
  useUpdateToolCredential,
  useDeleteToolCredential,
} from "../../hooks";
import { useTools } from "../../hooks";
import { DataTable } from "@greatapps/greatauth-ui";
import {
  Input,
  Button,
  Badge,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@greatapps/greatauth-ui/ui";
import { Trash2, Pencil, Link, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ToolCredentialsFormProps {
  credentials: ToolCredential[];
  isLoading: boolean;
  config: GagentsHookConfig;
  gagentsApiUrl: string;
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Sem expiração";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
}

function useColumns(
  tools: Tool[],
  onEdit: (cred: ToolCredential) => void,
  onConnect: (cred: ToolCredential) => void,
  onRemove: (cred: ToolCredential) => void,
): ColumnDef<ToolCredential>[] {
  function getToolName(idTool: number | null): string {
    if (!idTool) return "\u2014";
    const tool = tools.find((t) => t.id === idTool);
    return tool?.name || `Ferramenta #${idTool}`;
  }

  function getToolType(idTool: number | null): string | null {
    if (!idTool) return null;
    const tool = tools.find((t) => t.id === idTool);
    return tool?.type || null;
  }

  return [
    {
      accessorKey: "label",
      header: "Label",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.label || "\u2014"}</span>
      ),
    },
    {
      accessorKey: "id_tool",
      header: "Ferramenta",
      cell: ({ row }) => (
        <span className="text-sm">{getToolName(row.original.id_tool)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === "active" ? "default" : "destructive"}
        >
          {row.original.status === "active" ? "Ativo" : "Expirado"}
        </Badge>
      ),
    },
    {
      accessorKey: "expires_at",
      header: "Expira em",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.expires_at)}
        </span>
      ),
    },
    {
      accessorKey: "datetime_add",
      header: "Criado em",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.datetime_add)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      size: 100,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {getToolType(row.original.id_tool) === "oauth2" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled
                >
                  <Link className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Em breve</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(row.original)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onRemove(row.original)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remover</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];
}

export function ToolCredentialsForm({
  credentials,
  isLoading,
  config,
  gagentsApiUrl,
  createOpen: externalCreateOpen,
  onCreateOpenChange,
}: ToolCredentialsFormProps) {
  const createMutation = useCreateToolCredential(config);
  const updateMutation = useUpdateToolCredential(config);
  const deleteMutation = useDeleteToolCredential(config);
  const { data: toolsData } = useTools(config);
  const tools: Tool[] = toolsData?.data || [];

  const [search, setSearch] = useState("");
  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const showCreateDialog = externalCreateOpen ?? internalCreateOpen;
  const setShowCreateDialog = onCreateOpenChange ?? setInternalCreateOpen;
  const [createForm, setCreateForm] = useState({
    id_tool: "",
    label: "",
    credentials_encrypted: "",
    expires_at: "",
  });

  const [editTarget, setEditTarget] = useState<ToolCredential | null>(null);
  const [editForm, setEditForm] = useState({
    id_tool: "",
    label: "",
    credentials_encrypted: "",
    expires_at: "",
    status: "" as "active" | "expired" | "",
  });

  const [removeTarget, setRemoveTarget] = useState<ToolCredential | null>(null);

  const filteredCredentials = useMemo(() => {
    if (!search) return credentials;
    const term = search.toLowerCase();
    return credentials.filter((cred) => {
      const toolName = tools.find((t) => t.id === cred.id_tool)?.name || "";
      return (
        (cred.label || "").toLowerCase().includes(term) ||
        toolName.toLowerCase().includes(term)
      );
    });
  }, [credentials, search, tools]);

  const columns = useColumns(
    tools,
    (cred) => startEdit(cred),
    (cred) => handleConnect(cred),
    (cred) => setRemoveTarget(cred),
  );

  async function handleCreate() {
    const idTool = parseInt(createForm.id_tool, 10);
    if (!idTool || !createForm.label.trim() || !createForm.credentials_encrypted.trim()) return;

    try {
      const result = await createMutation.mutateAsync({
        id_tool: idTool,
        label: createForm.label.trim(),
        credentials_encrypted: createForm.credentials_encrypted.trim(),
        ...(createForm.expires_at ? { expires_at: createForm.expires_at } : {}),
      });
      if (result.status === 1) {
        toast.success("Credencial criada");
        setShowCreateDialog(false);
        setCreateForm({ id_tool: "", label: "", credentials_encrypted: "", expires_at: "" });
      } else {
        toast.error(result.message || "Erro ao criar credencial");
      }
    } catch {
      toast.error("Erro ao criar credencial");
    }
  }

  function startEdit(cred: ToolCredential) {
    setEditTarget(cred);
    setEditForm({
      id_tool: cred.id_tool ? String(cred.id_tool) : "",
      label: cred.label || "",
      credentials_encrypted: "",
      expires_at: cred.expires_at || "",
      status: cred.status,
    });
  }

  async function handleSaveEdit() {
    if (!editTarget) return;
    const body: Record<string, unknown> = {};
    const newIdTool = editForm.id_tool ? parseInt(editForm.id_tool, 10) : null;
    if (newIdTool && newIdTool !== editTarget.id_tool) {
      body.id_tool = newIdTool;
    }
    if (editForm.label.trim() && editForm.label.trim() !== (editTarget.label || "")) {
      body.label = editForm.label.trim();
    }
    if (editForm.credentials_encrypted.trim()) {
      body.credentials_encrypted = editForm.credentials_encrypted.trim();
    }
    if (editForm.expires_at !== (editTarget.expires_at || "")) {
      body.expires_at = editForm.expires_at || null;
    }
    if (editForm.status && editForm.status !== editTarget.status) {
      body.status = editForm.status;
    }

    if (Object.keys(body).length === 0) {
      setEditTarget(null);
      return;
    }

    try {
      const result = await updateMutation.mutateAsync({
        id: editTarget.id,
        body: body as Parameters<typeof updateMutation.mutateAsync>[0]["body"],
      });
      if (result.status === 1) {
        toast.success("Credencial atualizada");
        setEditTarget(null);
      } else {
        toast.error(result.message || "Erro ao atualizar credencial");
      }
    } catch {
      toast.error("Erro ao atualizar credencial");
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    try {
      const result = await deleteMutation.mutateAsync(removeTarget.id);
      if (result.status === 1) {
        toast.success("Credencial removida");
      } else {
        toast.error(result.message || "Erro ao remover credencial");
      }
    } catch {
      toast.error("Erro ao remover credencial");
    } finally {
      setRemoveTarget(null);
    }
  }

  function handleConnect(cred: ToolCredential) {
    if (!config.accountId || !config.token) return;
    const language = config.language ?? "pt-br";
    const idWl = config.idWl ?? 1;
    const url = `${gagentsApiUrl}/v1/${language}/${idWl}/accounts/${config.accountId}/oauth/connect?id_tool=${cred.id_tool}`;
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar credenciais..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredCredentials}
        isLoading={isLoading}
        emptyMessage="Nenhuma credencial encontrada"
      />

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Credencial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Ferramenta *
              </label>
              <Select
                value={createForm.id_tool}
                onValueChange={(val) =>
                  setCreateForm((f) => ({ ...f, id_tool: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a ferramenta" />
                </SelectTrigger>
                <SelectContent>
                  {tools.map((tool) => (
                    <SelectItem key={tool.id} value={String(tool.id)}>
                      {tool.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Label *
              </label>
              <Input
                value={createForm.label}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, label: e.target.value }))
                }
                placeholder="Ex: Google Calendar - Clínica São Paulo"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Credencial *
              </label>
              <Input
                type="password"
                value={createForm.credentials_encrypted}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    credentials_encrypted: e.target.value,
                  }))
                }
                placeholder="Credencial encriptada"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Data de Expiração (opcional)
              </label>
              <Input
                type="date"
                value={createForm.expires_at}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, expires_at: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !createForm.id_tool ||
                !createForm.label.trim() ||
                !createForm.credentials_encrypted.trim() ||
                createMutation.isPending
              }
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Credencial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Ferramenta *
              </label>
              <Select
                value={editForm.id_tool}
                onValueChange={(val) =>
                  setEditForm((f) => ({ ...f, id_tool: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a ferramenta" />
                </SelectTrigger>
                <SelectContent>
                  {tools.map((tool) => (
                    <SelectItem key={tool.id} value={String(tool.id)}>
                      {tool.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Label
              </label>
              <Input
                value={editForm.label}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, label: e.target.value }))
                }
                placeholder="Label da credencial"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Nova Credencial (vazio = manter atual)
              </label>
              <Input
                type="password"
                value={editForm.credentials_encrypted}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    credentials_encrypted: e.target.value,
                  }))
                }
                placeholder="Nova credencial"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Data de Expiração
              </label>
              <Input
                type="date"
                value={editForm.expires_at}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, expires_at: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <Select
                value={editForm.status || undefined}
                onValueChange={(val) =>
                  setEditForm((f) => ({
                    ...f,
                    status: val as "active" | "expired",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
            >
              Salvar
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
            <AlertDialogTitle>Remover credencial?</AlertDialogTitle>
            <AlertDialogDescription>
              A credencial será removida permanentemente.
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
