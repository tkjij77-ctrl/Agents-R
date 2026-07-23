/**
 * OrchestratorService - Main orchestrator implementation
 * 
 * Coordinates the multi-agent workflow:
 * - Receives user requests
 * - Plans task decomposition
 * - Selects and assigns agents
 * - Manages execution flow
 * - Handles consultations between agents
 * - Synthesizes final results
 */

import { Context, Effect, Ref, HashMap, Queue } from "effect"
import type {
  AgentIdentity,
  AgentMessage,
  AgentRole,
  CollaborationConfig,
  CollaborationSession,
  Task,
  TaskResult,
  TaskStatus,
  AgentEvent,
  AgentEventType,
} from "../agents/types/index.js"

// ============================================================================
// Orchestrator State
// ============================================================================

interface OrchestratorState {
  readonly session: CollaborationSession | null
  readonly pendingTasks: Map<string, Task>
  readonly completedTasks: Map<string, Task>
  readonly agentStatuses: Map<string, AgentIdentity["status"]>
  readonly messageHistory: AgentMessage[]
  readonly events: AgentEvent[]
  readonly currentRound: number
}

// ============================================================================
// Orchestrator Interface
// ============================================================================

export interface OrchestratorInterface {
  /** Initialize a new collaboration session */
  readonly initSession: (input: {
    agents: AgentIdentity[]
    mode: CollaborationSession["mode"]
    config?: Partial<CollaborationConfig>
  }) => Effect.Effect<CollaborationSession>

  /** Submit a new request to be processed */
  readonly submitRequest: (input: {
    sessionId: string
    request: string
    context?: Record<string, unknown>
  }) => Effect.Effect<readonly Task[]>

  /** Process the next step in the collaboration */
  readonly step: (sessionId: string) => Effect.Effect<OrchestratorStepResult>

  /** Handle a message from an agent */
  readonly handleMessage: (message: AgentMessage) => Effect.Effect<void>

  /** Get current session state */
  readonly getSession: (sessionId: string) => Effect.Effect<CollaborationSession | null>

  /** Get all tasks (optionally filtered by status) */
  readonly getTasks: (sessionId: string, status?: TaskStatus) => Effect.Effect<readonly Task[]>

  /** Interrupt current execution */
  readonly interrupt: (sessionId: string) => Effect.Effect<void>

  /** Resume a paused session */
  readonly resume: (sessionId: string) => Effect.Effect<void>

  /** Get event stream */
  readonly events: (sessionId: string) => Effect.Effect<readonly AgentEvent[]>
}

// ============================================================================
// Step Result
// ============================================================================

export interface OrchestratorStepResult {
  readonly action: StepAction
  readonly tasksAssigned: readonly Task[]
  readonly tasksCompleted: readonly Task[]
  readonly messagesSent: readonly AgentMessage[]
  readonly sessionStatus: CollaborationSession["status"]
  readonly summary: string
}

export type StepAction =
  | { type: "plan"; tasks: readonly Task[] }
  | { type: "execute"; agentId: string; task: Task }
  | { type: "consult"; from: string; to: string; topic: string }
  | { type: "synthesize"; results: readonly TaskResult[] }
  | { type: "complete"; finalResult: string }
  | { type: "wait"; reason: string }
  | { type: "error"; error: string }

// ============================================================================
// Service Definition
// ============================================================================

export class OrchestratorServiceContext extends Context.Service<
  OrchestratorServiceContext,
  OrchestratorInterface
>()("@agents-r/Orchestrator") {}

// ============================================================================
// Implementation
// ============================================================================

const defaultConfig: CollaborationConfig = {
  maxRounds: 10,
  consensusThreshold: 0.7,
  timeoutMs: 120_000,
  enableDelegation: true,
  maxDelegationDepth: 3,
  sharedContext: true,
  votingMode: "weighted",
}

export const createOrchestrator = Effect.gen(function* () {
  const sessions = new Map<string, CollaborationSession>()
  const states = new Map<string, OrchestratorState>()
  const eventQueues = new Map<string, Queue.Unbounded<AgentEvent>>()

  const createInitialState = (session: CollaborationSession): OrchestratorState => ({
    session,
    pendingTasks: new Map(),
    completedTasks: new Map(),
    agentStatuses: new Map(session.agents.map(a => [a.id, "idle" as const])),
    messageHistory: [],
    events: [],
    currentRound: 0,
  })

  const emitEvent = (sessionId: string, type: AgentEventType, data: unknown): Effect.Effect<AgentEvent> =>
    Effect.gen(function* () {
      const state = states.get(sessionId)
      if (!state) return yield* Effect.fail(new Error(`Session ${sessionId} not found`))
      
      const event: AgentEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type,
        sessionId,
        timestamp: Date.now(),
        data,
      }
      
      state.events.push(event)
      const queue = eventQueues.get(sessionId)
      if (queue) yield* Queue.offer(queue, event)
      
      return event
    })

  return {
    sessions,
    states,
    eventQueues,
    createInitialState,
    emitEvent,
  }
})

/**
 * Orchestrator factory - creates a new orchestrator instance
 */
export const Orchestrator = {
  create: () => createOrchestrator,

  /**
   * Analyzes a user request and determines the collaboration strategy
   */
  analyzeRequest: (request: string, agents: readonly AgentIdentity[]) => {
    return Effect.gen(function* () {
      // Determine task complexity
      const complexity = estimateComplexity(request)
      
      // Select agents based on task requirements
      const requiredCapabilities = inferCapabilities(request)
      const suitableAgents = agents.filter(a =>
        a.capabilities.some(c => requiredCapabilities.includes(c))
      )
      
      // Determine collaboration mode
      const mode = determineMode(complexity, suitableAgents.length)
      
      return { complexity, requiredCapabilities, suitableAgents, mode }
    })
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

type Complexity = "simple" | "moderate" | "complex"

function estimateComplexity(request: string): Complexity {
  const words = request.split(/\s+/).length
  const hasMultipleParts = /(?:and|then|also|additionally|plus)\b/i.test(request)
  const hasCodeBlock = /```|code|function|class|interface/.test(request)
  
  if (words < 20 && !hasMultipleParts && !hasCodeBlock) return "simple"
  if (words < 100 && !hasMultipleParts) return "moderate"
  return "complex"
}

function inferCapabilities(request: string): string[] {
  const caps: string[] = []
  const lower = request.toLowerCase()
  
  if (/(write|create|implement|build|make|add)/.test(lower)) caps.push("code-generation")
  if (/(review|check|improve|refactor|optimize)/.test(lower)) caps.push("code-review", "refactoring")
  if (/(test|verify|validate|ensure)/.test(lower)) caps.push("testing")
  if (/(design|architect|plan|structure)/.test(lower)) caps.push("architecture")
  if (/(debug|fix|error|bug|issue)/.test(lower)) caps.push("debugging")
  if (/(research|find|look|explore)/.test(lower)) caps.push("research")
  if (/(document|explain|describe|README)/.test(lower)) caps.push("documentation")
  if (/(security|vulnerability|auth)/.test(lower)) caps.push("security-audit")
  if (/(performance|speed|optimize|fast)/.test(lower)) caps.push("performance")
  
  // Default to code generation if nothing specific
  if (caps.length === 0) caps.push("code-generation")
  
  return caps
}

function determineMode(complexity: Complexity, agentCount: number): CollaborationSession["mode"] {
  if (complexity === "simple") return "orchestrated"
  if (complexity === "moderate" && agentCount >= 3) return "peer-review"
  if (complexity === "complex" && agentCount >= 2) return "consensus"
  return "orchestrated"
}
