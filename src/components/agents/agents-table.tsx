import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useAgents, useDeleteAgent } from "../../hooks";
import type { Agent } from "../../types";
import type { GagentsHookConfig } from "../../hooks/types";
import { DataTable } from "@greatapps/greatauth-ui";
import {
  Input,
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
  Button,
} from "@greatapps/greatauth-ui/ui";
import { Pencil, Trash2, Search } from "lucide-react";
import { EntityAvatar } from "@greatapps/greatauth-ui";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

function useColumns(
  onEdit: (agent: Agent) => void,
  onDelete: (id: number) => void,
): ColumnDef<Agent>[] {
  return [
    {
      accessorKey: "title",
      header: "Nome",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <EntityAvatar photo={row.original.photo} name={row.original.title} size="sm" />
          <span className="font-medium">{row.original.title}</span>
        </div>
      ),
      sortingFn: (rowA, rowB) =>
        rowA.original.title
          .toLowerCase()
          .localeCompare(rowB.original.title.toLowerCase()),
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) =>
        row.original.active ? (
          <Badge variant="default">Ativo</Badge>
        ) : (
          <Badge variant="secondary">Inativo</Badge>
        ),
    },
    {
      accessorKey: "datetime_add",
      header: "Criado em",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {format(new Date(row.original.datetime_add), "dd/MM/yyyy", {
            locale: ptBR,
          })}
        </span>
      ),
    },
    {
      id: "actions",
      size: 80,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
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
                onClick={() => onDelete(row.original.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];
}

export function AgentsTable({ config, onNavigateToAgent }: { config: GagentsHookConfig; onNavigateToAgent?: (agentId: number) => void }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      limit: "15",
      page: String(page),
    };
    if (search) {
      params.search = search;
    }
    return params;
  }, [search, page]);

  const { data, isLoading } = useAgents(config, queryParams);
  const deleteAgent = useDeleteAgent(config);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const agents = data?.data || [];
  const total = data?.total || 0;

  const columns = useColumns(
    (agent) => onNavigateToAgent?.(agent.id),
    (id) => setDeleteId(id),
  );

  function handleDelete() {
    if (!deleteId) return;
    deleteAgent.mutate(deleteId, {
      onSuccess: () => {
        toast.success("Agente excluído");
        setDeleteId(null);
      },
      onError: () => toast.error("Erro ao excluir agente"),
    });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar agentes..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={agents}
        isLoading={isLoading}
        emptyMessage="Nenhum agente encontrado"
        total={total}
        page={page}
        onPageChange={setPage}
        pageSize={15}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O agente será removido
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="default">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              size="default"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
