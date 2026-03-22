import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Tool, ToolCredential } from "../../types";
import type { GagentsHookConfig } from "../../hooks/types";
import {
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@greatapps/greatauth-ui/ui";
import { Trash2, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ToolCredentialsFormProps {
  credentials: ToolCredential[];
  isLoading: boolean;
  config: GagentsHookConfig;
  gagentsApiUrl: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Sem expiração";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
}

function useColumns(
  tools: Tool[],
  onRemove: (cred: ToolCredential) => void,
): ColumnDef<ToolCredential>[] {
  function getToolName(idTool: number | null): string {
    if (!idTool) return "\u2014";
    const tool = tools.find((t) => t.id === idTool);
    return tool?.name || `Ferramenta #${idTool}`;
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                aria-label="Excluir"
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
}: ToolCredentialsFormProps) {
  const deleteMutation = useDeleteToolCredential(config);
  const { data: toolsData } = useTools(config);
  const tools: Tool[] = (toolsData?.data || []).filter((t: Tool) => !t.slug?.startsWith("gclinic_"));

  const [search, setSearch] = useState("");
  const [removeTarget, setRemoveTarget] = useState<ToolCredential | null>(null);

  // Build a set of internal tool IDs to exclude from credentials display
  const internalToolIds = useMemo(() => {
    const allRawTools: Tool[] = toolsData?.data || [];
    return new Set(
      allRawTools
        .filter((t: Tool) => t.slug?.startsWith("gclinic_"))
        .map((t: Tool) => t.id),
    );
  }, [toolsData]);

  const filteredCredentials = useMemo(() => {
    // Exclude credentials linked to internal gclinic_* tools
    const visible = credentials.filter(
      (cred) => !cred.id_tool || !internalToolIds.has(cred.id_tool),
    );
    if (!search) return visible;
    const term = search.toLowerCase();
    return visible.filter((cred) => {
      const toolName = tools.find((t) => t.id === cred.id_tool)?.name || "";
      return (
        (cred.label || "").toLowerCase().includes(term) ||
        toolName.toLowerCase().includes(term)
      );
    });
  }, [credentials, search, tools, internalToolIds]);

  const columns = useColumns(
    tools,
    (cred) => setRemoveTarget(cred),
  );

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar credenciais\u2026"
            aria-label="Buscar credenciais"
            name="search"
            autoComplete="off"
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
