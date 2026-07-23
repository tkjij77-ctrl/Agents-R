/**
 * Delegation System - Enables agents to delegate sub-tasks to other agents
 * 
 * An agent can delegate work when:
 * 1. The task requires a capability the agent doesn't have
 * 2. The agent is overloaded and needs help
 * 3. The task can be parallelized for efficiency
 * 
 * Supports delegation chains (agent A delegates to B, B delegates to C)
 * with configurable max depth.
 */

import { Effect } from "effect"
import type {
  AgentIdentity,
  Task,
  TaskResult,
  AgentMessage,
  AgentCapability,
} from "../agents/types/index.js"

// ============================================================================
// Delegation Types
// ============================================================================

export interface DelegationRequest {
  readonly id: string
  readonly fromAgent: string
  readonly toAgent: string
  readonly originalTask: Task
  readonly delegatedTask: Task
  readonly reason: string
  readonly depth: number
  readonly status: DelegationStatus
  readonly result?: TaskResult
  readonly createdAt: number
  readonly completedAt?: number
}

export type DelegationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "in-progress"
  | "completed"
  | "failed"
  | "timeout"

export interface DelegationConfig {
  readonly maxDepth: number           // Max delegation chain depth
  readonly timeoutMs: number          // Per-delegation timeout
  readonly autoAccept: boolean        // Auto-accept delegations
  readonly requireApproval: boolean   // Orchestrator must approve
}

// ============================================================================
// Delegation Engine
// ============================================================================

export class DelegationEngine {
  private delegations = new Map<string, DelegationRequest>()
  private delegationChains = new Map<string, string[]>() // parent -> chain of delegation IDs

  /**
   * Create a delegation request
   */
  static createDelegation(input: {
    fromAgent: AgentIdentity
    toAgent: AgentIdentity
    task: Task
    reason: string
    currentDepth: number
    config: DelegationConfig
  }): DelegationRequest {
    if (input.currentDepth >= input.config.maxDepth) {
      throw new Error(`Max delegation depth (${input.config.maxDepth}) exceeded`)
    }

    const id = `delegation_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    
    return {
      id,
      fromAgent: input.fromAgent.id,
      toAgent: input.toAgent.id,
      originalTask: input.task,
      delegatedTask: {
        ...input.task,
        id: `delegated_${id}`,
        delegatedBy: input.fromAgent.id,
        parentTaskId: input.task.id,
        assignedTo: input.toAgent.id,
        status: "pending",
      },
      reason: input.reason,
      depth: input.currentDepth + 1,
      status: "pending",
      createdAt: Date.now(),
    }
  }

  /**
   * Determine if a task should be delegated
   */
  static shouldDelegate(input: {
    agent: AgentIdentity
    task: Task
    availableAgents: readonly AgentIdentity[]
  }): { should: boolean; targetAgent?: AgentIdentity; reason: string } {
    const { agent, task, availableAgents } = input
    
    // Check if agent has all required capabilities
    const missingCaps = task.requiredCapabilities.filter(
      cap => !agent.capabilities.includes(cap)
    )
    
    if (missingCaps.length > 0) {
      // Find an agent with the missing capabilities
      const betterAgent = availableAgents.find(a => 
        a.id !== agent.id &&
        missingCaps.some(cap => a.capabilities.includes(cap)) &&
        a.status === "idle"
      )
      
      if (betterAgent) {
        return {
          should: true,
          targetAgent: betterAgent,
          reason: `Missing capabilities: ${missingCaps.join(", ")}. ${betterAgent.name} is better suited.`,
        }
      }
    }
    
    // Check if agent is overloaded
    if (agent.status === "executing" && agent.maxConcurrency <= 1) {
      const availableHelper = availableAgents.find(a =>
        a.id !== agent.id &&
        a.status === "idle" &&
        task.requiredCapabilities.some(cap => a.capabilities.includes(cap))
      )
      
      if (availableHelper) {
        return {
          should: true,
          targetAgent: availableHelper,
          reason: `Agent ${agent.name} is busy. ${availableHelper.name} can assist.`,
        }
      }
    }
    
    return { should: false, reason: "Agent can handle this task" }
  }

  /**
   * Create a delegation message
   */
  static createDelegationMessage(delegation: DelegationRequest): AgentMessage {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: "delegation",
      from: delegation.fromAgent,
      to: delegation.toAgent,
      timestamp: Date.now(),
      sessionId: "", // Will be set by caller
      payload: {
        delegationId: delegation.id,
        task: delegation.delegatedTask,
        reason: delegation.reason,
        depth: delegation.depth,
      },
    }
  }

  /**
   * Create a delegation result message
   */
  static createResultMessage(input: {
    delegation: DelegationRequest
    result: TaskResult
    sessionId: string
  }): AgentMessage {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: "delegation-result",
      from: input.delegation.toAgent,
      to: input.delegation.fromAgent,
      timestamp: Date.now(),
      sessionId: input.sessionId,
      replyTo: `msg_${input.delegation.id}`,
      payload: {
        delegationId: input.delegation.id,
        result: input.result,
      },
    }
  }
}

// ============================================================================
// Delegation Chain Management
// ============================================================================

export class DelegationChain {
  /**
   * Track a delegation chain
   */
  static trackChain(
    chains: Map<string, string[]>,
    parentTaskId: string,
    delegationId: string,
  ): void {
    const chain = chains.get(parentTaskId) ?? []
    chain.push(delegationId)
    chains.set(parentTaskId, chain)
  }

  /**
   * Get the full delegation history for a task
   */
  static getChain(
    delegations: Map<string, DelegationRequest>,
    rootTaskId: string,
  ): readonly DelegationRequest[] {
    const chain: DelegationRequest[] = []
    let currentId = rootTaskId
    
    for (const [, delegation] of delegations) {
      if (delegation.originalTask.id === currentId || delegation.delegatedTask.parentTaskId === currentId) {
        chain.push(delegation)
        currentId = delegation.delegatedTask.id
      }
    }
    
    return chain
  }

  /**
   * Check if a delegation would create a circular dependency
   */
  static wouldCreateCycle(
    delegations: Map<string, DelegationRequest>,
    fromAgent: string,
    toAgent: string,
    taskId: string,
  ): boolean {
    // Walk up the delegation chain to check if toAgent already delegated to fromAgent
    const visited = new Set<string>()
    visited.add(fromAgent)
    
    for (const [, delegation] of delegations) {
      if (delegation.originalTask.id === taskId && delegation.fromAgent === toAgent) {
        // Check if there's a path back to fromAgent
        if (delegation.toAgent === fromAgent) return true
      }
    }
    
    return false
  }
}
