// Config & Client
export { type GagentsHookConfig, useGagentsClient } from "./types";

// Agents
export { useAgents, useAgent, useCreateAgent, useUpdateAgent, useDeleteAgent } from "./use-agents";

// Tools
export { useTools, useTool, useCreateTool, useUpdateTool, useDeleteTool } from "./use-tools";

// Objectives
export { useObjectives, useCreateObjective, useUpdateObjective, useDeleteObjective } from "./use-objectives";

// Agent Tools
export { useAgentTools, useAddAgentTool, useRemoveAgentTool, useUpdateAgentTool } from "./use-agent-tools";

// Conversations
export { useConversations, useAgentConversations, useConversation } from "./use-conversations";

// Settings (Prompt Versions, Tool Credentials, Contact Users)
export {
  usePromptVersions,
  useToolCredentials,
  useCreateToolCredential,
  useUpdateToolCredential,
  useDeleteToolCredential,
  useContactUsers,
} from "./use-settings";

// Contacts
export { useGagentsContacts } from "./use-contacts";

// Capabilities
export { useCapabilities, useAgentCapabilities, useUpdateAgentCapabilities } from "./use-capabilities";

// Integrations
export {
  useIntegrationState,
  type IntegrationCardState,
  type IntegrationCardData,
} from "./use-integrations";
