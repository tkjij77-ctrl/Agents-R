/**
 * Orchestrator - The brain of the multi-agent system
 * 
 * The orchestrator is responsible for:
 * 1. Analyzing incoming requests
 * 2. Breaking them into tasks
 * 3. Assigning tasks to the best-suited agents
 * 4. Managing the flow of work
 * 5. Handling conflicts and deadlocks
 * 6. Collecting and synthesizing results
 */

export { OrchestratorService } from "./orchestrator-service.js"
export { TaskDecomposer } from "./task-decomposer.js"
export { AgentSelector } from "./agent-selector.js"
export { ResultSynthesizer } from "./result-synthesizer.js"
