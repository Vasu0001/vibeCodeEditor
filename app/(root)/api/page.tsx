import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Bot, Braces, FileCode2, KeyRound } from "lucide-react";

const endpoints = [
  {
    method: "POST",
    path: "/api/chat",
    title: "AI chat assistant",
    body: "{ message, history, mode, context }",
    response: "{ response, model, finishReason, tokens, timestamp }",
  },
  {
    method: "POST",
    path: "/api/code-suggestion",
    title: "Inline code completion",
    body: "{ fileContent, cursorLine, cursorColumn, suggestionType, fileName, language }",
    response: "{ suggestion, model, finishReason }",
  },
  {
    method: "GET",
    path: "/api/template/[id]",
    title: "Template file tree",
    body: "No body",
    response: "{ success, templateJson }",
  },
];

export default function ApiPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12">
      <section className="max-w-3xl space-y-5">
        <Badge className="w-fit" variant="secondary">
          API Reference
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Internal routes that power the editor.
        </h1>
        <p className="text-base leading-7 text-muted-foreground sm:text-lg">
          These endpoints are used by the playground UI for Gemini chat,
          Monaco-powered code suggestions, and stack template loading.
        </p>
      </section>

      <section className="grid gap-4">
        {endpoints.map((endpoint) => (
          <Card key={endpoint.path}>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">{endpoint.method}</Badge>
                <code className="rounded bg-muted px-2 py-1 text-sm">
                  {endpoint.path}
                </code>
              </div>
              <CardTitle className="text-xl">{endpoint.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm md:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <FileCode2 className="h-4 w-4 text-[#E93F3F]" />
                  Request
                </div>
                <code className="break-words text-muted-foreground">
                  {endpoint.body}
                </code>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <Braces className="h-4 w-4 text-[#E93F3F]" />
                  Response
                </div>
                <code className="break-words text-muted-foreground">
                  {endpoint.response}
                </code>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <KeyRound className="h-5 w-5 text-[#E93F3F]" />
            <CardTitle>Environment</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            <code>GEMINI_API_KEY</code> is required for AI routes.{" "}
            <code>GEMINI_MODEL</code> is optional and defaults to{" "}
            <code>gemini-2.5-flash</code>.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <Bot className="h-5 w-5 text-[#E93F3F]" />
            <CardTitle>Context Shape</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Chat context can include <code>activeFileName</code>,{" "}
            <code>activeFileLanguage</code>, <code>activeFileContent</code>, and{" "}
            <code>cursorPosition</code>.
          </CardContent>
        </Card>
      </section>

      <Separator />
    </div>
  );
}
