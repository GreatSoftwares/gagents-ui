import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useTools, useDeleteTool } from "../../hooks";
import type { Tool } from "../../types";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ToolsTableProps {
  onEdit: (tool: Tool) => void;
  config: GagentsHookConfig;
}

function useColumns(
  onEdit: (tool: Tool) => void,
  onDelete: (id: number) => void,
): ColumnDef<Tool>[] {
  return [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
      sortingFn: (rowA, rowB) =>
        rowA.original.name
          .toLowerCase()
          .localeCompare(rowB.original.name.toLowerCase()),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm font-mono">
          {row.original.slug || "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.type}</Badge>
      ),
    },
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }) => {
        const desc = row.original.description;
        if (!desc) return <span className="text-muted-foreground text-sm">{"\u2014"}</span>;
        return (
          <span className="text-muted-foreground text-sm">
            {desc.length > 50 ? `${desc.slice(0, 50)}\u2026` : desc}
          </span>
        );
      },
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
                aria-label="Editar"
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
                aria-label="Excluir"
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

export function ToolsTable({ onEdit, config }: ToolsTableProps) {
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

  const { data, isLoading } = useTools(config, queryParams);
  const deleteTool = useDeleteTool(config);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const rawTools = data?.data || [];
  const tools = rawTools.filter((t: Tool) => !t.slug?.startsWith("gclinic_"));
  const total = tools.length;

  const columns = useColumns(
    (tool) => onEdit(tool),
    (id) => setDeleteId(id),
  );

  function handleDelete() {
    if (!deleteId) return;
    deleteTool.mutate(deleteId, {
      onSuccess: () => {
        toast.success("Ferramenta excluída");
        setDeleteId(null);
      },
      onError: () => toast.error("Erro ao excluir ferramenta"),
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
          <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar ferramentas\u2026"
            aria-label="Buscar ferramentas"
            name="search"
            autoComplete="off"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tools}
        isLoading={isLoading}
        emptyMessage="Nenhuma ferramenta encontrada"
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
            <AlertDialogTitle>Excluir ferramenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A ferramenta será removida
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
