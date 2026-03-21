// Types
export type {
  ApiResponse,
  Agent,
  AgentTool,
  AvailabilityConflict,
  AvailabilityResult,
  CalendarStatus,
  ContactUser,
  Conversation,
  GagentsContact,
  Objective,
  PromptVersion,
  Tool,
  ToolCredential,
  CapabilityOperation,
  CapabilityModule,
  CapabilityCategory,
  CapabilitiesResponse,
  AgentCapability,
  AgentCapabilitiesPayload,
} from "./types";

// Client
export { createGagentsClient } from "./client";
export type { GagentsClientConfig, GagentsClient } from "./client";

// Utils
export { cn } from "./lib";

// Hooks
export * from "./hooks";

// Components
export { AgentsTable } from "./components/agents/agents-table";
export { AgentFormDialog } from "./components/agents/agent-form-dialog";
export { AgentEditForm } from "./components/agents/agent-edit-form";
export { AgentTabs } from "./components/agents/agent-tabs";
export { AgentPromptEditor } from "./components/agents/agent-prompt-editor";
export { AgentObjectivesList } from "./components/agents/agent-objectives-list";
export { AgentToolsList } from "./components/agents/agent-tools-list";
export { ToolsTable } from "./components/tools/tools-table";
export { ToolFormDialog } from "./components/tools/tool-form-dialog";
export { ToolCredentialsForm } from "./components/tools/tool-credentials-form";
export { Sortable, SortableContent, SortableItem, SortableItemHandle, SortableOverlay } from "./components/ui/sortable";
export { AgentConversationsPanel } from "./components/conversations/agent-conversations-panel";
export { AgentConversationsTable } from "./components/conversations/agent-conversations-table";
export { ConversationView } from "./components/conversations/conversation-view";

// Capabilities
export { IntegrationCard } from "./components/capabilities/integration-card";
export type { IntegrationCardProps } from "./components/capabilities/integration-card";
export { IntegrationsTab } from "./components/capabilities/integrations-tab";
export type { IntegrationsTabProps } from "./components/capabilities/integrations-tab";
export { CapabilitiesTab } from "./components/capabilities/capabilities-tab";
export type { CapabilitiesTabProps } from "./components/capabilities/capabilities-tab";
export { AdvancedTab } from "./components/capabilities/advanced-tab";
export type { AdvancedTabProps } from "./components/capabilities/advanced-tab";
export { IntegrationWizard } from "./components/capabilities/integration-wizard";
export type { IntegrationWizardProps } from "./components/capabilities/integration-wizard";
export type {
  WizardIntegrationMeta,
  IntegrationCapability,
  WizardStep,
  OAuthStatus,
  OAuthResult,
} from "./components/capabilities/types";
export type { ConfigOption } from "./components/capabilities/wizard-steps/config-step";

// Data
export { INTEGRATIONS_REGISTRY } from "./data/integrations-registry";
export type {
  IntegrationDefinition,
  IntegrationAuthType,
  IntegrationStatus,
} from "./data/integrations-registry";

// Page Compositions
export * from "./pages";
