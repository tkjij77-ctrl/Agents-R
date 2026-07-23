/**
 * ResultSynthesizer - Combines results from multiple agents
 * 
 * When multiple agents contribute to a solution, the synthesizer:
 * 1. Merges code changes (handles conflicts)
 * 2. Combines insights and reasoning
 * 3. Validates the final result
 * 4. Generates a unified response
 */

import { Effect } from "effect"
import type { TaskResult, Task, AgentIdentity } from "../agents/types/index.js"

// ============================================================================
// Synthesis Types
// ============================================================================

export interface SynthesizedResult {
  readonly success: boolean
  readonly output: string
  readonly files: readonly SynthesizedFile[]
  readonly insights: readonly Insight[]
  readonly confidence: number
  readonly agentContributions: readonly AgentContribution[]
  readonly warnings: readonly string[]
}

export interface SynthesizedFile {
  readonly path: string
  readonly content: string
  readonly contributors: readonly string[]  // Agent IDs
  readonly conflictResolved: boolean
}

export interface Insight {
  readonly topic: string
  readonly summary: string
  readonly source: string     // Agent ID
  readonly confidence: number
}

export interface AgentContribution {
  readonly agentId: string
  readonly agentName: string
  readonly tasksCompleted: number
  readonly quality: number     // 0-1
  readonly summary: string
}

// ============================================================================
// Result Synthesizer
// ============================================================================

export class ResultSynthesizer {
  /**
   * Synthesize results from multiple tasks into a unified output
   */
  static synthesize(input: {
    tasks: readonly Task[]
    results: readonly TaskResult[]
    agents: readonly AgentIdentity[]
  }): Effect.Effect<SynthesizedResult> {
    return Effect.gen(function* () {
      const { tasks, results, agents } = input
      
      // Merge all file changes
      const mergedFiles = mergeFiles(results)
      
      // Collect insights from all results
      const insights = collectInsights(results, agents)
      
      // Calculate overall confidence
      const confidence = calculateConfidence(results)
      
      // Track agent contributions
      const contributions = trackContributions(tasks, results, agents)
      
      // Generate unified output
      const output = generateOutput(results, insights)
      
      // Check for conflicts
      const warnings = detectConflicts(results)
      
      const success = results.every(r => r.success) && warnings.length === 0
      
      return {
        success,
        output,
        files: mergedFiles,
        insights,
        confidence,
        agentContributions: contributions,
        warnings,
      }
    })
  }

  /**
   * Merge code results, resolving conflicts
   */
  static mergeCode(results: readonly TaskResult[]): readonly SynthesizedFile[] {
    return mergeFiles(results)
  }
}

// ============================================================================
// Internal Helpers
// ============================================================================

function mergeFiles(results: readonly TaskResult[]): SynthesizedFile[] {
  const fileMap = new Map<string, { contents: string[]; contributors: string[] }>()
  
  for (const result of results) {
    if (!result.files) continue
    
    for (const file of result.files) {
      const existing = fileMap.get(file.path)
      if (existing) {
        existing.contents.push(file.content)
        // contributors added below
      } else {
        fileMap.set(file.path, { contents: [file.content], contributors: [] })
      }
    }
  }
  
  const merged: SynthesizedFile[] = []
  
  for (const [path, data] of fileMap) {
    const hasConflict = data.contents.length > 1
    const uniqueContents = [...new Set(data.contents)]
    
    merged.push({
      path,
      // If all contents are the same, use it; otherwise take the last one
      content: uniqueContents.length === 1 ? uniqueContents[0]! : data.contents[data.contents.length - 1]!,
      contributors: data.contributors,
      conflictResolved: hasConflict,
    })
  }
  
  return merged
}

function collectInsights(results: readonly TaskResult[], agents: readonly AgentIdentity[]): Insight[] {
  const insights: Insight[] = []
  
  for (const result of results) {
    if (result.reasoning) {
      insights.push({
        topic: "reasoning",
        summary: result.reasoning,
        source: "agent",
        confidence: result.confidence,
      })
    }
    
    if (result.suggestions) {
      for (const suggestion of result.suggestions) {
        insights.push({
          topic: "suggestion",
          summary: suggestion,
          source: "agent",
          confidence: result.confidence * 0.8,
        })
      }
    }
  }
  
  return insights
}

function calculateConfidence(results: readonly TaskResult[]): number {
  if (results.length === 0) return 0
  
  const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0)
  const avgConfidence = totalConfidence / results.length
  
  // Penalize if any results failed
  const successRate = results.filter(r => r.success).length / results.length
  
  return avgConfidence * successRate
}

function trackContributions(
  tasks: readonly Task[],
  results: readonly TaskResult[],
  agents: readonly AgentIdentity[],
): AgentContribution[] {
  const agentMap = new Map(agents.map(a => [a.id, a]))
  const contributions = new Map<string, { tasks: number; quality: number; summaries: string[] }>()
  
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]!
    const result = results[i]
    if (!result) continue
    
    const agentId = task.assignedTo
    const existing = contributions.get(agentId) ?? { tasks: 0, quality: 0, summaries: [] }
    existing.tasks++
    existing.quality += result.confidence
    if (result.reasoning) existing.summaries.push(result.reasoning)
    contributions.set(agentId, existing)
  }
  
  return Array.from(contributions.entries()).map(([agentId, data]) => {
    const agent = agentMap.get(agentId)
    return {
      agentId,
      agentName: agent?.name ?? agentId,
      tasksCompleted: data.tasks,
      quality: data.quality / data.tasks,
      summary: data.summaries.join("; "),
    }
  })
}

function generateOutput(results: readonly TaskResult[], insights: readonly Insight[]): string {
  const parts: string[] = []
  
  // Combine main outputs
  for (const result of results) {
    if (result.output) {
      parts.push(result.output)
    }
  }
  
  // Add key insights
  const keyInsights = insights.filter(i => i.confidence > 0.8)
  if (keyInsights.length > 0) {
    parts.push("\n--- Key Insights ---")
    for (const insight of keyInsights) {
      parts.push(`• ${insight.summary}`)
    }
  }
  
  return parts.join("\n\n")
}

function detectConflicts(results: readonly TaskResult[]): string[] {
  const warnings: string[] = []
  
  // Check for file conflicts
  const fileMap = new Map<string, string[]>()
  for (const result of results) {
    if (!result.files) continue
    for (const file of result.files) {
      const contents = fileMap.get(file.path) ?? []
      contents.push(file.content)
      fileMap.set(file.path, contents)
    }
  }
  
  for (const [path, contents] of fileMap) {
    const unique = [...new Set(contents)]
    if (unique.length > 1) {
      warnings.push(`File conflict in ${path}: ${unique.length} different versions`)
    }
  }
  
  // Check for failed results
  const failed = results.filter(r => !r.success)
  if (failed.length > 0) {
    warnings.push(`${failed.length} task(s) failed`)
  }
  
  // Check for low confidence results
  const lowConf = results.filter(r => r.confidence < 0.5)
  if (lowConf.length > 0) {
    warnings.push(`${lowConf.length} result(s) have low confidence (< 50%)`)
  }
  
  return warnings
}
