import { NextRequest, NextResponse } from "next/server";
import {
  GeminiApiError,
  GeminiConfigError,
  generateGeminiText,
} from "@/lib/gemini";
import { currentUser } from "@/features/auth/actions";

interface ChatContext {
  activeFileName?: string;
  activeFileContent?: string;
  activeFileLanguage?: string;
  cursorPosition?: { line: number; column: number };
}

function buildContextBlock(context?: ChatContext) {
  if (!context?.activeFileName && !context?.activeFileContent) return "";

  return `
Active editor context:
- File: ${context.activeFileName || "Untitled"}
- Language: ${context.activeFileLanguage || "unknown"}
- Cursor: ${
    context.cursorPosition
      ? `line ${context.cursorPosition.line}, column ${context.cursorPosition.column}`
      : "unknown"
  }

\`\`\`${context.activeFileLanguage || ""}
${(context.activeFileContent || "").slice(0, 12000)}
\`\`\`
`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message, history, mode, context } = body as {
      message?: string;
      history?: Array<{ role: string; content: string }>;
      mode?: string;
      context?: ChatContext;
    };

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const systemInstruction = `
You are an expert full-stack coding assistant inside Vibecode Editor.
Help with debugging, explaining code, writing clean code, and practical best practices.
Use the active editor context when relevant.
When you provide code, keep it concise and compatible with the user's current file/framework.
`;

    const prompt = [
      mode ? `Mode: ${mode}` : "",
      buildContextBlock(context),
      `User request:\n${message}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const result = await generateGeminiText({
      prompt,
      systemInstruction,
      history,
      temperature: 0.35,
      maxOutputTokens: 4096,
    });

    return NextResponse.json({
      response: result.text || "No response",
      model: result.model,
      finishReason: result.finishReason,
      tokens: result.usageMetadata?.totalTokenCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("AI chat error:", error);

    if (error instanceof GeminiConfigError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (error instanceof GeminiApiError) {
      return NextResponse.json(
        {
          error: "Upstream AI request failed",
          status: error.status,
          details: error.details,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        error: "AI failed",
        response: "Something went wrong",
      },
      { status: 500 },
    );
  }
}
