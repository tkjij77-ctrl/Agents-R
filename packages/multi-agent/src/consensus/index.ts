/**
 * Consensus System - Enables agents to reach agreement on decisions
 * 
 * Supports multiple consensus mechanisms:
 * - Simple majority voting
 * - Weighted voting (by expertise/confidence)
 * - Expert override (domain expert has final say)
 * - Iterative refinement (agents discuss until consensus)
 */

import { Effect } from "effect"
import type {
  ConsensusRequest,
  ConsensusVote,
  ConsensusResult,
  ConsensusOption,
  AgentIdentity,
  AgentMessage,
} from "../agents/types/index.js"

// ============================================================================
// Consensus Engine Interface
// ============================================================================

export interface ConsensusEngineInterface {
  /** Start a new consensus request */
  readonly startConsensus: (request: Omit<ConsensusRequest, "votes" | "status" | "result" | "id">) => Effect.Effect<ConsensusRequest>
  
  /** Record an agent's vote */
  readonly castVote: (sessionId: string, request: string, vote: Omit<ConsensusVote, "timestamp">) => Effect.Effect<ConsensusRequest>
  
  /** Check if consensus has been reached */
  readonly checkConsensus: (sessionId: string, requestId: string) => Effect.Effect<ConsensusStatus>
  
  /** Force resolution (when stuck) */
  readonly forceResolve: (sessionId: string, requestId: string) => Effect.Effect<ConsensusResult>
}

export type ConsensusStatus =
  | { type: "pending"; votesReceived: number; votesNeeded: number }
  | { type: "reached"; result: ConsensusResult }
  | { type: "deadlocked"; result: ConsensusResult }

// ============================================================================
// Voting Strategies
// ============================================================================

export type VotingStrategy = "simple-majority" | "weighted" | "expert-override" | "supermajority"

export interface VotingConfig {
  readonly strategy: VotingStrategy
  readonly threshold: number           // 0-1 (e.g., 0.7 for 70% agreement)
  readonly maxRounds: number           // Discussion rounds before deadlock
  readonly expertRoles?: readonly string[]  // Roles that count as experts
}

// ============================================================================
// Consensus Engine Implementation
// ============================================================================

export class ConsensusEngine {
  private requests = new Map<string, ConsensusRequest>()
  
