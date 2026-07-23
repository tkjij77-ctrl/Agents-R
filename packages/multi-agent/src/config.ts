/**
 * Agents R - Configuration
 * 
 * Default configuration for the multi-agent system.
 * This can be overridden via opencode.json or environment variables.
 */

import type { AgentRole, AgentCapability, ModelConfig, CollaborationConfig } from "./agents/types/index.js"

// ============================================================================
// Agent Configuration
// ============================================================================

export interface AgentConfig {
  readonly name: string
  readonly role: AgentRole
  readonly model: ModelConfig
  readonly capabilities: readonly AgentCapability[]
  readonly maxConcurrency: number
  readonly metadata?: Record<string, unknown>
}

// ============================================================================
// Default Agent Team
// ============================================================================

export const defaultAgentTeam: readonly AgentConfig[] = [
  {
    name: "Architect",
    role: "architect",
    model: {
      provider: "anthropic",
      modelId: "claude-sonnet-4-5",
      temperature: 0.3,
      reasoningEffort: "high",
    },
    capabilities: ["architecture", "code-review", "documentation"],
    maxConcurrency: 2,
  },
  {
    name: "Coder",
    role: "coder",
    model: {
      provider: "openai",
      modelId: "gpt-4.1",
      temperature: 0.2,
    },
    capabilities: ["code-generation", "refactoring", "debugging"],
    maxConcurrency: 3,
  },
  {
    name: "Reviewer",
    role: "reviewer",
    model: {
      provider: "google",
      modelId: "gemini-2.5-pro",
      temperature: 0.1,
    },
    capabilities: ["code-review", "security-audit", "performance"],
    maxConcurrency: 2,
  },
  {
    name: "Tester",
    role: "tester",
    model: {
      provider: "anthropic",
      modelId: "claude-haiku-4-5",
      temperature: 0.1,
    },
    capabilities: ["testing", "debugging", "code-review"],
    maxConcurrency: 3,
  },
]

// ============================================================================
// Default Collaboration Config
// ============================================================================

export const defaultCollaborationConfig: CollaborationConfig = {
  maxRounds: 10,
  consensusThreshold: 0.7,
  timeoutMs: 120_000,
  enableDelegation: true,
  maxDelegationDepth: 3,
  sharedContext: true,
  votingMode: "weighted",
}

// ============================================================================
// System Config
// ============================================================================

export interface AgentsRConfig {
  readonly version: string
  readonly agents: readonly AgentConfig[]
  readonly collaboration: CollaborationConfig
  readonly features: {
    readonly multiModel: boolean
    readonly consensus: boolean
    readonly delegation: boolean
    readonly peerReview: boolean
    readonly costTracking: boolean
    readonly performanceMetrics: boolean
  }
}

export const defaultConfig: AgentsRConfig = {
  version: "0.1.0",
  agents: defaultAgentTeam,
  collaboration: defaultCollaborationConfig,
  features: {
    multiModel: true,
    consensus: true,
    delegation: true,
    peerReview: true,
    costTracking: false,  // TODO
    performanceMetrics: false,  // TODO
  },
}

/**
 * Load configuration from file or environment
 */
export function loadConfig(overrides?: Partial<AgentsRConfig>): AgentsRConfig {
  // In a real implementation, this would read from opencode.json
  // For now, return defaults with optional overrides
  return {
    ...defaultConfig,
    ...overrides,
    features: {
      ...defaultConfig.features,
      ...overrides?.features,
    },
    collaboration: {
      ...defaultConfig.collaboration,
      ...overrides?.collaboration,
    },
    agents: overrides?.agents ?? defaultConfig.agents,
  }
}
