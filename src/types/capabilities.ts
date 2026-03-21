export interface CapabilityOperation {
    slug: string;
    label: string;
    description: string;
}

export interface CapabilityModule {
    slug: string;
    label: string;
    description: string;
    operations: string[];
}

export interface CapabilityCategory {
    slug: string;
    label: string;
    modules: CapabilityModule[];
}

export interface CapabilitiesResponse {
    product: string | null;
    categories: CapabilityCategory[];
}

export interface AgentCapability {
    module: string;
    operations: string[];
}

export interface AgentCapabilitiesPayload {
    capabilities: AgentCapability[];
}
