'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { GagentsHookConfig } from "../../hooks/types";
import {
  useCapabilities,
  useAgentCapabilities,
  useUpdateAgentCapabilities,
} from "../../hooks";
import type {
  CapabilityCategory,
  CapabilityModule,
  AgentCapability,
  AgentCapabilitiesPayload,
} from "../../types/capabilities";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Switch,
  Checkbox,
  Badge,
  Button,
  Skeleton,
} from "@greatapps/greatauth-ui/ui";
import {
  Calendar,
  Users,
  Settings,
  HeartHandshake,
  Package,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Operation label mapping (pt-BR)
// ---------------------------------------------------------------------------

const OPERATION_LABELS: Record<string, string> = {
  list: "Listar",
  view: "Visualizar",
  create: "Criar",
  update: "Atualizar",
};

function getOperationLabel(slug: string): string {
  return OPERATION_LABELS[slug] ?? slug;
}

// ---------------------------------------------------------------------------
// Category icon mapping
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  agenda: Calendar,
  cadastros: Users,
  infraestrutura: Settings,
  relacionamentos: HeartHandshake,
};

function getCategoryIcon(slug: string): React.ElementType {
  return CATEGORY_ICONS[slug] ?? Package;
}

// ---------------------------------------------------------------------------
// Internal state helpers
// ---------------------------------------------------------------------------

/** Map from module slug -> set of enabled operation slugs */
type CapabilityState = Map<string, Set<string>>;

function buildStateFromAgent(agentCaps: AgentCapability[]): CapabilityState {
  const state: CapabilityState = new Map();
  for (const cap of agentCaps) {
    state.set(cap.module, new Set(cap.operations));
  }
  return state;
}

function stateToPayload(state: CapabilityState): AgentCapabilitiesPayload {
  const capabilities: AgentCapability[] = [];
  state.forEach((ops, mod) => {
    if (ops.size > 0) {
      capabilities.push({ module: mod, operations: Array.from(ops) });
    }
  });
  return { capabilities };
}

function cloneState(state: CapabilityState): CapabilityState {
  const next: CapabilityState = new Map();
  state.forEach((ops, mod) => next.set(mod, new Set(ops)));
  return next;
}

