/**
 * TaskDecomposer - Breaks down complex requests into manageable tasks
 * 
 * Uses the orchestrator's reasoning capabilities to:
 * 1. Identify distinct work items from a request
 * 2. Determine dependencies between tasks
 * 3. Estimate effort and priority
 * 4. Create a task execution plan (DAG)
 */

import { Effect } from "effect"
import type { Task, TaskContext, TaskPriority, AgentCapability } from "../agents/types/index.js"

// ============================================================================
// Task Graph (DAG)
// ============================================================================

export interface TaskGraph {
  readonly tasks: readonly Task[]
  readonly dependencies: readonly TaskDependency[]
  readonly estimatedTotalEffort: number
  readonly criticalPath: readonly string[]  // Task IDs
}

export interface TaskDependency {
  readonly taskId: string
  readonly dependsOn: readonly string[]  // Task IDs
}

// ============================================================================
// Decomposition Plan
// ============================================================================

export interface DecompositionPlan {
  readonly graph: TaskGraph
  readonly executionOrder: readonly string[][]  // Groups of tasks that can run in parallel
  readonly parallelism: number                   // Max parallel tasks
  readonly estimatedDuration: number             // In seconds
}

// ============================================================================
// Task Decomposer
// ============================================================================

export class TaskDecomposer {
  /**
   * Decompose a complex request into individual tasks
   */
  static decompose(input: {
    request: string
    context: TaskContext
    availableCapabilities: readonly AgentCapability[]
  }): Effect.Effect<DecompositionPlan> {
    return Effect.gen(function* () {
      const { request, context, availableCapabilities } = input
      
      // Parse the request into task items
      const taskItems = parseRequestIntoTasks(request, context)
      
      // Build dependency graph
      const dependencies = resolveDependencies(taskItems)
      
      // Calculate execution order (topological sort)
      const executionOrder = topologicalSort(taskItems, dependencies)
      
      // Build task graph
      const graph: TaskGraph = {
        tasks: taskItems,
        dependencies,
        estimatedTotalEffort: taskItems.reduce((sum, t) => sum + estimateEffort(t), 0),
        criticalPath: findCriticalPath(taskItems, dependencies),
      }
      
      return {
        graph,
        executionOrder,
        parallelism: Math.max(...executionOrder.map(group => group.length)),
        estimatedDuration: estimateTotalDuration(graph, executionOrder),
      }
    })
  }

  /**
   * Refine an existing plan based on feedback
   */
  static refine(plan: DecompositionPlan, feedback: string): Effect.Effect<DecompositionPlan> {
    return Effect.gen(function* () {
      // Adjust based on feedback (e.g., "task 1 was too broad, split it")
      // This would use an LLM to analyze the feedback and adjust the plan
      return plan // Placeholder - actual implementation would use LLM
    })
  }
}

// ============================================================================
// Internal Helpers
// ============================================================================

function parseRequestIntoTasks(request: string, context: TaskContext): Task[] {
  const lower = request.toLowerCase()
  const tasks: Task[] = []
  const baseId = `task_${Date.now()}`
  const now = Date.now()
  
  // Detect task patterns
  const patterns: { pattern: RegExp; capability: AgentCapability; title: string }[] = [
    { pattern: /(?:create|write|implement|build|make)\s+(?:a\s+)?(?:function|class|component|module|api)/i, capability: "code-generation", title: "Implement new code" },
    { pattern: /(?:fix|debug|resolve)\s+(?:the\s+)?(?:bug|error|issue|problem)/i, capability: "debugging", title: "Debug and fix issue" },
    { pattern: /(?:write|create|add)\s+(?:unit\s+)?tests/i, capability: "testing", title: "Write tests" },
    { pattern: /(?:review|check|audit)\s+(?:the\s+)?(?:code|implementation)/i, capability: "code-review", title: "Code review" },
    { pattern: /(?:refactor|improve|clean|optimize)\s+(?:the\s+)?(?:code|implementation)/i, capability: "refactoring", title: "Refactor code" },
    { pattern: /(?:design|plan|architect)\s+(?:the\s+)?(?:system|architecture|structure)/i, capability: "architecture", title: "System design" },
    { pattern: /(?:document|explain|write\s+docs|readme)/i, capability: "documentation", title: "Write documentation" },
    { pattern: /(?:research|investigate|explore|find)\s+(?:the\s+)?(?:best|optimal|suitable)/i, capability: "research", title: "Research solution" },
  ]
  
  let taskIndex = 0
  for (const { pattern, capability, title } of patterns) {
    if (pattern.test(lower)) {
      tasks.push(createTask({
        id: `${baseId}_${taskIndex++}`,
        title,
        description: request,
        capability,
        context,
        priority: "medium",
        createdAt: now,
      }))
    }
  }
  
  // If no patterns matched, create a single general task
  if (tasks.length === 0) {
    tasks.push(createTask({
      id: `${baseId}_0`,
      title: "Process request",
      description: request,
      capability: "code-generation",
      context,
      priority: "medium",
      createdAt: now,
    }))
  }
  
  return tasks
}

