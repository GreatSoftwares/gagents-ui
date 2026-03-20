import type {
  ApiResponse,
  Agent,
  AgentTool,
  AvailabilityResult,
  CalendarStatus,
  ContactUser,
  Conversation,
  GagentsContact,
  Objective,
  PromptVersion,
  Tool,
  ToolCredential,
} from "../types";

export interface GagentsClientConfig {
  baseUrl: string;
  token: string;
  language?: string;
  idWl?: number;
}

export function createGagentsClient(config: GagentsClientConfig) {
  const { baseUrl, token, language = "pt-br", idWl = 1 } = config;

  function buildUrl(idAccount: number, path: string): string {
    return `${baseUrl}/v1/${language}/${idWl}/accounts/${idAccount}/${path}`;
  }

  async function request<T>(
    method: string,
    idAccount: number,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    const url = new URL(buildUrl(idAccount, path));
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const res = await fetch(url.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let message = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errorBody = await res.json();
        message = errorBody.message || message;
      } catch {
        /* ignore parse errors */
      }
      throw new Error(message);
    }

    const json: ApiResponse<T> = await res.json();

    // For mutations, treat API-level failures as errors so TanStack Query
    // fires onError instead of onSuccess (API returns HTTP 200 even on failure)
    if (method !== "GET" && json.status === 0) {
      throw new Error(json.message || "Operação falhou");
    }

    return json;
  }

  return {
    // --- Agents ---
    listAgents: (idAccount: number, params?: Record<string, string>) =>
      request<Agent[]>("GET", idAccount, "agents", undefined, params),

    getAgent: (idAccount: number, id: number) =>
      request<Agent>("GET", idAccount, `agents/${id}`),

    createAgent: (
      idAccount: number,
      body: Pick<Agent, "title"> &
        Partial<Pick<Agent, "prompt" | "photo" | "delay_typing" | "waiting_time">>,
    ) => request<Agent>("POST", idAccount, "agents", body),

    updateAgent: (
      idAccount: number,
      id: number,
      body: Partial<
        Pick<Agent, "title" | "prompt" | "photo" | "delay_typing" | "waiting_time" | "active">
      >,
    ) => request<Agent>("PUT", idAccount, `agents/${id}`, body),

    deleteAgent: (idAccount: number, id: number) =>
      request<void>("DELETE", idAccount, `agents/${id}`),

    // --- Tools ---
    listTools: (idAccount: number, params?: Record<string, string>) =>
      request<Tool[]>("GET", idAccount, "tools", undefined, params),

    getTool: (idAccount: number, id: number) =>
      request<Tool>("GET", idAccount, `tools/${id}`),

    createTool: (
      idAccount: number,
      body: Pick<Tool, "name" | "type"> &
        Partial<Pick<Tool, "slug" | "description" | "auth_config" | "function_definitions">>,
    ) => request<Tool>("POST", idAccount, "tools", body),

    updateTool: (
      idAccount: number,
      id: number,
      body: Partial<
        Pick<Tool, "name" | "slug" | "type" | "description" | "auth_config" | "function_definitions">
      >,
    ) => request<Tool>("PUT", idAccount, `tools/${id}`, body),

    deleteTool: (idAccount: number, id: number) =>
      request<void>("DELETE", idAccount, `tools/${id}`),

    // --- Agent Tools ---
    listAgentTools: (idAccount: number, idAgent: number, params?: Record<string, string>) =>
      request<AgentTool[]>("GET", idAccount, `agents/${idAgent}/tools`, undefined, params),

    addAgentTool: (
      idAccount: number,
      idAgent: number,
      body: Pick<AgentTool, "id_tool"> &
        Partial<Pick<AgentTool, "enabled" | "custom_instructions" | "parameter_mappings" | "id_tool_credential">>,
    ) => request<AgentTool>("POST", idAccount, `agents/${idAgent}/tools`, body),

    updateAgentTool: (
      idAccount: number,
      idAgent: number,
      id: number,
      body: Partial<
        Pick<AgentTool, "enabled" | "custom_instructions" | "parameter_mappings" | "id_tool_credential">
      >,
    ) => request<AgentTool>("PUT", idAccount, `agents/${idAgent}/tools/${id}`, body),

    removeAgentTool: (idAccount: number, idAgent: number, id: number) =>
      request<void>("DELETE", idAccount, `agents/${idAgent}/tools/${id}`),

    // --- Objectives ---
    listObjectives: (idAccount: number, idAgent: number, params?: Record<string, string>) =>
      request<Objective[]>("GET", idAccount, `agents/${idAgent}/objectives`, undefined, params),

    getObjective: (idAccount: number, idAgent: number, id: number) =>
      request<Objective>("GET", idAccount, `agents/${idAgent}/objectives/${id}`),

    createObjective: (
      idAccount: number,
      idAgent: number,
      body: Pick<Objective, "title"> &
        Partial<Pick<Objective, "slug" | "prompt" | "order" | "active">>,
    ) => request<Objective>("POST", idAccount, `agents/${idAgent}/objectives`, body),

    updateObjective: (
      idAccount: number,
      idAgent: number,
      id: number,
      body: Partial<Pick<Objective, "title" | "slug" | "prompt" | "order" | "active">>,
    ) => request<Objective>("PUT", idAccount, `agents/${idAgent}/objectives/${id}`, body),

    deleteObjective: (idAccount: number, idAgent: number, id: number) =>
      request<void>("DELETE", idAccount, `agents/${idAgent}/objectives/${id}`),

    // --- Conversations ---
    listConversations: (idAccount: number, params?: Record<string, string>) =>
      request<Conversation[]>("GET", idAccount, "conversations", undefined, params),

    listAgentConversations: (idAccount: number, idAgent: number, params?: Record<string, string>) =>
      request<Conversation[]>("GET", idAccount, `agents/${idAgent}/conversations`, undefined, params),

    getConversation: (idAccount: number, id: number) =>
      request<Conversation>("GET", idAccount, `conversations/${id}`),

    // --- Prompt Versions ---
    listPromptVersions: (idAccount: number, idAgent: number, params?: Record<string, string>) =>
      request<PromptVersion[]>("GET", idAccount, `agents/${idAgent}/prompt-versions`, undefined, params),

    // --- Tool Credentials ---
    listToolCredentials: (idAccount: number, params?: Record<string, string>) =>
      request<ToolCredential[]>("GET", idAccount, "tool-credentials", undefined, params),

    createToolCredential: (
      idAccount: number,
      body: Pick<ToolCredential, "id_tool" | "label" | "credentials_encrypted"> &
        Partial<Pick<ToolCredential, "expires_at">>,
    ) => request<ToolCredential>("POST", idAccount, "tool-credentials", body),

    updateToolCredential: (
      idAccount: number,
      id: number,
      body: Partial<
        Pick<ToolCredential, "id_tool" | "label" | "credentials_encrypted" | "expires_at" | "status">
      >,
    ) => request<ToolCredential>("PUT", idAccount, `tool-credentials/${id}`, body),

    deleteToolCredential: (idAccount: number, id: number) =>
      request<void>("DELETE", idAccount, `tool-credentials/${id}`),

    // --- Contact Users ---
    listContactUsers: (idAccount: number, params?: Record<string, string>) =>
      request<ContactUser[]>("GET", idAccount, "contact-users", undefined, params),

    getContactUser: (idAccount: number, id: number) =>
      request<ContactUser>("GET", idAccount, `contact-users/${id}`),

    // --- Contacts ---
    listGagentsContacts: (idAccount: number, params?: Record<string, string>) =>
      request<GagentsContact[]>("GET", idAccount, "contacts", undefined, params),

    // --- Calendar Integration ---
    initiateCalendarConnect: (
      idAccount: number,
      body: { external_reference: string; provider?: string },
    ) => request<{ auth_url: string }>("POST", idAccount, "calendar/connect", body),

    getCalendarStatus: (
      idAccount: number,
      externalReference: string,
      provider = "google-calendar",
    ) =>
      request<CalendarStatus>(
        "GET",
        idAccount,
        `calendar/status/${encodeURIComponent(externalReference)}`,
        undefined,
        { provider },
      ),

    checkCalendarAvailability: (
      idAccount: number,
      body: { id_professional: number; start_time: string; end_time: string },
    ) => request<AvailabilityResult>("POST", idAccount, "calendar/availability", body),

    disconnectCalendar: (
      idAccount: number,
      externalReference: string,
      provider = "google-calendar",
    ) =>
      request<void>(
        "DELETE",
        idAccount,
        `calendar/disconnect/${encodeURIComponent(externalReference)}`,
        undefined,
        { provider },
      ),
  };
}

export type GagentsClient = ReturnType<typeof createGagentsClient>;
