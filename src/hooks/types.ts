import { useMemo } from "react";
import { createGagentsClient } from "../client";

// ---------------------------------------------------------------------------
// Hook Configuration
// ---------------------------------------------------------------------------

export interface GagentsHookConfig {
  accountId: number;
  token: string;
  baseUrl: string;
  language?: string;
  idWl?: number;
}

// ---------------------------------------------------------------------------
// Internal helper — memoized client from config
// ---------------------------------------------------------------------------

export function useGagentsClient(config: GagentsHookConfig) {
  return useMemo(
    () =>
      createGagentsClient({
        baseUrl: config.baseUrl,
        token: config.token,
        language: config.language,
        idWl: config.idWl,
      }),
    [config.baseUrl, config.token, config.language, config.idWl],
  );
}
