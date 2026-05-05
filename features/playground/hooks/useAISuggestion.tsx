import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";

interface AISuggestionsState {
  suggestion: string | null;
  isLoading: boolean;
  position: { line: number; column: number } | null;
  decoration: string[];
  isEnabled: boolean;
}

interface SuggestionContext {
  fileName?: string;
  language?: string;
}

interface UseAISuggestionsReturn extends AISuggestionsState {
  toggleEnabled: () => void;
  fetchSuggestion: (
    type: string,
    editor: any,
    context?: SuggestionContext,
  ) => Promise<void>;
  acceptSuggestion: (editor: any, monaco: any) => void;
  rejectSuggestion: (editor: any) => void;
  clearSuggestion: (editor: any) => void;
}

function normalizeSuggestion(value: unknown) {
  if (typeof value !== "string") return "";

  return value
    .replace(/\r/g, "")
    .replace(/^```[\w-]*\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/^\d+:\s*/gm, "")
    .replace(/^\n+/, "")
    .replace(/\s+$/, "");
}

export const useAISuggestions = (): UseAISuggestionsReturn => {
  const latestRequestId = useRef(0);
  const latestAbortController = useRef<AbortController | null>(null);
  const isEnabledRef = useRef(true);
  const [state, setState] = useState<AISuggestionsState>({
    suggestion: null,
    isLoading: false,
    position: null,
    decoration: [],
    isEnabled: true,
  });

  useEffect(() => {
    isEnabledRef.current = state.isEnabled;
  }, [state.isEnabled]);

  const toggleEnabled = useCallback(() => {
    setState((prev) => ({ ...prev, isEnabled: !prev.isEnabled }));
  }, []);

  const fetchSuggestion = useCallback(
    async (type: string, editor: any, context?: SuggestionContext) => {
      if (!isEnabledRef.current) {
        toast.info("AI suggestions are disabled");
        return;
      }

      if (!editor) return;

      const model = editor.getModel();
      const cursorPosition = editor.getPosition();

      if (!model || !cursorPosition) return;

      latestAbortController.current?.abort();
      const abortController = new AbortController();
      latestAbortController.current = abortController;

      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;

      setState((prev) => ({
        ...prev,
        isLoading: true,
        suggestion: null,
        position: null,
        decoration: [],
      }));

      try {
        const payload = {
          fileContent: model.getValue(),
          cursorLine: cursorPosition.lineNumber - 1,
          cursorColumn: cursorPosition.column - 1,
          suggestionType: type,
          fileName: context?.fileName,
          language: context?.language || model.getLanguageId?.(),
        };

        const response = await fetch("/api/code-suggestion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          throw new Error(
            errorBody?.error ||
              `AI suggestion failed with status ${response.status}`,
          );
        }

        const data = await response.json();
        if (requestId !== latestRequestId.current) return;

        const suggestionText = normalizeSuggestion(data.suggestion);

        setState((prev) => ({
          ...prev,
          suggestion: suggestionText || null,
          position: suggestionText
            ? {
                line: cursorPosition.lineNumber,
                column: cursorPosition.column,
              }
            : null,
          isLoading: false,
        }));

        if (!suggestionText) {
          toast.info("No useful AI suggestion for this cursor position");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Failed to fetch AI suggestion";
        toast.error(message);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [],
  );

  const acceptSuggestion = useCallback(
    (editor: any, monaco: any) => {
      setState((currentState) => {
        if (!currentState.suggestion || !currentState.position || !editor || !monaco) {
          return currentState;
        }

        const { line, column } = currentState.position;
        const sanitizedSuggestion = currentState.suggestion.replace(/^\d+:\s*/gm, "");

        editor.executeEdits("", [
          {
            range: new monaco.Range(line, column, line, column),
            text: sanitizedSuggestion,
            forceMoveMarkers: true,
          },
        ]);

        // Clear decorations
        if (editor && currentState.decoration.length > 0) {
          editor.deltaDecorations(currentState.decoration, []);
        }

        return {
          ...currentState,
          suggestion: null,
          position: null,
          decoration: [],
        };
      });
    },
    []
  );

  const rejectSuggestion = useCallback((editor: any) => {
    setState((currentState) => {
      if (editor && currentState.decoration.length > 0) {
        editor.deltaDecorations(currentState.decoration, []);
      }
      return {
        ...currentState,
        suggestion: null,
        position: null,
        decoration: [],
      };
    });
  }, []);

  const clearSuggestion = useCallback((editor: any) => {
    setState((currentState) => {
      if (editor && currentState.decoration.length > 0) {
        editor.deltaDecorations(currentState.decoration, []);
      }
      return {
        ...currentState,
        suggestion: null,
        position: null,
        decoration: [],
      };
    });
  }, []);

  return {
    ...state,
    toggleEnabled,
    fetchSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestion,
  };
};
