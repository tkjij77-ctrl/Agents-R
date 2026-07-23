/**
 * AgentSelector - Selects the best agent for each task
 * 
 * Uses a scoring algorithm that considers:
 * 1. Capability match
 * 2. Current workload
 * 3. Historical performance
 * 4. Model suitability for the task type
 * 5. Cost efficiency
 */

import { Effect } from "effect"
import type { AgentIdentity, AgentCapability, Task } from "../agents/types/index.js"

// ============================================================================
// Selection Result
// ============================================================================

export interface AgentSelection {
  readonly taskId: string
  readonly selectedAgent: AgentIdentity
  readonly score: number
  readonly alternatives: readonly AgentScore[]
  readonly reasoning: string
}

export interface AgentScore {
  readonly agent: AgentIdentity
  readonly score: number
  readonly breakdown: ScoreBreakdown
}

export interface ScoreBreakdown {
  readonly capabilityMatch: number    // 0-1: How well capabilities match
  readonly availability: number       // 0-1: Current availability
  readonly performance: number        // 0-1: Historical performance
  readonly modelSuitability: number   // 0-1: Model fit for task type
  readonly costEfficiency: number     // 0-1: Cost-effectiveness
}

// ============================================================================
// Agent Selector
// ============================================================================

export class AgentSelector {
  /**
   * Select the best agent for a task from available agents
   */
  static select(input: {
    task: Task
    agents: readonly AgentIdentity[]
  }): Effect.Effect<AgentSelection> {
    return Effect.gen(function* () {
      const { task, agents } = input
      
      // Score all agents
      const scores = agents.map(agent => scoreAgent(agent, task))
      
      // Sort by score descending
      const sorted = [...scores].sort((a, b) => b.score - a.score)
      
      if (sorted.length === 0) {
        return yield* Effect.fail(new Error(`No suitable agent found for task: ${task.title}`))
      }
      
      const best = sorted[0]!
      
      return {
        taskId: task.id,
        selectedAgent: best.agent,
        score: best.score,
        alternatives: sorted.slice(1, 4), // Top 3 alternatives
        reasoning: generateReasoning(best, task),
      }
    })
  }

  /**
   * Select agents for multiple tasks (optimizes for overall team efficiency)
   */
  static selectForAll(input: {
    tasks: readonly Task[]
    agents: readonly AgentIdentity[]
  }): Effect.Effect<readonly AgentSelection[]> {
    return Effect.gen(function* () {
      const { tasks, agents } = input
      const assignments: AgentSelection[] = []
      const workload = new Map<string, number>() // Agent ID -> current task count
      
      // Initialize workload
      for (const agent of agents) {
        workload.set(agent.id, 0)
      }
      
      // Assign tasks greedily (sorted by priority)
      const sortedTasks = [...tasks].sort((a, b) => 
        priorityWeight(b.priority) - priorityWeight(a.priority)
      )
      
      for (const task of sortedTasks) {
        // Score agents considering current workload
        const scores = agents.map(agent => {
          const baseScore = scoreAgent(agent, task)
          const currentLoad = workload.get(agent.id) ?? 0
          const loadPenalty = currentLoad / (agent.maxConcurrency * 2)
          
          return {
            ...baseScore,
            score: baseScore.score * (1 - loadPenalty * 0.3),
          }
        })
        
        const sorted = [...scores].sort((a, b) => b.score - a.score)
        const best = sorted[0]!
        
        assignments.push({
          taskId: task.id,
          selectedAgent: best.agent,
          score: best.score,
          alternatives: sorted.slice(1, 4),
          reasoning: generateReasoning(best, task),
        })
        
        // Update workload
        workload.set(best.agent.id, (workload.get(best.agent.id) ?? 0) + 1)
      }
      
      return assignments
    })
  }
}

// ============================================================================
// Scoring Logic
// ============================================================================

function scoreAgent(agent: AgentIdentity, task: Task): AgentScore {
  const breakdown: ScoreBreakdown = {
    capabilityMatch: calculateCapabilityMatch(agent, task),
    availability: calculateAvailability(agent),
    performance: estimatePerformance(agent, task),
    modelSuitability: calculateModelSuitability(agent, task),
    costEfficiency: calculateCostEfficiency(agent),
  }
  
  // Weighted total score
  const score =
    breakdown.capabilityMatch * 0.35 +
    breakdown.availability * 0.15 +
    breakdown.performance * 0.25 +
    breakdown.modelSuitability * 0.15 +
    breakdown.costEfficiency * 0.10
  
  return { agent, score, breakdown }
}

