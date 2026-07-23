import { createSignal, createMemo, For, Show } from "solid-js"
import { useLocal } from "../context/local"
import { useSync } from "../context/sync"
import { useDialog } from "../ui/dialog"
import { useTheme } from "../context/theme"
import { Box, Text, Textarea } from "@opentui/solid"
import { map, entries, filter, sortBy } from "remeda"
import * as fuzzysort from "fuzzysort"

/**
 * Multi-Model Selection Dialog
 * 
 * Allows users to:
 * 1. View currently active models (1-3)
 * 2. Add new models (up to 3 total)
 * 3. Remove existing models
 * 4. Rename model agents
 * 5. Change model for an existing agent
 */
export function DialogMultiModel() {
  const local = useLocal()
  const sync = useSync()
  const dialog = useDialog()
  const { theme } = useTheme()
  const [query, setQuery] = createSignal("")
  const [editingId, setEditingId] = createSignal<string | null>(null)
  const [editingName, setEditingName] = createSignal("")
  const [maxReached] = createMemo(() => local.multiModel.count() >= 3)

  // Get available models (excluding already added ones)
  const availableModels = createMemo(() => {
    const addedKeys = new Set(
      local.multiModel.list().map((m) => `${m.providerID}/${m.modelID}`),
    )
    const needle = query().trim()

    const allModels = sync.data.provider.flatMap((provider) =>
      entries(provider.models).map(([modelID, info]) => ({
        providerID: provider.id,
        providerName: provider.name,
        modelID,
        modelName: info.name ?? modelID,
        disabled: info.status === "deprecated" || addedKeys.has(`${provider.id}/${modelID}`),
      })),
    )

    if (!needle) return allModels.filter((m) => !m.disabled)

    return fuzzysort
      .go(needle, allModels, { keys: ["modelName", "providerName"] })
      .map((x) => x.obj)
      .filter((m) => !m.disabled)
  })

  function handleAdd(providerID: string, modelID: string, modelName: string) {
    const name = `Agent ${local.multiModel.count() + 1}`
    const success = local.multiModel.add(name, providerID, modelID)
    if (success) {
      // Don't close dialog - allow adding more
    }
  }

  function handleRemove(id: string) {
    local.multiModel.remove(id)
  }

  function startRename(id: string, currentName: string) {
    setEditingId(id)
    setEditingName(currentName)
  }

  function confirmRename() {
    const id = editingId()
    const name = editingName().trim()
    if (id && name) {
      local.multiModel.rename(id, name)
    }
    setEditingId(null)
    setEditingName("")
  }

  function cancelRename() {
    setEditingId(null)
    setEditingName("")
  }

  const activeModels = local.multiModel.list()

  return (
    <Box flexDirection="column" padding={1} gap={1} border={[["all"]]} borderColor={theme.border}>
      <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
        <Text bold fg={theme.text}>
          Multi-Model Setup
        </Text>
        <Text fg={theme.textMuted}>
          {local.multiModel.count()}/3
        </Text>
      </Box>

      {/* Active Models Section */}
      <Show when={activeModels.length > 0}>
        <Box flexDirection="column" gap={1} paddingX={1}>
          <Text fg={theme.textMuted} bold>
            Active Models
          </Text>
          <For each={activeModels}>
            {(agent) => (
              <Box
                flexDirection="row"
                justifyContent="space-between"
                padding={1}
                border={[["all"]]}
                borderColor={theme.border}
              >
                <Box flexDirection="column" gap={0}>
                  {editingId() === agent.id ? (
                    <Box flexDirection="row" gap={1}>
                      <Textarea
                        value={editingName()}
                        onContentChange={(v: string) => setEditingName(v)}
                        onSubmit={confirmRename}
                        onBlur={confirmRename}
                        width={20}
                        textColor={theme.text}
                        backgroundColor={theme.background}
                      />
                    </Box>
                  ) : (
                    <Text fg={theme.success}>
                      {agent.name}
                    </Text>
                  )}
                  <Text fg={theme.textMuted}>
                    {agent.providerID}/{agent.modelID}
                  </Text>
                </Box>
                <Box flexDirection="row" gap={1}>
                  <Text
                    fg={theme.primary}
                    onPress={() => startRename(agent.id, agent.name)}
                  >
                    ✎
                  </Text>
                  <Text
                    fg={theme.error}
                    onPress={() => handleRemove(agent.id)}
                  >
                    ✕
                  </Text>
                </Box>
              </Box>
            )}
          </For>
        </Box>
      </Show>

      {/* Add Models Section */}
      <Show when={!maxReached()}>
        <Box flexDirection="column" gap={1} paddingX={1}>
          <Text fg={theme.textMuted} bold>
            Add Model
          </Text>
          <Textarea
            placeholder="Search models..."
            value={query()}
            onContentChange={setQuery}
            textColor={theme.text}
            backgroundColor={theme.background}
          />
          <Box flexDirection="column" gap={0} maxHeight={8}>
            <For each={availableModels().slice(0, 10)}>
              {(m) => (
                <Box
                  flexDirection="row"
                  justifyContent="space-between"
                  padding={1}
                  onPress={() => handleAdd(m.providerID, m.modelID, m.modelName)}
                >
                  <Text fg={theme.text}>
                    {m.modelName}
                  </Text>
                  <Text fg={theme.textMuted}>
                    {m.providerName}
                  </Text>
                </Box>
              )}
            </For>
          </Box>
        </Box>
      </Show>

      {/* Max Reached Warning */}
      <Show when={maxReached()}>
        <Box padding={1} justifyContent="center">
          <Text fg={theme.warning}>
            Maximum 3 models reached
          </Text>
        </Box>
      </Show>

      {/* Actions */}
      <Box flexDirection="row" justifyContent="space-between" paddingX={1} paddingTop={1}>
        <Text fg={theme.textMuted}>
          Enter: select | Esc: close
        </Text>
        <Text fg={theme.text}>
          esc to close
        </Text>
      </Box>
    </Box>
  )
}