function statesEqual(a: CapabilityState, b: CapabilityState): boolean {
  if (a.size !== b.size) return false;
  for (const [mod, opsA] of a) {
    const opsB = b.get(mod);
    if (!opsB || opsA.size !== opsB.size) return false;
    for (const op of opsA) {
      if (!opsB.has(op)) return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CapabilitiesTabProps {
  config: GagentsHookConfig;
  agentId: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CapabilitiesTab({ config, agentId }: CapabilitiesTabProps) {
  const { data: registry, isLoading: isLoadingRegistry } = useCapabilities(config);
  const { data: agentCaps, isLoading: isLoadingAgent } = useAgentCapabilities(config, agentId);
  const updateMutation = useUpdateAgentCapabilities(config);

  // Local state for optimistic updates
  const [localState, setLocalState] = useState<CapabilityState>(new Map());
  const [serverState, setServerState] = useState<CapabilityState>(new Map());
  const [initialized, setInitialized] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync server data into local state on first load / refetch
  useEffect(() => {
    if (agentCaps && !initialized) {
      const state = buildStateFromAgent(agentCaps);
      setLocalState(state);
      setServerState(cloneState(state));
      setInitialized(true);
    }
  }, [agentCaps, initialized]);

  // Reset initialized when agentId changes
  useEffect(() => {
    setInitialized(false);
  }, [agentId]);

  const hasChanges = useMemo(
    () => initialized && !statesEqual(localState, serverState),
    [localState, serverState, initialized],
  );

  // ------ Debounced save ------
  const scheduleSave = useCallback(
    (nextState: CapabilityState) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const payload = stateToPayload(nextState);
        updateMutation.mutate(
          { agentId, payload },
          {
            onSuccess: () => {
              setServerState(cloneState(nextState));
              toast.success("Capacidades salvas");
            },
            onError: () => {
              // Rollback to server state
              setLocalState(cloneState(serverState));
              toast.error("Erro ao salvar capacidades");
            },
          },
        );
      }, 500);
    },
    [agentId, updateMutation, serverState],
  );

  // ------ State mutation helpers ------
  const updateState = useCallback(
    (updater: (prev: CapabilityState) => CapabilityState) => {
      setLocalState((prev) => {
        const next = updater(prev);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const toggleModule = useCallback(
    (mod: CapabilityModule, enabled: boolean) => {
      updateState((prev) => {
        const next = cloneState(prev);
        if (enabled) {
          next.set(mod.slug, new Set(mod.operations));
        } else {
          next.delete(mod.slug);
        }
        return next;
      });
    },
    [updateState],
  );

  const toggleOperation = useCallback(
    (mod: CapabilityModule, opSlug: string, enabled: boolean) => {
      updateState((prev) => {
        const next = cloneState(prev);
        const ops = new Set(next.get(mod.slug) ?? []);
        if (enabled) {
          ops.add(opSlug);
        } else {
          ops.delete(opSlug);
        }
        if (ops.size > 0) {
          next.set(mod.slug, ops);
        } else {
          next.delete(mod.slug);
        }
        return next;
      });
    },
    [updateState],
  );

  const enableAll = useCallback(() => {
    if (!registry) return;
    updateState(() => {
      const next: CapabilityState = new Map();
      for (const cat of registry.categories) {
        for (const mod of cat.modules) {
          next.set(mod.slug, new Set(mod.operations));
        }
      }
      return next;
    });
  }, [registry, updateState]);

  const disableAll = useCallback(() => {
    updateState(() => new Map());
  }, [updateState]);

  const discard = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLocalState(cloneState(serverState));
  }, [serverState]);

  const saveNow = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const payload = stateToPayload(localState);
    updateMutation.mutate(
      { agentId, payload },
      {
        onSuccess: () => {
          setServerState(cloneState(localState));
          toast.success("Capacidades salvas");
        },
        onError: () => {
          setLocalState(cloneState(serverState));
          toast.error("Erro ao salvar capacidades");
        },
      },
    );
  }, [agentId, localState, serverState, updateMutation]);

  // ------ Counting helpers ------
  function countActiveModules(cat: CapabilityCategory): number {
    return cat.modules.filter((m) => (localState.get(m.slug)?.size ?? 0) > 0).length;
  }

  // ------ Loading state ------
  if (isLoadingRegistry || isLoadingAgent) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  // ------ Empty state ------
  if (!registry || !registry.categories.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="text-base font-medium">Nenhuma capacidade disponível</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Este produto ainda não possui capacidades registadas. As capacidades serão
          adicionadas automaticamente quando o produto for configurado.
        </p>
      </div>
    );
  }

  // ------ Render ------
  return (
    <div className="space-y-4">
      {/* Header with global actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Capacidades do agente</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ative ou desative módulos e operações disponíveis para este agente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={enableAll}>
            Ativar tudo
          </Button>
          <Button variant="outline" size="sm" onClick={disableAll}>
            Desativar tudo
          </Button>
        </div>
      </div>

      {/* Category accordions */}
      <Accordion type="multiple" className="space-y-2">
        {registry.categories.map((cat) => {
          const Icon = getCategoryIcon(cat.slug);
          const activeCount = countActiveModules(cat);
          const totalModules = cat.modules.length;

          return (
            <AccordionItem
              key={cat.slug}
              value={cat.slug}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3 flex-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{cat.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {activeCount} de {totalModules} módulos ativos
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3 !h-auto">
                <div className="space-y-1">
                  {cat.modules.map((mod) => {
                    const enabledOps = localState.get(mod.slug);
                    const isModuleOn = (enabledOps?.size ?? 0) > 0;
                    const allOpsEnabled =
                      enabledOps?.size === mod.operations.length;

                    return (
                      <ModuleRow
                        key={mod.slug}
                        module={mod}
                        isOn={isModuleOn}
                        allOpsEnabled={allOpsEnabled}
                        enabledOps={enabledOps ?? new Set()}
                        onToggleModule={(on) => toggleModule(mod, on)}
                        onToggleOperation={(op, on) =>
                          toggleOperation(mod, op, on)
                        }
                      />
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Save bar */}
      {hasChanges && (
        <div className="sticky bottom-0 bg-background border-t py-3 px-4 -mx-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Você tem alterações não salvas.
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={discard}>
              Descartar
            </Button>
            <Button
              size="sm"
              onClick={saveNow}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ModuleRow sub-component
// ---------------------------------------------------------------------------

interface ModuleRowProps {
  module: CapabilityModule;
  isOn: boolean;
  allOpsEnabled: boolean;
  enabledOps: Set<string>;
  onToggleModule: (on: boolean) => void;
  onToggleOperation: (op: string, on: boolean) => void;
}

function ModuleRow({
  module: mod,
  isOn,
  enabledOps,
  onToggleModule,
  onToggleOperation,
}: ModuleRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border px-3 py-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-2 flex-1 text-left"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={`Expandir ${mod.label}`}
        >
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
              expanded ? "rotate-0" : "-rotate-90"
            }`}
          />
          <span className="text-sm font-medium">{mod.label}</span>
          {mod.description && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              — {mod.description}
            </span>
          )}
          {isOn && (
            <Badge variant="secondary" className="text-xs ml-1">
              {enabledOps.size}/{mod.operations.length}
            </Badge>
          )}
        </button>
        <Switch
          checked={isOn}
          onCheckedChange={onToggleModule}
          aria-label={`Ativar módulo ${mod.label}`}
        />
      </div>

      {expanded && (
        <div className="mt-2 ml-6 flex flex-wrap gap-x-5 gap-y-1.5 pb-1">
          {mod.operations.map((op) => {
            const checked = enabledOps.has(op);
            return (
              <label
                key={op}
                className="flex items-center gap-1.5 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(val) =>
                    onToggleOperation(op, val === true)
                  }
                  aria-label={`${getOperationLabel(op)} em ${mod.label}`}
                />
                <span className={checked ? "" : "text-muted-foreground"}>
                  {getOperationLabel(op)}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