  /**
   * Create a new consensus request
   */
  static createRequest(input: {
    sessionId: string
    topic: string
    question: string
    options: readonly ConsensusOption[]
    context: string
    votingAgents: readonly AgentIdentity[]
    config: VotingConfig
  }): ConsensusRequest {
    return {
      id: `consensus_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      topic: input.topic,
      question: input.question,
      options: input.options,
      context: input.context,
      votingAgents: input.votingAgents.map(a => a.id),
      status: "pending",
      votes: [],
    }
  }

  /**
   * Evaluate votes and determine if consensus is reached
   */
  static evaluate(
    request: ConsensusRequest,
    config: VotingConfig,
    agents: readonly AgentIdentity[],
  ): ConsensusStatus {
    const votes = request.votes
    const totalVoters = request.votingAgents.length
    const votesReceived = votes.length
    
    // Not enough votes yet
    if (votesReceived < totalVoters) {
      return { type: "pending", votesReceived, votesNeeded: totalVoters }
    }
    
    // Calculate results based on strategy
    const result = calculateResult(votes, config, agents, request.options)
    
    // Check if threshold is met
    if (result.agreement >= config.threshold) {
      return { type: "reached", result }
    }
    
    return { type: "deadlocked", result }
  }

  /**
   * Create a consultation message (informal consensus)
   */
  static createConsultation(input: {
    fromAgent: string
    toAgents: readonly string[]
    sessionId: string
    topic: string
    question: string
    context: string
  }): AgentMessage {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: "consultation",
      from: input.fromAgent,
      to: input.toAgents.length === 1 ? input.toAgents[0]! : "all",
      timestamp: Date.now(),
      sessionId: input.sessionId,
      payload: {
        topic: input.topic,
        question: input.question,
        context: input.context,
      },
    }
  }

  /**
   * Create a consultation reply
   */
  static createConsultationReply(input: {
    fromAgent: string
    toAgent: string
    sessionId: string
    replyTo: string
    answer: string
    confidence: number
    reasoning: string
  }): AgentMessage {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: "consultation-reply",
      from: input.fromAgent,
      to: input.toAgent,
      timestamp: Date.now(),
      sessionId: input.sessionId,
      replyTo: input.replyTo,
      payload: {
        answer: input.answer,
        confidence: input.confidence,
        reasoning: input.reasoning,
      },
    }
  }
}

// ============================================================================
// Result Calculation
// ============================================================================

function calculateResult(
  votes: readonly ConsensusVote[],
  config: VotingConfig,
  agents: readonly AgentIdentity[],
  options: readonly ConsensusOption[],
): ConsensusResult {
  switch (config.strategy) {
    case "simple-majority":
      return calculateSimpleMajority(votes, options)
    case "weighted":
      return calculateWeightedVote(votes, agents, options)
    case "expert-override":
      return calculateExpertOverride(votes, agents, options, config.expertRoles ?? [])
    case "supermajority":
      return calculateSuperMajority(votes, options, config.threshold)
    default:
      return calculateSimpleMajority(votes, options)
  }
}

function calculateSimpleMajority(
  votes: readonly ConsensusVote[],
  options: readonly ConsensusOption[],
): ConsensusResult {
  const counts = new Map<string, number>()
  
  for (const vote of votes) {
    counts.set(vote.optionId, (counts.get(vote.optionId) ?? 0) + 1)
  }
  
  const totalVotes = votes.length
  let maxCount = 0
  let winningOption = ""
  
  for (const [optionId, count] of counts) {
    if (count > maxCount) {
      maxCount = count
      winningOption = optionId
    }
  }
  
  const agreement = totalVotes > 0 ? maxCount / totalVotes : 0
  const dissenting = votes.filter(v => v.optionId !== winningOption).map(v => v.agentId)
  const winningOptionData = options.find(o => o.id === winningOption)
  
  return {
    winningOption: winningOptionData?.description ?? winningOption,
    agreement,
    dissenting,
    summary: `${maxCount}/${totalVotes} agents agree on: ${winningOptionData?.description ?? winningOption}`,
  }
}

function calculateWeightedVote(
  votes: readonly ConsensusVote[],
  agents: readonly AgentIdentity[],
  options: readonly ConsensusOption[],
): ConsensusResult {
  const agentMap = new Map(agents.map(a => [a.id, a]))
  const weightedScores = new Map<string, number>()
  let totalWeight = 0
  
  for (const vote of votes) {
    const agent = agentMap.get(vote.agentId)
    // Weight = agent confidence * model quality
    const weight = vote.confidence * (agent ? getModelWeight(agent) : 0.5)
    weightedScores.set(vote.optionId, (weightedScores.get(vote.optionId) ?? 0) + weight)
    totalWeight += weight
  }
  
  let maxScore = 0
  let winningOption = ""
  
  for (const [optionId, score] of weightedScores) {
    if (score > maxScore) {
      maxScore = score
      winningOption = optionId
    }
  }
  
  const agreement = totalWeight > 0 ? maxScore / totalWeight : 0
  const dissenting = votes.filter(v => v.optionId !== winningOption).map(v => v.agentId)
  const winningOptionData = options.find(o => o.id === winningOption)
  
  return {
    winningOption: winningOptionData?.description ?? winningOption,
    agreement,
    dissenting,
    summary: `Weighted consensus: ${winningOptionData?.description ?? winningOption} (agreement: ${(agreement * 100).toFixed(0)}%)`,
  }
}

function calculateExpertOverride(
  votes: readonly ConsensusVote[],
  agents: readonly AgentIdentity[],
  options: readonly ConsensusOption[],
  expertRoles: readonly string[],
): ConsensusResult {
  const agentMap = new Map(agents.map(a => [a.id, a]))
  
  // Find expert votes
  const expertVotes = votes.filter(v => {
    const agent = agentMap.get(v.agentId)
    return agent && expertRoles.includes(agent.role)
  })
  
  // If experts agree, they override
  if (expertVotes.length > 0) {
    const expertOption = expertVotes[0]!.optionId
    const allExpertsAgree = expertVotes.every(v => v.optionId === expertOption)
    
    if (allExpertsAgree) {
      const winningOptionData = options.find(o => o.id === expertOption)
      const dissenting = votes.filter(v => v.optionId !== expertOption).map(v => v.agentId)
      
      return {
        winningOption: winningOptionData?.description ?? expertOption,
        agreement: 1.0,
        dissenting,
        summary: `Expert override: ${winningOptionData?.description ?? expertOption}`,
      }
    }
  }
  
  // Fall back to weighted vote
  return calculateWeightedVote(votes, agents, options)
}

function calculateSuperMajority(
  votes: readonly ConsensusVote[],
  options: readonly ConsensusOption[],
  threshold: number,
): ConsensusResult {
  const base = calculateSimpleMajority(votes, options)
  
  if (base.agreement < threshold) {
    return {
      ...base,
      summary: `Supermajority not reached (${(base.agreement * 100).toFixed(0)}% < ${(threshold * 100).toFixed(0)}% required): ${base.winningOption}`,
    }
  }
  
  return base
}

function getModelWeight(agent: AgentIdentity): number {
  const modelWeights: Record<string, number> = {
    "opus": 1.0,
    "gpt-4.1": 0.95,
    "gemini-2.5-pro": 0.92,
    "sonnet": 0.85,
    "gpt-4.1-mini": 0.75,
    "gemini-2.5-flash": 0.78,
    "haiku": 0.60,
  }
  
  const modelId = agent.model.modelId.toLowerCase()
  for (const [key, weight] of Object.entries(modelWeights)) {
    if (modelId.includes(key)) return weight
  }
  
  return 0.70
}
