# CLAUDE.md — @greatapps/greatagents-ui

## Overview

Shared agents UI package for gclinic-r3-app and gclinic-r3-admin-app. Provides agent types, API client factory, and TanStack Query hooks.

TypeScript package in the @greatapps ecosystem with tsup build step (same pattern as @greatapps/greatchat-ui).

## Build

```bash
cd gagents/gagents-ui
bun install
bun run build    # ESM output in dist/
bun run dev      # Watch mode
```

## Exports

```typescript
// Types
import type {
  ApiResponse, Agent, AgentTool, Conversation, GagentsContact,
  Objective, PromptVersion, Tool, ToolCredential, ContactUser,
  CalendarStatus, AvailabilityResult, AvailabilityConflict
} from "@greatapps/greatagents-ui";

// API Client Factory
import { createGagentsClient } from "@greatapps/greatagents-ui";
import type { GagentsClientConfig, GagentsClient } from "@greatapps/greatagents-ui";

// Hooks
import { useAgents, useAgent, useCreateAgent, useUpdateAgent, useDeleteAgent } from "@greatapps/greatagents-ui";
import { useTools, useTool, useCreateTool, useUpdateTool, useDeleteTool } from "@greatapps/greatagents-ui";
import { useObjectives, useCreateObjective, useUpdateObjective, useDeleteObjective } from "@greatapps/greatagents-ui";
import { useAgentTools, useAddAgentTool, useRemoveAgentTool, useUpdateAgentTool } from "@greatapps/greatagents-ui";
import { useConversations, useAgentConversations, useConversation } from "@greatapps/greatagents-ui";
import { usePromptVersions, useToolCredentials, useCreateToolCredential, useUpdateToolCredential, useDeleteToolCredential, useContactUsers } from "@greatapps/greatagents-ui";
import { useGagentsContacts } from "@greatapps/greatagents-ui";

// Utility
import { cn } from "@greatapps/greatagents-ui";
```

## Consuming Patterns

### API Client (Next.js app)

```typescript
// lib/gagents-client.ts (bridge)
import { createGagentsClient } from "@greatapps/greatagents-ui";
import { GAGENTS_API_URL } from "./constants";

export function useGagentsClient() {
  const { gauthToken } = useAuth();
  return createGagentsClient({
    baseUrl: GAGENTS_API_URL,
    token: gauthToken,
  });
}
```

### Hooks Usage

All hooks take `GagentsHookConfig` as their first parameter:

```typescript
const config: GagentsHookConfig = {
  accountId: idAccount,
  token: gauthToken,
  baseUrl: GAGENTS_API_URL,
};

const { data } = useAgents(config);
const { data } = useAgent(config, agentId);
const createAgent = useCreateAgent(config);
```

### Factory Config

```typescript
const client = createGagentsClient({
  baseUrl: "https://gagents-r3-api.greatlabs.workers.dev",
  token: gauthToken,
  language: "pt-br",  // default
  idWl: 1,            // default
});

// All methods receive idAccount as first param
const agents = await client.listAgents(accountId);
const agent = await client.getAgent(accountId, agentId);
await client.createAgent(accountId, { title: "New Agent" });
```

## Architecture

- `src/types/` — Agent interfaces (Agent, Tool, Objective, AgentTool, Conversation, PromptVersion, ToolCredential, ContactUser, GagentsContact, CalendarStatus, AvailabilityResult, ApiResponse)
- `src/client/` — `createGagentsClient()` factory with closure over config
- `src/hooks/` — TanStack Query hooks with `GagentsHookConfig` pattern (no useAuth dependency)
- `src/lib/` — cn() utility (clsx + tailwind-merge)

## Peer Dependencies

react ^19, react-dom ^19, @tanstack/react-query ^5, @tanstack/react-table ^8, @greatapps/greatauth-ui *

## Notes

- `"files": ["dist", "src"]` — includes src/ so transpilePackages + Tailwind v4 can scan source files
- All peer deps are externalized in tsup config
- ESM-only output (no CJS)
- `idAccount` is a parameter to each client method (not in factory config) to support multi-account scenarios
- All query keys start with `"greatagents"` prefix
- Hooks use config pattern instead of useAuth() for portability across apps
- Client throws on `status === 0` for non-GET methods (mutations)
