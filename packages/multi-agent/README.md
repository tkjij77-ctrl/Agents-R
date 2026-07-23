# Agents R - Multi-Agent Collaboration System

> Built on top of [OpenCode](https://opencode.ai/) - The open source AI coding agent

## 🎯 Vision

Instead of relying on a single AI model, **Agents R** enables a **team of AI agents** powered by different models to collaborate on coding tasks — just like a real development team.

## ✨ Key Features

### 🧠 Multi-Model Collaboration
- Use multiple AI models simultaneously (Claude, GPT, Gemini, etc.)
- Each agent specializes in different areas (coding, review, testing, architecture)
- Models collaborate in the same conversation

### 🎯 Orchestrator + Team Consensus
- **Orchestrator Agent** analyzes requests and distributes tasks to the best-suited agents
- **Consensus System** allows agents to discuss and agree on solutions
- **Delegation** lets agents pass sub-tasks to specialists

### 🔄 Collaboration Modes
| Mode | Description |
|------|-------------|
| **Orchestrated** | Central orchestrator manages all task flow |
| **Peer Review** | Agents review and improve each other's work |
| **Consensus** | All agents must agree on the solution |
| **Competitive** | Multiple agents try, the best result wins |
| **Pipeline** | Sequential handoff between specialized agents |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                  User Request                │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│              🎯 Orchestrator                 │
│  • Analyzes request                         │
│  • Decomposes into tasks                    │
│  • Selects best agents                      │
│  • Manages execution flow                   │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ 🖥️ Coder │ │ 🔍 Review│ │ 🧪 Tester│
│ (Claude) │ │ (GPT-4)  │ │(Gemini)  │
│          │ │          │ │          │
│ Writes   │ │ Reviews  │ │ Tests    │
│ code     │ │ quality  │ │ coverage │
└────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │
     └────────────┼────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│           🤝 Consensus Layer                │
│  • Agents discuss approaches                │
│  • Vote on best solution                    │
│  • Resolve conflicts                        │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          📦 Result Synthesizer              │
│  • Merges code changes                      │
│  • Combines insights                        │
│  • Generates unified output                 │
└─────────────────────────────────────────────┘
```

## 📁 Project Structure

```
packages/multi-agent/
├── src/
│   ├── index.ts                    # Main exports
│   ├── agents/
│   │   └── types/
│   │       └── index.ts            # Core type definitions
│   ├── orchestrator/
│   │   ├── index.ts                # Orchestrator exports
│   │   ├── orchestrator-service.ts # Main orchestrator logic
│   │   ├── task-decomposer.ts      # Breaks requests into tasks
│   │   ├── agent-selector.ts       # Selects best agents
│   │   └── result-synthesizer.ts   # Merges results
│   ├── consensus/
│   │   └── index.ts                # Consensus & voting system
│   ├── delegation/
│   │   └── index.ts                # Task delegation between agents
│   ├── communication/
│   │   └── index.ts                # Message bus & event system
│   └── protocols/
│       └── index.ts                # Communication protocols
```

## 🚀 How It Works

### 1. Request Analysis
When you submit a request, the Orchestrator:
- Estimates complexity (simple/moderate/complex)
- Identifies required capabilities
- Selects collaboration mode
- Creates a task decomposition plan

### 2. Agent Selection
The Agent Selector scores each agent based on:
- **Capability Match** (35%) - Does the agent have the right skills?
- **Availability** (15%) - Is the agent free?
- **Performance** (25%) - Historical model performance
- **Model Suitability** (15%) - Is this model good for this task type?
- **Cost Efficiency** (10%) - Cost-effectiveness

### 3. Execution
Tasks are executed based on the dependency graph:
- Independent tasks run in parallel
- Dependent tasks wait for prerequisites
- Agents can consult each other during execution
- Sub-tasks can be delegated to specialists

### 4. Consensus & Review
After initial execution:
- Agents review each other's work
- Consensus is reached through voting
- Disagreements are resolved by the orchestrator
- Expert agents can override non-expert decisions

### 5. Synthesis
The Result Synthesizer:
- Merges code changes from all agents
- Resolves file conflicts
- Combines insights and reasoning
- Produces a unified, validated output

## 💡 Example Scenarios

### Scenario 1: "Build a REST API with tests"
```
Orchestrator decomposes into:
  ├── [Architect (Claude)] Design API structure
  ├── [Coder (GPT-4)]     Implement endpoints     (depends on Architect)
  ├── [Tester (Gemini)]   Write tests              (depends on Coder)
  └── [Reviewer (Claude)] Review everything        (depends on all)
```

### Scenario 2: "Fix this bug"
```
Orchestrator uses peer-review mode:
  ├── [Debugger (GPT-4)]  Diagnose root cause
  ├── [Coder (Claude)]    Implement fix
  └── [Reviewer (Gemini)] Verify fix + suggest improvements
```

### Scenario 3: "Refactor this module"
```
Orchestrator uses consensus mode:
  ├── [Architect (Claude)]  Propose architecture
  ├── [Coder (GPT-4)]       Propose implementation
  ├── [Reviewer (Gemini)]   Propose testing strategy
  └── [Consensus]           All agree on combined approach
```

## 🔧 Configuration

```json
{
  "agents-r": {
    "mode": "orchestrated",
    "agents": [
      {
        "name": "Claude Architect",
        "role": "architect",
        "model": { "provider": "anthropic", "modelId": "claude-sonnet-4-5" },
        "capabilities": ["architecture", "code-review", "documentation"]
      },
      {
        "name": "GPT Coder",
        "role": "coder",
        "model": { "provider": "openai", "modelId": "gpt-4.1" },
        "capabilities": ["code-generation", "debugging", "refactoring"]
      },
      {
        "name": "Gemini Tester",
        "role": "tester",
        "model": { "provider": "google", "modelId": "gemini-2.5-pro" },
        "capabilities": ["testing", "code-review", "performance"]
      }
    ],
    "consensus": {
      "strategy": "weighted",
      "threshold": 0.7,
      "maxRounds": 5
    },
    "delegation": {
      "enabled": true,
      "maxDepth": 3
    }
  }
}
```

## 🛠️ Development Status

- [x] Core types and interfaces
- [x] Orchestrator service
- [x] Task decomposer
- [x] Agent selector
- [x] Consensus engine
- [x] Delegation system
- [x] Communication layer
- [x] Protocols
- [x] Result synthesizer
- [ ] Agent runtime (LLM integration)
- [ ] CLI interface
- [ ] TUI integration with OpenCode
- [ ] Session persistence
- [ ] Cost tracking
- [ ] Performance metrics

## 📄 License

MIT - Built on top of OpenCode (MIT License)
