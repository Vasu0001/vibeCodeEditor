"use client"

import { useRef, useEffect, useCallback, type MutableRefObject } from "react"
import Editor, { type Monaco } from "@monaco-editor/react"
import type { editor as MonacoEditor } from "monaco-editor"
import { configureMonaco, defaultEditorOptions, getEditorLanguage } from "@/features/playground/libs/editor-config"
import type { TemplateFile } from "@/features/playground/libs/path-to-json"

interface PlaygroundEditorProps {
  activeFile: TemplateFile | undefined
  content: string
  onContentChange: (value: string) => void
  suggestion: string | null
  suggestionLoading: boolean
  suggestionPosition: { line: number; column: number } | null
  onAcceptSuggestion: (editor: any, monaco: any) => void
  onRejectSuggestion: (editor: any) => void
  onTriggerSuggestion: (type: string, editor: any) => void
}

export const PlaygroundEditor = ({
  activeFile,
  content,
  onContentChange,
  suggestion,
  suggestionLoading,
  suggestionPosition,
  onAcceptSuggestion,
  onRejectSuggestion,
  onTriggerSuggestion,
}: PlaygroundEditorProps) => {
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const inlineCompletionProviderRef = useRef<any>(null)
  const editorDisposablesRef = useRef<Array<{ dispose: () => void }>>([])
  const currentSuggestionRef = useRef<{
    text: string
    position: { line: number; column: number }
    id: string
  } | null>(null)
  const isAcceptingSuggestionRef = useRef(false)
  const suggestionAcceptedRef = useRef(false)
  const tabCommandRef = useRef<string | null>(null)
  const lastEnterRef = useRef<{ time: number; lineNumber: number } | null>(null)

  const disposeRef = (ref: MutableRefObject<any>) => {
    if (ref.current && typeof ref.current.dispose === "function") {
      ref.current.dispose()
    }
    ref.current = null
  }

  const disposeEditorSubscriptions = () => {
    editorDisposablesRef.current.forEach((disposable) => {
      if (typeof disposable.dispose === "function") {
        disposable.dispose()
      }
    })
    editorDisposablesRef.current = []
  }

  // Create inline completion provider
  const createInlineCompletionProvider = useCallback(
    (monaco: Monaco) => {
      return {
        provideInlineCompletions: async (model: any, position: any, context: any, token: any) => {
          if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
            return { items: [] }
          }

          if (!suggestion || !suggestionPosition) {
            return { items: [] }
          }

          // Check if current position matches suggestion position (with some tolerance)
          const currentLine = position.lineNumber
          const currentColumn = position.column

          const isPositionMatch =
            currentLine === suggestionPosition.line &&
            currentColumn >= suggestionPosition.column &&
            currentColumn <= suggestionPosition.column + 2

          if (!isPositionMatch) {
            return { items: [] }
          }

          currentSuggestionRef.current = {
            text: suggestion,
            position: suggestionPosition,
            id: "active-ai-suggestion",
          }

          const cleanSuggestion = suggestion.replace(/\r/g, "")

          return {
            items: [
              {
                insertText: cleanSuggestion,
                range: new monaco.Range(
                  suggestionPosition.line,
                  suggestionPosition.column,
                  suggestionPosition.line,
                  suggestionPosition.column,
                ),
                kind: monaco.languages.CompletionItemKind.Snippet,
                label: "AI Suggestion",
                detail: "AI-generated code suggestion",
                documentation: "Press Tab to accept",
                sortText: "0000", // High priority
                filterText: "",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              },
            ],
          }
        },
        freeInlineCompletions: () => {},
      }
    },
    [suggestion, suggestionPosition],
  )

  // Clear current suggestion
  const clearCurrentSuggestion = useCallback(() => {
    currentSuggestionRef.current = null
    suggestionAcceptedRef.current = false
    if (editorRef.current) {
      editorRef.current.trigger("ai", "editor.action.inlineSuggest.hide", null)
    }
  }, [])

  // Accept current suggestion with double-acceptance prevention
  const acceptCurrentSuggestion = useCallback(() => {
    if (!editorRef.current || !monacoRef.current || !currentSuggestionRef.current) {
      return false
    }

    if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
      return false
    }

    isAcceptingSuggestionRef.current = true
    suggestionAcceptedRef.current = true

    const editor = editorRef.current
    const monaco = monacoRef.current

    try {
      onAcceptSuggestion(editor, monaco)
      clearCurrentSuggestion()
      return true
    } catch (error) {
      console.error("Error accepting suggestion:", error)
      return false
    } finally {
      isAcceptingSuggestionRef.current = false
      setTimeout(() => {
        suggestionAcceptedRef.current = false
      }, 500)
    }
  }, [clearCurrentSuggestion, onAcceptSuggestion])

  // Check if there's an active inline suggestion at current position
  const hasActiveSuggestionAtPosition = useCallback(() => {
    if (!editorRef.current || !currentSuggestionRef.current) return false

    const position = editorRef.current.getPosition()
    const suggestion = currentSuggestionRef.current

    return (
      position.lineNumber === suggestion.position.line &&
      position.column >= suggestion.position.column &&
      position.column <= suggestion.position.column + 2
    )
  }, [])

  // Update inline completions when suggestion changes
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return

    const editor = editorRef.current
    const monaco = monacoRef.current

    if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
      return
    }

    // Dispose previous provider
    disposeRef(inlineCompletionProviderRef)

    // Clear current suggestion reference
    currentSuggestionRef.current = null

    if (suggestion && suggestionPosition) {
      const language = getEditorLanguage(activeFile?.fileExtension || "")
      const provider = createInlineCompletionProvider(monaco)
      currentSuggestionRef.current = {
        text: suggestion,
        position: suggestionPosition,
        id: "active-ai-suggestion",
      }

      inlineCompletionProviderRef.current = monaco.languages.registerInlineCompletionsProvider(language, provider)

      setTimeout(() => {
        if (editorRef.current && !isAcceptingSuggestionRef.current && !suggestionAcceptedRef.current) {
          editor.trigger("ai", "editor.action.inlineSuggest.trigger", null)
        }
      }, 50)
    }

    return () => {
      disposeRef(inlineCompletionProviderRef)
    }
  }, [suggestion, suggestionPosition, activeFile, createInlineCompletionProvider])

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    disposeEditorSubscriptions()
    editorRef.current = editor
    monacoRef.current = monaco

    editor.updateOptions({
      ...defaultEditorOptions,
      // Enable inline suggestions but with specific settings to prevent conflicts
      inlineSuggest: {
        enabled: true,
        mode: "prefix",
        suppressSuggestions: false,
      },
      // Disable some conflicting suggest features
      suggest: {
        preview: false, // Disable preview to avoid conflicts
        showInlineDetails: false,
        insertMode: "replace",
      },
      // Quick suggestions
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false,
      },
      // Smooth cursor
      cursorSmoothCaretAnimation: "on",
    })

    configureMonaco(monaco)

    // Keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      onTriggerSuggestion("completion", editor)
    })

    // Override Tab key with high priority and prevent default Monaco behavior.
    // Monaco returns a command id here, not a disposable.
    tabCommandRef.current = editor.addCommand(
      monaco.KeyCode.Tab,
      () => {
        if (isAcceptingSuggestionRef.current) {
          return
        }

        if (suggestionAcceptedRef.current) {
          editor.trigger("keyboard", "tab", null)
          return
        }

        if (currentSuggestionRef.current && hasActiveSuggestionAtPosition()) {
          const accepted = acceptCurrentSuggestion()
          if (accepted) {
            return
          }
        }

        editor.trigger("keyboard", "tab", null)
      },
      "editorTextFocus && !editorReadonly && !suggestWidgetVisible",
    )

    // Escape to reject
    editor.addCommand(monaco.KeyCode.Escape, () => {
      if (currentSuggestionRef.current) {
        onRejectSuggestion(editor)
        clearCurrentSuggestion()
      }
    })

    // Listen for cursor position changes to hide suggestions when moving away
    const cursorDisposable = editor.onDidChangeCursorPosition((e: any) => {
      if (isAcceptingSuggestionRef.current) return

      const newPosition = e.position

      // Clear existing suggestion if cursor moved away
      if (currentSuggestionRef.current && !suggestionAcceptedRef.current) {
        const suggestionPos = currentSuggestionRef.current.position

        // If cursor moved away from suggestion position, clear it
        if (
          newPosition.lineNumber !== suggestionPos.line ||
          newPosition.column < suggestionPos.column ||
          newPosition.column > suggestionPos.column + 10
        ) {
          clearCurrentSuggestion()
          onRejectSuggestion(editor)
        }
      }

    })
    editorDisposablesRef.current.push(cursorDisposable)

    // Listen for content changes to detect manual typing over suggestions
    const contentDisposable = editor.onDidChangeModelContent((e: any) => {
      if (isAcceptingSuggestionRef.current) return

      // If user types while there's a suggestion, clear it (unless it's our insertion)
      if (currentSuggestionRef.current && e.changes.length > 0 && !suggestionAcceptedRef.current) {
        const change = e.changes[0]

        // Check if this is our own suggestion insertion
        if (
          change.text === currentSuggestionRef.current.text ||
          change.text === currentSuggestionRef.current.text.replace(/\r/g, "")
        ) {
          return
        }

        clearCurrentSuggestion()
      }

      // Trigger AI completion with double Enter.
      if (e.changes.length > 0 && !suggestionAcceptedRef.current) {
        const change = e.changes[0]

        if (change.text === "\n") {
          const now = Date.now()
          const position = editor.getPosition()
          const lastEnter = lastEnterRef.current
          const isDoubleEnter =
            Boolean(lastEnter && position) &&
            now - lastEnter!.time < 900 &&
            position.lineNumber === lastEnter!.lineNumber + 1

          if (position) {
            lastEnterRef.current = {
              time: now,
              lineNumber: position.lineNumber,
            }
          }

          if (isDoubleEnter && !currentSuggestionRef.current && !suggestionLoading) {
            onTriggerSuggestion("completion", editor)
          }
        } else if (change.text.trim()) {
          lastEnterRef.current = null
        }
      }
    })
    editorDisposablesRef.current.push(contentDisposable)

    updateEditorLanguage()
  }

  const updateEditorLanguage = () => {
    if (!activeFile || !monacoRef.current || !editorRef.current) return
    const model = editorRef.current.getModel()
    if (!model) return

    const language = getEditorLanguage(activeFile.fileExtension || "")
    try {
      monacoRef.current.editor.setModelLanguage(model, language)
    } catch (error) {
      console.warn("Failed to set editor language:", error)
    }
  }

  useEffect(() => {
    updateEditorLanguage()
  }, [activeFile])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disposeRef(inlineCompletionProviderRef)
      disposeEditorSubscriptions()
      tabCommandRef.current = null
    }
  }, [])

  return (
    <div className="h-full relative">
      {/* Loading indicator */}
      {suggestionLoading && (
        <div className="absolute top-2 right-2 z-10 bg-red-100 dark:bg-red-900 px-2 py-1 rounded text-xs text-red-700 dark:text-red-300 flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          AI thinking...
        </div>
      )}

      {/* Active suggestion indicator */}
      {suggestion && suggestionPosition && !suggestionLoading && (
        <div className="absolute top-2 right-2 z-10 bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Press Tab to accept
        </div>
      )}

      <Editor
        height="100%"
        value={content}
        onChange={(value) => onContentChange(value || "")}
        onMount={handleEditorDidMount}
        language={activeFile ? getEditorLanguage(activeFile.fileExtension || "") : "plaintext"}
        options={defaultEditorOptions as unknown as MonacoEditor.IStandaloneEditorConstructionOptions}
      />
    </div>
  )
}
