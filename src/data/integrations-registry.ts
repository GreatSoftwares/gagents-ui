export type IntegrationAuthType = "oauth2" | "api_key" | "none";
export type IntegrationStatus = "available" | "coming_soon";

export interface IntegrationDefinition {
  slug: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  authType: IntegrationAuthType;
  status: IntegrationStatus;
}

export const INTEGRATIONS_REGISTRY: IntegrationDefinition[] = [
  {
    slug: "google-calendar",
    name: "Google Agenda",
    description: "Sincronize agendamentos com o Google Calendar",
    icon: "CalendarSync",
    authType: "oauth2",
    status: "available",
  },
  // Future integrations — add entries here without code changes
];
