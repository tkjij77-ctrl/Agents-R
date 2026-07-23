/**
 * Agent Types - Core interfaces for all agents in the system
 */

import { Context, Effect } from "effect"

// ============================================================================
// Agent Identity & Roles
// ============================================================================

export type AgentRole =
  | "orchestrator"    // Manages task distribution
  | "coder"           // Writes code
  | "reviewer"        // Reviews code quality
  | "tester"          // Writes and runs tests
  | "architect"       // Designs system architecture
  | "researcher"      // Researches solutions
  | "debugger"        // Finds and fixes bugs
  | "documenter"      // Writes documentation
  | "specialist"      // Domain-specific expert

export type AgentStatus =
  | "idle"
  | "thinking"
  | "executing"
  | "consulting"
  | "waiting"
  | "error"
  | "completed"

export type AgentCapability =
  | "code-generation"
  | "code-review"
  | "testing"
  | "architecture"
  | "debugging"
  | "research"
  | "documentation"
  | "refactoring"
  | "security-audit"
  | "performance"

export interface AgentIdentity {
  readonly id: string
  readonly name: string
  readonly role: AgentRole
  readonly model: ModelConfig
  readonly capabilities: readonly AgentCapability[]
  readonly status: AgentStatus
  readonly maxConcurrency: number
  readonly metadata: Record<string, unknown>
}

// ============================================================================
// Model Configuration
// ============================================================================

export interface ModelConfig {
  readonly provider: string      // e.g., "anthropic", "openai", "google"
  readonly modelId: string       // e.g., "claude-sonnet-4-5", "gpt-4.1"
  readonly temperature?: number
  readonly maxTokens?: number
  readonly systemPrompt?: string
  readonly reasoningEffort?: "low" | "medium" | "high"
}

// ============================================================================
// Messages & Communication
// ============================================================================

export type MessageType =
  | "task-assign"       // Orchestrator assigns a task
  | "task-result"       // Agent reports task completion
  | "consultation"      // Agent asks another for advice
  | "consultation-reply" // Response to consultation
  | "delegation"        // Agent delegates sub-task
  | "delegation-result" // Result from delegated task
  | "consensus-request" // Request for team consensus
  | "consensus-vote"    // Agent's vote/opinion
  | "consensus-result"  // Final consensus decision
  | "broadcast"         // Message to all agents
  | "status-update"     // Agent status change
  | "error-report"      // Error notification

export interface AgentMessage {
  readonly id: string
  readonly type: MessageType
  readonly from: string          // Agent ID
  readonly to: string | "all"    // Agent ID or broadcast
  readonly timestamp: number
  readonly payload: unknown
  readonly replyTo?: string      // Message ID this replies to
  readonly sessionId: string     // Collaboration session
}

// ============================================================================
// Tasks & Results
// ============================================================================

export type TaskPriority = "critical" | "high" | "medium" | "low"
export type TaskStatus = "pending" | "assigned" | "in-progress" | "completed" | "failed" | "cancelled"

export interface Task {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly priority: TaskPriority
  readonly assignedTo: string           // Agent ID
  readonly delegatedBy?: string         // If delegated from another agent
  readonly parentTaskId?: string        // For sub-tasks
  readonly requiredCapabilities: readonly AgentCapability[]
  readonly context: TaskContext
  readonly status: TaskStatus
  readonly result?: TaskResult
  readonly createdAt: number
  readonly deadline?: number
}

export interface TaskContext {
  readonly files?: readonly string[]
  readonly codeSnippet?: string
  readonly error?: string
  readonly constraints?: readonly string[]
  readonly relatedMessages?: readonly string[]
  readonly previousAttempts?: readonly TaskResult[]
}

export interface TaskResult {
  readonly success: boolean
  readonly output: string
  readonly files?: readonly { path: string; content: string }[]
  readonly confidence: number           // 0-1
  readonly reasoning: string
  readonly suggestions?: readonly string[]
  readonly errors?: readonly string[]
  readonly tokensUsed: { input: number; output: number }
}

// ============================================================================
// Collaboration Session
// ============================================================================

export type CollaborationMode =
  | "orchestrated"     // Central orchestrator manages flow
  | "peer-review"      // Agents review each other's work
  | "consensus"        // All agents must agree
  | "competitive"      // Multiple agents try, best wins
  | "pipeline"         // Sequential handoff between agents

export interface CollaborationSession {
  readonly id: string
  readonly mode: CollaborationMode
  readonly agents: readonly AgentIdentity[]
  readonly orchestratorId: string
  readonly tasks: readonly Task[]
  readonly messages: readonly AgentMessage[]
  readonly status: "active" | "paused" | "completed" | "failed"
  readonly config: CollaborationConfig
  readonly createdAt: number
}

export interface CollaborationConfig {
  readonly maxRounds: number           // Max consultation rounds
  readonly consensusThreshold: number  // 0-1 agreement needed
  readonly timeoutMs: number           // Per-task timeout
  readonly enableDelegation: boolean   // Allow sub-agent delegation
  readonly maxDelegationDepth: number  // How deep delegation can go
  readonly sharedContext: boolean      // All agents see all messages
  readonly votingMode: "simple" | "weighted" | "expert"
}

// ============================================================================
// Consensus Types
// ============================================================================

export interface ConsensusRequest {
  readonly id: string
  readonly topic: string
  readonly question: string
  readonly options: readonly ConsensusOption[]
  readonly context: string
  readonly votingAgents: readonly string[]
  readonly status: "pending" | "voting" | "resolved" | "deadlocked"
  readonly votes: readonly ConsensusVote[]
  readonly result?: ConsensusResult
}

export interface ConsensusOption {
  readonly id: string
  readonly description: string
  readonly proposedBy: string   // Agent ID
}

export interface ConsensusVote {
  readonly agentId: string
  readonly optionId: string
  readonly confidence: number   // 0-1
  readonly reasoning: string
  readonly timestamp: number
}

export interface ConsensusResult {
  readonly winningOption: string
  readonly agreement: number    // 0-1
  readonly dissenting: readonly string[]  // Agent IDs
  readonly summary: string
}

// ============================================================================
// Event System
// ============================================================================

export type AgentEventType =
  | "agent-joined"
  | "agent-left"
  | "task-created"
  | "task-assigned"
  | "task-completed"
  | "task-failed"
  | "message-sent"
  | "consultation-started"
  | "consultation-completed"
  | "consensus-reached"
  | "consensus-deadlocked"
  | "delegation-created"
  | "delegation-completed"
  | "session-started"
  | "session-completed"
  | "session-error"

export interface AgentEvent {
  readonly id: string
  readonly type: AgentEventType
  readonly sessionId: string
  readonly timestamp: number
  readonly data: unknown
}