function createTask(input: {
  id: string
  title: string
  description: string
  capability: AgentCapability
  context: TaskContext
  priority: TaskPriority
  createdAt: number
}): Task {
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    priority: input.priority,
    assignedTo: "",  // Will be assigned by AgentSelector
    requiredCapabilities: [input.capability],
    context: input.context,
    status: "pending",
    createdAt: input.createdAt,
  }
}

function resolveDependencies(tasks: readonly Task[]): TaskDependency[] {
  // Simple dependency resolution based on task order and type
  // Research tasks come before code generation
  // Architecture comes before implementation
  // Review comes after implementation
  
  const ordered: TaskDependency[] = []
  const taskTypes = tasks.map(t => t.requiredCapabilities[0])
  
  for (let i = 0; i < tasks.length; i++) {
    const deps: string[] = []
    const currentType = taskTypes[i]
    
    if (currentType === "code-review" || currentType === "testing") {
      // Depends on all code generation tasks
      for (let j = 0; j < i; j++) {
        if (taskTypes[j] === "code-generation" || taskTypes[j] === "refactoring") {
          deps.push(tasks[j].id)
        }
      }
    }
    
    if (currentType === "documentation") {
      // Depends on all other tasks
      for (let j = 0; j < i; j++) {
        deps.push(tasks[j].id)
      }
    }
    
    ordered.push({ taskId: tasks[i].id, dependsOn: deps })
  }
  
  return ordered
}

function topologicalSort(tasks: readonly Task[], dependencies: readonly TaskDependency[]): string[][] {
  const depMap = new Map(dependencies.map(d => [d.taskId, d.dependsOn]))
  const visited = new Set<string>()
  const groups: string[][] = []
  
  while (visited.size < tasks.length) {
    const group: string[] = []
    
    for (const task of tasks) {
      if (visited.has(task.id)) continue
      
      const deps = depMap.get(task.id) ?? []
      if (deps.every(d => visited.has(d))) {
        group.push(task.id)
      }
    }
    
    if (group.length === 0) break  // Cycle or error
    group.forEach(id => visited.add(id))
    groups.push(group)
  }
  
  return groups
}

function findCriticalPath(tasks: readonly Task[], dependencies: readonly TaskDependency[]): string[] {
  // Find the longest path through the dependency graph
  const depMap = new Map(dependencies.map(d => [d.taskId, d.dependsOn]))
  const effortMap = new Map(tasks.map(t => [t.id, estimateEffort(t)]))
  
  const longestPath = (taskId: string): string[] => {
    const deps = depMap.get(taskId) ?? []
    if (deps.length === 0) return [taskId]
    
    const longest = deps.map(d => longestPath(d)).reduce((a, b) =>
      a.reduce((sum, id) => sum + (effortMap.get(id) ?? 0), 0) >
      b.reduce((sum, id) => sum + (effortMap.get(id) ?? 0), 0) ? a : b
    , [] as string[])
    
    return [...longest, taskId]
  }
  
  return tasks.length > 0 ? longestPath(tasks[tasks.length - 1].id) : []
}

function estimateEffort(task: Task): number {
  const wordCount = task.description.split(/\s+/).length
  const complexity = task.requiredCapabilities.length
  
  if (wordCount < 20 && complexity === 1) return 30   // ~30 seconds
  if (wordCount < 100) return 120                       // ~2 minutes
  return 300                                             // ~5 minutes
}

function estimateTotalDuration(graph: TaskGraph, executionOrder: string[][]): number {
  // Total duration = sum of the longest task in each parallel group
  const effortMap = new Map(graph.tasks.map(t => [t.id, estimateEffort(t)]))
  
  return executionOrder.reduce((total, group) => {
    const groupMax = Math.max(...group.map(id => effortMap.get(id) ?? 0))
    return total + groupMax
  }, 0)
}
