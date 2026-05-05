import { NextRequest, NextResponse } from "next/server";
import {
  GeminiApiError,
  GeminiConfigError,
  generateGeminiText,
  stripMarkdownCodeFence,
} from "@/lib/gemini";
import { currentUser } from "@/features/auth/actions";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", suggestion: "" },
        { status: 401 },
      );
    }

    const {
      fileContent = "",
      cursorLine,
      cursorColumn,
      suggestionType,
      fileName,
      language,
    } = (await request.json()) as {
      fileContent?: string;
      cursorLine?: number;
      cursorColumn?: number;
      suggestionType?: string;
      fileName?: string;
      language?: string;
    };

    const lines = fileContent.split("\n");
    const safeLine = clamp(
      typeof cursorLine === "number" ? cursorLine : 0,
      0,
      Math.max(lines.length - 1, 0),
    );
    const safeColumn = clamp(
      typeof cursorColumn === "number" ? cursorColumn : 0,
      0,
      lines[safeLine]?.length ?? 0,
    );

    const currentLine = lines[safeLine] || "";
    const before = lines
      .slice(Math.max(0, safeLine - 35), safeLine)
      .join("\n");
    const after = lines.slice(safeLine + 1, safeLine + 25).join("\n");
    const beforeCursor = currentLine.slice(0, safeColumn);
    const afterCursor = currentLine.slice(safeColumn);

    const systemInstruction = `
You are an inline code completion engine.
Return only the exact code that should be inserted at the cursor.
Start with the next character to insert.
Do not repeat code that already appears before the cursor.
Respect the existing indentation and language style.
Do not include Markdown fences, explanations, comments about the request, or line numbers.
If no useful completion exists, return an empty string.
`;

    const prompt = `
File: ${fileName || "unknown"}
Language: ${language || "unknown"}
Suggestion type: ${suggestionType || "completion"}
Cursor: line ${safeLine + 1}, column ${safeColumn + 1}

Context before cursor:
\`\`\`${language || ""}
${before}
${beforeCursor}
\`\`\`

Context after cursor:
\`\`\`${language || ""}
${afterCursor}
${after}
\`\`\`

Complete the code at the cursor. Prefer the smallest useful completion.
`;

    const result = await generateGeminiText({
      prompt,
      systemInstruction,
      temperature: 0.15,
      maxOutputTokens: 768,
    });

    return NextResponse.json({
      suggestion: stripMarkdownCodeFence(result.text),
      model: result.model,
      finishReason: result.finishReason,
    });
  } catch (error: unknown) {
    console.error("AI code suggestion error:", error);

    if (error instanceof GeminiConfigError) {
      return NextResponse.json(
        { error: error.message, suggestion: "" },
        { status: 500 },
      );
    }

    if (error instanceof GeminiApiError) {
      return NextResponse.json(
        {
          error: "Upstream AI request failed",
          status: error.status,
          details: error.details,
          suggestion: "",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ suggestion: "" }, { status: 500 });
  }
}
