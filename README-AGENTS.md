# Agents R 🤖

> **Multi-Model AI Collaboration System** - Built on OpenCode

## Overview

**Agents R** is a powerful extension to [OpenCode](https://opencode.ai/) that enables **multiple AI models to collaborate** on coding tasks simultaneously, just like a real development team.

Instead of relying on a single AI model, Agents R orchestrates a team of specialized AI agents powered by different models (Claude, GPT, Gemini, etc.) to work together, consult each other, and reach consensus on solutions.

## ✨ Features

### 🧠 Multi-Model Collaboration
- Use up to **3 AI models simultaneously** in the same session
- Each agent specializes in different tasks (coding, review, testing, architecture)
- Models collaborate through structured communication protocols

### 🎯 Intelligent Orchestration
- **Task Decomposition**: Breaks complex requests into manageable sub-tasks
- **Agent Selection**: Automatically assigns tasks to the best-suited model
- **Consensus Engine**: Agents vote and agree on solutions
- **Delegation System**: Agents can delegate sub-tasks to specialists

### 🤝 Collaboration Modes
| Mode | Description |
|------|-------------|
| **Orchestrated** | Central orchestrator manages all task flow |
| **Peer Review** | Agents review and improve each other's work |
| **Consensus** | All agents must agree on the solution |
| **Competitive** | Multiple agents try, the best result wins |
| **Pipeline** | Sequential handoff between specialized agents |

### 🎨 Terminal UI (TUI)
- Beautiful terminal interface with model badges
- Easy model selection dialog with search
- Real-time agent status indicators
- Keyboard shortcuts for quick operations

##  Quick Start

### Prerequisites
- Node.js 18+ or Bun 1.0+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/Agents-R.git
cd Agents-R

# Install dependencies
bun install

# Run the TUI
bun run dev
```

### Configuration

Add your AI provider credentials to `opencode.json`:

```json
{
  "provider": {
    "anthropic": {
      "apiKey": "your-anthropic-key"
    },
    "openai": {
      "apiKey": "your-openai-key"
    },
    "google": {
      "apiKey": "your-google-key"
    }
  }
}
```

### Using Multi-Model Mode

1. Start OpenCode: `bun run dev`
2. Press `+` to open model selection dialog
3. Select up to 3 models (e.g., Claude + GPT-4 + Gemini)
4. Type your prompt and press Enter
5. Watch the agents collaborate!

## 📁 Project Structure

```
Agents-R/
├── packages/
│   ├── multi-agent/          # Core multi-agent system
│   │   └── src/
│   │       ├── agents/       # Agent types and registry
│   │       ├── orchestrator/ # Task orchestration
│   │       ├── consensus/    # Voting and consensus
│   │       ├── delegation/   # Task delegation
│   │       ├── communication/# Message bus
│   │       └── protocols/    # Communication protocols
│   ├── tui/                  # Terminal UI
│   │   └── src/
│   │       ├── component/
│   │       │   ├── dialog-multi-model.tsx
│   │       │   └── multi-model-prompt.tsx
│   │       └── context/
│   │           └── local.tsx
│   ├── core/                 # OpenCode core (base)
│   ├── llm/                  # LLM providers
│   └── ...                   # Other OpenCode packages
├── demo.html                 # Interactive UI demo
├── AGENTS-R.md               # Arabic documentation
└── README.md                 # This file
```

## ️ Architecture

```
User Request
     ↓
┌─────────────────┐
│   Orchestrator  │
│  (Task Planner) │
└────────────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌───────┐ ┌───────┐ ┌───────┐
│Agent 1│ │Agent 2│ │Agent 3│
│Claude │ │ GPT-4 │ │Gemini │
└───┬───┘ ───┬───┘ └───┬───┘
    │         │         │
    └─────────┴─────────┘
              ↓
    ┌─────────────────┐
    │   Consensus     │
    │   Engine        │
    └────────┬────────┘
             ↓
    ┌─────────────────┐
    │    Synthesis    │
    │   (Merge)       │
    └────────┬────────┘
             ↓
        Final Output
```

## 🛠️ Development

### Build

```bash
# Build all packages
bun run build

# Build only multi-agent package
cd packages/multi-agent && bun run build
```

### Test

```bash
# Run tests
bun run test

# Run specific package tests
cd packages/multi-agent && bun run test
```

### Lint

```bash
bun run lint
```

## 📊 Supported Models

| Provider | Models |
|----------|--------|
| **Anthropic** | Claude Sonnet 4.5, Claude Opus 4, Claude Haiku 4.5 |
| **OpenAI** | GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano |
| **Google** | Gemini 2.5 Pro, Gemini 2.5 Flash |
| **xAI** | Grok 4 |
| **And 70+ more** | Via OpenCode's provider system |

## 🎯 Use Cases

### 1. Complex Feature Development
```
Request: "Build a REST API with authentication"
Agents:
  - Architect (Claude): Design API structure
  - Coder (GPT-4): Implement endpoints
  - Reviewer (Gemini): Code review and security audit
```

### 2. Bug Fixing
```
Request: "Fix this critical bug"
Agents:
  - Debugger (GPT-4): Diagnose root cause
  - Coder (Claude): Implement fix
  - Tester (Haiku): Write regression tests
```

### 3. Code Refactoring
```
Request: "Refactor this module for better performance"
Agents:
  - Architect (Claude): Propose new architecture
  - Coder (GPT-4): Implement refactoring
  - Reviewer (Gemini): Verify improvements
```

## 📝 Documentation

- [Arabic Documentation](./AGENTS-R.md) - Detailed Arabic guide
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Development roadmap
- [Progress Report](./PROGRESS.md) - Current status
- [Multi-Agent README](./packages/multi-agent/README.md) - Core system docs

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is built on top of [OpenCode](https://opencode.ai/) (MIT License).

See [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- [OpenCode](https://opencode.ai/) - The base AI coding agent
- [Effect](https://effect.website/) - Functional programming library
- [OpenTUI](https://github.com/opentui) - Terminal UI framework

## 📧 Contact

- GitHub Issues: [Report a bug](https://github.com/YOUR_USERNAME/Agents-R/issues)
- Discussions: [Feature requests](https://github.com/YOUR_USERNAME/Agents-R/discussions)

---

**Made with ❤️ for the developer community**
