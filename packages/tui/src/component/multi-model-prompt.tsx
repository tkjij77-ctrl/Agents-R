/**
 * Multi-Model Prompt Component - Agents R
 * 
 * This is a prototype component that demonstrates the multi-model UI.
 * It shows model badges, add button, and submit button.
 */

import { createSignal, createMemo, For, Show } from "solid-js"
import { useLocal } from "../../context/local"
import { useTheme } from "../../context/theme"
import { useDialog } from "../../ui/dialog"
import { DialogMultiModel } from "./dialog-multi-model"

export interface MultiModelPromptProps {
  sessionID?: string
  onSubmit?: (models: readonly ModelBadge[]) => void
}

export interface ModelBadge {
  id: string
  name: string
  providerID: string
  modelID: string
}

export function MultiModelPrompt(props: MultiModelPromptProps) {
  const local = useLocal()
  const dialog = useDialog()
  const { theme } = useTheme()
  const [inputText, setInputText] = createSignal("")
  const [focused, setFocused] = createSignal(false)

  const activeModels = createMemo(() => local.multiModel.list())
  const hasModels = createMemo(() => activeModels().length > 0)
  const maxReached = createMemo(() => activeModels().length >= 3)

  function openModelDialog() {
    dialog.push(() => <DialogMultiModel />)
  }

  function handleSubmit() {
    if (!hasModels() || !inputText().trim()) return
    
    props.onSubmit?.(activeModels())
    setInputText("")
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "12px",
        border: `1px solid ${focused() ? theme.primary : theme.border}`,
        borderRadius: "8px",
        backgroundColor: theme.backgroundElement,
      }}
    >
      {/* Model Badges Row */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "6px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <For each={activeModels()}>
          {(model) => (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "4px",
                backgroundColor: theme.background,
                border: `1px solid ${theme.border}`,
                cursor: "pointer",
              }}
              onClick={() => {
                // Could show model details or options
              }}
            >
              <span style={{ color: theme.success, fontSize: "12px" }}>●</span>
              <span style={{ color: theme.text, fontSize: "12px", fontWeight: 500 }}>
                {model.name}
              </span>
              <span style={{ color: theme.textMuted, fontSize: "10px" }}>
                {model.modelID}
              </span>
            </div>
          )}
        </For>

        {/* Add Model Button */}
        <Show when={!maxReached()}>
          <button
            onClick={openModelDialog}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: "transparent",
              border: `1px dashed ${theme.border}`,
              color: theme.textMuted,
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            <span style={{ fontSize: "14px" }}>+</span>
            <span>Add Model</span>
          </button>
        </Show>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Submit Button (البدء) */}
        <button
          onClick={handleSubmit}
          disabled={!hasModels() || !inputText().trim()}
          style={{
            padding: "6px 16px",
            borderRadius: "4px",
            backgroundColor: hasModels() && inputText().trim() ? theme.primary : theme.border,
            color: theme.background,
            border: "none",
            cursor: hasModels() && inputText().trim() ? "pointer" : "not-allowed",
            fontSize: "12px",
            fontWeight: 600,
            opacity: hasModels() && inputText().trim() ? 1 : 0.5,
          }}
        >
          البدء
        </button>
      </div>

      {/* Text Input */}
      <textarea
        value={inputText()}
        onInput={(e) => setInputText(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={
          hasModels()
            ? "Ask anything..."
            : "Add models first to start collaborating..."
        }
        style={{
          width: "100%",
          minHeight: "60px",
          maxHeight: "200px",
          padding: "8px",
          borderRadius: "4px",
          border: "none",
          backgroundColor: "transparent",
          color: theme.text,
          fontSize: "14px",
          resize: "vertical",
          outline: "none",
        }}
      />

      {/* Footer Info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          color: theme.textMuted,
        }}
      >
        <span>
          {activeModels().length > 0
            ? `${activeModels().length} model${activeModels().length > 1 ? "s" : ""} active`
            : "No models selected"}
        </span>
        <span>
          Enter to submit · Shift+Enter for new line
        </span>
      </div>
    </div>
  )
}
