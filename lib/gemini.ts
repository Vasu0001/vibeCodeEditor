const GEMINI_API_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta";

export const DEFAULT_GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-2.5-flash";

type GeminiRole = "user" | "model";

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role?: GeminiRole;
  parts: GeminiPart[];
}

export interface GeminiHistoryMessage {
  role: string;
  content: string;
}

interface GenerateGeminiTextOptions {
  prompt: string;
  systemInstruction?: string;
  history?: GeminiHistoryMessage[];
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

export class GeminiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiConfigError";
  }
}

export class GeminiApiError extends Error {
  status: number;
  details: string;

  constructor(status: number, details: string) {
    super(`Gemini API request failed with status ${status}`);
    this.name = "GeminiApiError";
    this.status = status;
    this.details = details;
  }
}

function toGeminiRole(role: string): GeminiRole {
  return role === "assistant" || role === "model" ? "model" : "user";
}

function toContent(message: GeminiHistoryMessage): GeminiContent {
  return {
    role: toGeminiRole(message.role),
    parts: [{ text: message.content }],
  };
}

export function stripMarkdownCodeFence(value: string) {
  return value
    .replace(/\r/g, "")
    .replace(/^```[\w-]*\s*\n?/i, "")
    .replace(/\n?```$/i, "")
    .replace(/^\n+/, "")
    .replace(/\s+$/, "");
}

export async function generateGeminiText({
  prompt,
  systemInstruction,
  history = [],
  model = DEFAULT_GEMINI_MODEL,
  temperature = 0.3,
  maxOutputTokens = 2048,
}: GenerateGeminiTextOptions) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiConfigError("Missing GEMINI_API_KEY");
  }

  const contents: GeminiContent[] = [
    ...history.slice(-12).map(toContent),
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];

  const response = await fetch(
    `${GEMINI_API_BASE_URL}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        ...(systemInstruction
          ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
          : {}),
        generationConfig: {
          temperature,
          maxOutputTokens,
          topP: 0.95,
        },
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new GeminiApiError(response.status, details);
  }

  const data = (await response.json()) as GeminiResponse;
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || "";

  return {
    text,
    model,
    finishReason: data.candidates?.[0]?.finishReason,
    usageMetadata: data.usageMetadata,
  };
}