function calculateCapabilityMatch(agent: AgentIdentity, task: Task): number {
  const required = task.requiredCapabilities
  const has = agent.capabilities
  
  if (required.length === 0) return 0.5
  
  const matchCount = required.filter(cap => has.includes(cap)).length
  return matchCount / required.length
}

function calculateAvailability(agent: AgentIdentity): number {
  // Based on current status
  switch (agent.status) {
    case "idle": return 1.0
    case "waiting": return 0.8
    case "thinking": return 0.3
    case "executing": return 0.1
    case "consulting": return 0.2
    case "error": return 0.0
    case "completed": return 0.9
    default: return 0.5
  }
}

function estimatePerformance(agent: AgentIdentity, task: Task): number {
  // Model-based performance estimation
  const modelScores: Record<string, number> = {
    // Anthropic
    "claude-opus-4": 0.95,
    "claude-sonnet-4": 0.88,
    "claude-haiku-3": 0.72,
    // OpenAI
    "gpt-4.1": 0.93,
    "gpt-4.1-mini": 0.80,
    "gpt-4.1-nano": 0.65,
    // Google
    "gemini-2.5-pro": 0.90,
    "gemini-2.5-flash": 0.82,
    // xAI
    "grok-4": 0.85,
  }
  
  const baseScore = modelScores[agent.model.modelId] ?? 0.70
  
  // Adjust based on role-task alignment
  const roleBonus = getRoleBonus(agent.role, task.requiredCapabilities)
  
  return Math.min(1.0, baseScore + roleBonus)
}

function getRoleBonus(role: AgentIdentity["role"], capabilities: readonly AgentCapability[]): number {
  const roleBonusMap: Record<string, AgentCapability[]> = {
    "coder": ["code-generation", "refactoring"],
    "reviewer": ["code-review", "security-audit"],
    "tester": ["testing"],
    "architect": ["architecture"],
    "researcher": ["research"],
    "debugger": ["debugging"],
    "documenter": ["documentation"],
  }
  
  const matchingRoles = roleBonusMap[role] ?? []
  const hasMatchingRole = capabilities.some(c => matchingRoles.includes(c))
  return hasMatchingRole ? 0.1 : 0
}

function calculateModelSuitability(agent: AgentIdentity, task: Task): number {
  // Some models are better suited for certain tasks
  const modelId = agent.model.modelId.toLowerCase()
  const firstCap = task.requiredCapabilities[0]
  
  const suitabilityMap: Record<string, Record<string, number>> = {
    "claude-opus": { "architecture": 0.95, "code-review": 0.9, "complex-tasks": 0.95 },
    "claude-sonnet": { "code-generation": 0.9, "testing": 0.85, "debugging": 0.88 },
    "gpt-4": { "code-generation": 0.88, "research": 0.9, "documentation": 0.85 },
    "gemini": { "research": 0.92, "code-generation": 0.85, "multimodal": 0.95 },
  }
  
  for (const [modelKey, capMap] of Object.entries(suitabilityMap)) {
    if (modelId.includes(modelKey) && firstCap && capMap[firstCap]) {
      return capMap[firstCap]!
    }
  }
  
  return 0.75 // Default
}

function calculateCostEfficiency(agent: AgentIdentity): number {
  // Cost tiers (relative)
  const costMap: Record<string, number> = {
    "opus": 0.3,   // Expensive
    "gpt-4.1": 0.4,
    "gemini-2.5-pro": 0.5,
    "sonnet": 0.7,
    "gpt-4.1-mini": 0.8,
    "gemini-2.5-flash": 0.85,
    "haiku": 0.9,
    "nano": 0.95,
  }
  
  const modelId = agent.model.modelId.toLowerCase()
  for (const [key, score] of Object.entries(costMap)) {
    if (modelId.includes(key)) return score
  }
  
  return 0.6 // Default medium
}

function generateReasoning(score: AgentScore, task: Task): string {
  const { agent, breakdown } = score
  const parts: string[] = []
  
  parts.push(`${agent.name} (${agent.model.modelId}) selected for "${task.title}"`)
  
  if (breakdown.capabilityMatch > 0.8) parts.push("excellent capability match")
  if (breakdown.availability > 0.8) parts.push("currently available")
  if (breakdown.modelSuitability > 0.8) parts.push("model well-suited for this task type")
  if (breakdown.performance > 0.8) parts.push("strong expected performance")
  
  return parts.join(", ")
}

function priorityWeight(priority: Task["priority"]): number {
  switch (priority) {
    case "critical": return 4
    case "high": return 3
    case "medium": return 2
    case "low": return 1
  }
}
