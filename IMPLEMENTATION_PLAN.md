#  Agents R - Implementation Plan

## Current Status: Phase 1 (UI Prototype)

### ✅ Completed:
1. **Multi-Model Context** (`packages/tui/src/context/local.tsx`)
   - Added `multiModel` store with full CRUD operations
   - Max 3 models support
   - Persistence to `multi-model.json`
   - Methods: add, remove, rename, update, clear

2. **Multi-Model Dialog** (`packages/tui/src/component/dialog-multi-model.tsx`)
   - View active models (1-3)
   - Add new models with search
   - Remove existing models
   - Rename model agents
   - Real-time validation

### 🔄 In Progress:
3. **Prompt Component Modifications**
   - Display multi-model badges instead of single model
   - Add "+" button to open multi-model dialog
   - Add "البدء" (Submit) button
   - Adjust layout for multiple models

###  Next Steps:

#### Phase 2: Core Modifications
- [ ] Modify `session/create` to accept multiple models
- [ ] Add multi-agent runtime layer
- [ ] Implement consensus engine integration
- [ ] Add collaborative execution flow

#### Phase 3: Integration
- [ ] Connect UI to multi-agent backend
- [ ] Implement model-to-agent mapping
- [ ] Add real-time status indicators
- [ ] Handle model errors/failures gracefully

#### Phase 4: Polish
- [ ] Add Agents R logo/branding
- [ ] Implement animations for model selection
- [ ] Add keyboard shortcuts for quick model switching
- [ ] Performance optimizations

---

## Technical Details

### Multi-Model Store Structure:
```typescript
{
  active: [
    {
      id: "agent_xxxxx",
      name: "Architect",  // Custom name
      providerID: "anthropic",
      modelID: "claude-sonnet-4-5"
    },
    // ... up to 3
  ]
}
```

### File Locations:
- **Context**: `packages/tui/src/context/local.tsx`
- **Dialog**: `packages/tui/src/component/dialog-multi-model.tsx`
- **Prompt**: `packages/tui/src/component/prompt/index.tsx` (to be modified)
- **Multi-Agent Core**: `packages/multi-agent/src/` (already built)

### Dependencies:
- OpenTUI components (`@opentui/solid`)
- Solid.js reactivity
- Effect library (for core)
- Vercel AI SDK (for LLM calls)

---

## UI Mockup Reference

From the wireframe provided:
```
┌─────────────────────────────────────────────┐
│                                             │
│           [Agents R Logo/Name]              │
│                                             │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [Architect] [Coder] [Reviewer] [+] [البدء] │
│                                             │
│  [________________Input________________]    │
│                                             │
─────────────────────────────────────────────
```

- **Badges**: Show active models (1-3)
- **+ Button**: Opens multi-model dialog
- **البدء Button**: Submit prompt to all models
- **Input**: Standard prompt input

---

## Testing Plan

1. **Unit Tests**:
   - Multi-model store operations
   - Model validation
   - Max limit enforcement

2. **Integration Tests**:
   - Dialog opens/closes correctly
   - Models persist across sessions
   - Prompt submission with multiple models

3. **E2E Tests**:
   - Full workflow: add models → submit prompt → receive responses
   - Error handling: invalid models, network failures
   - Edge cases: remove all models, rename, etc.

---

## Timeline Estimate

- **Phase 1 (UI)**: 2-3 days
- **Phase 2 (Core)**: 3-4 days
- **Phase 3 (Integration)**: 2-3 days
- **Phase 4 (Polish)**: 1-2 days

**Total**: ~8-12 days for MVP

---

## Open Questions

1. **Model Communication**: How should models share context during collaboration?
2. **Consensus Threshold**: What agreement level is needed for final output?
3. **Error Recovery**: What happens if one model fails mid-execution?
4. **Cost Tracking**: How to display combined costs from multiple models?

---

## Resources

- **OpenCode Source**: `packages/tui/`, `packages/core/`
- **Multi-Agent System**: `packages/multi-agent/`
- **Documentation**: `AGENTS-R.md`, `README.md`
- **Wireframe**: `uploads/Untitled-2026-07-22-2032.png`
