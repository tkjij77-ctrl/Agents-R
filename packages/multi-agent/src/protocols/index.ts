/**
 * Protocols - Communication protocols for multi-agent interaction
 * 
 * Defines standard protocols for:
 * 1. Task assignment and acknowledgment
 * 2. Consultation (agent-to-agent advice)
 * 3. Consensus (team decision-making)
 * 4. Delegation (sub-task handoff)
 * 5. Error recovery
 */

import type { AgentMessage, AgentIdentity, Task, TaskResult, ConsensusRequest } from "../agents/types/index.js"

// ============================================================================
// Protocol Definitions
// ============================================================================

/**
 * Task Assignment Protocol
 * 
 * Flow:
 * 1. Orchestrator -> Agent: task-assign
 * 2. Agent -> Orchestrator: status-update (accepted)
 * 3. Agent -> Orchestrator: task-result (completed)
 * OR
 * 2. Agent -> Orchestrator: error-report (rejected/failed)
 */
export interface TaskAssignmentProtocol {
  readonly assign: (task: Task, agentId: string) => AgentMessage
  readonly accept: (taskId: string, agentId: string) => AgentMessage
  readonly reject: (taskId: string, agentId: string, reason: string) => AgentMessage
  readonly complete: (taskId: string, agentId: string, result: TaskResult) => AgentMessage
  readonly fail: (taskId: string, agentId: string, error: string) => AgentMessage
}

/**
 * Consultation Protocol
 * 
 * Flow:
 * 1. Agent A -> Agent B: consultation (asking for advice)
 * 2. Agent B -> Agent A: consultation-reply (providing answer)
 * 
 * Multiple agents can be consulted in parallel.
 */
export interface ConsultationProtocol {
  readonly request: (from: string, to: string[], topic: string, question: string, context: string) => AgentMessage
  readonly reply: (from: string, to: string, replyTo: string, answer: string, confidence: number, reasoning: string) => AgentMessage
}

/**
 * Consensus Protocol
 * 
 * Flow:
 * 1. Initiator -> All: consensus-request (presenting options)
 * 2. Each Agent -> Initiator: consensus-vote (their opinion)
 * 3. Initiator -> All: consensus-result (final decision)
 */
export interface ConsensusProtocol {
  readonly request: (initiator: string, agents: string[], request: ConsensusRequest) => AgentMessage
  readonly vote: (agentId: string, request: string, optionId: string, confidence: number, reasoning: string) => AgentMessage
  readonly result: (initiator: string, agents: string[], consensusId: string, winningOption: string, agreement: number) => AgentMessage
}

/**
 * Delegation Protocol
 * 
 * Flow:
 * 1. Agent A -> Agent B: delegation (delegating a sub-task)
 * 2. Agent B -> Agent A: status-update (accepted)
 * 3. Agent B -> Agent A: delegation-result (completed)
 */
export interface DelegationProtocol {
  readonly delegate: (from: string, to: string, task: Task, reason: string, depth: number) => AgentMessage
  readonly accept: (delegationId: string, agentId: string) => AgentMessage
  readonly reject: (delegationId: string, agentId: string, reason: string) => AgentMessage
  readonly result: (delegationId: string, agentId: string, result: TaskResult) => AgentMessage
}

// ============================================================================
// Protocol Implementations
// ============================================================================

export const TaskAssignment: TaskAssignmentProtocol = {
  assign(task, agentId) {
    return {
      id: genId(),
      type: "task-assign",
      from: "orchestrator",
      to: agentId,
      timestamp: Date.now(),
      sessionId: "",
      payload: { task, instructions: task.description, priority: task.priority },
    }
  },
  accept(taskId, agentId) {
    return {
      id: genId(),
      type: "status-update",
      from: agentId,
      to: "orchestrator",
      timestamp: Date.now(),
      sessionId: "",
      payload: { taskId, status: "accepted" },
    }
  },
  reject(taskId, agentId, reason) {
    return {
      id: genId(),
      type: "error-report",
      from: agentId,
      to: "orchestrator",
      timestamp: Date.now(),
      sessionId: "",
      payload: { taskId, status: "rejected", reason },
    }
  },
  complete(taskId, agentId, result) {
    return {
      id: genId(),
      type: "task-result",
      from: agentId,
      to: "orchestrator",
      timestamp: Date.now(),
      sessionId: "",
      payload: { taskId, result },
    }
  },
  fail(taskId, agentId, error) {
    return {
      id: genId(),
      type: "error-report",
      from: agentId,
      to: "orchestrator",
      timestamp: Date.now(),
      sessionId: "",
      payload: { taskId, status: "failed", error },
    }
  },
}

export const Consultation: ConsultationProtocol = {
  request(from, to, topic, question, context) {
    return {
      id: genId(),
      type: "consultation",
      from,
      to: to.length === 1 ? to[0]! : "all",
      timestamp: Date.now(),
      sessionId: "",
      payload: { topic, question, context, requestedFrom: to },
    }
  },
  reply(from, to, replyTo, answer, confidence, reasoning) {
    return {
      id: genId(),
      type: "consultation-reply",
      from,
      to,
      timestamp: Date.now(),
      sessionId: "",
      replyTo,
      payload: { answer, confidence, reasoning },
    }
  },
}

export const Consensus: ConsensusProtocol = {
  request(initiator, agents, req) {
    return {
      id: genId(),
      type: "consensus-request",
      from: initiator,
      to: "all",
      timestamp: Date.now(),
      sessionId: "",
      payload: { consensusId: req.id, topic: req.topic, question: req.question, options: req.options, context: req.context, votingAgents: agents },
    }
  },
  vote(agentId, requestId, optionId, confidence, reasoning) {
    return {
      id: genId(),
      type: "consensus-vote",
      from: agentId,
      to: "orchestrator",
      timestamp: Date.now(),
      sessionId: "",
      payload: { consensusId: requestId, optionId, confidence, reasoning },
    }
  },
  result(initiator, agents, consensusId, winningOption, agreement) {
    return {
      id: genId(),
      type: "consensus-result",
      from: initiator,
      to: "all",
      timestamp: Date.now(),
      sessionId: "",
      payload: { consensusId, winningOption, agreement, agents },
    }
  },
}

export const Delegation: DelegationProtocol = {
  delegate(from, to, task, reason, depth) {
    return {
      id: genId(),
      type: "delegation",
      from,
      to,
      timestamp: Date.now(),
      sessionId: "",
      payload: { delegationId: genId(), task, reason, depth },
    }
  },
  accept(delegationId, agentId) {
    return {
      id: genId(),
      type: "status-update",
      from: agentId,
      to: "orchestrator",
      timestamp: Date.now(),
      sessionId: "",
      payload: { delegationId, status: "accepted" },
    }
  },
  reject(delegationId, agentId, reason) {
    return {
      id: genId(),
      type: "error-report",
      from: agentId,
      to: "orchestrator",
      timestamp: Date.now(),
      sessionId: "",
      payload: { delegationId, status: "rejected", reason },
    }
  },
  result(delegationId, agentId, result) {
    return {
      id: genId(),
      type: "delegation-result",
      from: agentId,
      to: "orchestrator",
      timestamp: Date.now(),
      sessionId: "",
      payload: { delegationId, result },
    }
  },
}

// ============================================================================
// Helpers
// ============================================================================

function genId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
