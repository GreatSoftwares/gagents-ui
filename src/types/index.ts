export interface ApiResponse<T = unknown> {
  status: 0 | 1;
  message?: string;
  data?: T;
  total?: number;
}

export interface Agent {
  id: number;
  id_account: number;
  title: string;
  photo: string | null;
  external_token: string | null;
  openai_assistant_id: string | null;
  delay_typing: number | null;
  waiting_time: number | null;
  active: boolean;
  deleted: number;
  datetime_add: string;
  datetime_alt: string | null;
}

export interface Objective {
  id: number;
  id_account: number;
  id_agent: number;
  title: string;
  slug: string | null;
  prompt: string | null;
  order: number;
  active: boolean;
  deleted: number;
  datetime_add: string;
  datetime_alt: string | null;
}

export interface Tool {
  id: number;
  id_account: number;
  name: string;
  slug: string | null;
  type: string;
  description: string | null;
  auth_config: string | null;
  function_definitions: string | null;
  deleted: number;
  datetime_add: string;
  datetime_alt: string | null;
}

export interface AgentTool {
  id: number;
  id_account: number;
  id_agent: number;
  id_tool: number;
  id_tool_credential: number | null;
  enabled: boolean;
  parameter_mappings: string | null;
  custom_instructions: string | null;
  deleted: number;
  datetime_add: string;
  datetime_alt: string | null;
}

export interface Conversation {
  id: number;
  id_account: number;
  id_agent: number | null;
  id_objective: number | null;
  id_contact: number;
  id_external: number | null;
  key_memory: string | null;
  openai_thread_id: string | null;
  openai_assistant_id: string | null;
  system_prompt_hash: string | null;
  message_count: number;
  usage_tokens: number;
  context_summary: string | null;
  last_thread_rotation: string | null;
  rotation_count: number;
  deleted: number;
  datetime_add: string;
  datetime_alt: string | null;
}

export interface PromptVersion {
  id: number;
  id_account: number;
  id_agent: number;
  version_number: number;
  prompt_content: string;
  prompt_hash: string;
  is_current: boolean;
  change_notes: string | null;
  deleted: number;
  datetime_add: string;
}

export interface ToolCredential {
  id: number;
  id_account: number;
  id_tool: number;
  id_platform_integration: number | null;
  external_reference: string | null;
  label: string;
  credentials_encrypted: string;
  expires_at: string | null;
  status: "active" | "expired" | "inactive";
  authorized_by_contact: number | null;
  deleted: number;
  datetime_add: string;
  datetime_alt: string | null;
}

export interface ContactUser {
  id: number;
  id_account: number;
  id_contact: number;
  id_user: number;
  role: string;
  authorized_at: string | null;
  deleted: number;
  datetime_add: string;
  datetime_alt: string | null;
}

export interface CalendarStatus {
  connected: boolean;
  provider?: string;
  email?: string;
  expires_at?: string;
}

export interface GagentsContact {
  id: number;
  id_account: number;
  id_external: number | null;
  name: string;
  email: string | null;
  phone_number: string | null;
  identifier: string | null;
  key_memory: string | null;
  deleted: number;
  datetime_add: string;
  datetime_alt: string | null;
}

export interface AvailabilityConflict {
  provider: string;
  start: string;
  end: string;
}

export interface AvailabilityResult {
  available: boolean;
  conflicts: AvailabilityConflict[];
  failed_providers: Array<{ provider: string; error: string }>;
}

// Capabilities
export type {
  CapabilityOperation,
  CapabilityModule,
  CapabilityCategory,
  CapabilitiesResponse,
  AgentCapability,
  AgentCapabilitiesPayload,
} from "./capabilities";
