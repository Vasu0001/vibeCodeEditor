import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Code2,
  FolderTree,
  Keyboard,
  PanelRight,
  Play,
  Server,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const sections = [
  {
    icon: FolderTree,
    title: "Project Files",
    body: "Create, rename, delete, and organize files from the sidebar. Saves update the editor state, persisted playground content, and the WebContainer filesystem.",
  },
  {
    icon: Code2,
    title: "Monaco Editor",
    body: "Syntax highlighting follows the selected file extension. Use Ctrl+S to save and Ctrl+Space to ask Gemini for an inline completion.",
  },
  {
    icon: Server,
    title: "WebContainers",
    body: "Each template mounts into an isolated browser runtime, installs dependencies, starts its dev server, and streams terminal output inside the preview panel.",
  },
  {
    icon: Bot,
    title: "Gemini Assistant",
    body: "The AI chat receives the active filename, language, cursor position, and file contents so suggestions are grounded in the code you are editing.",
  },
];

const shortcuts = [
  ["Save file", "Ctrl+S"],
  ["Inline completion", "Ctrl+Space"],
  ["Double-enter completion", "Enter twice"],
  ["Accept suggestion", "Tab"],
  ["Reject suggestion", "Esc"],
];

export default function DocsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12">
      <section className="flex flex-col gap-5">
        <Badge className="w-fit" variant="secondary">
          Documentation
        </Badge>
        <div className="max-w-3xl space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Build and run full-stack playgrounds in the browser.
          </h1>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            VibeCode Editor combines Next.js App Router, Monaco, xterm.js,
            WebContainers, and Gemini so projects can be edited, executed, and
            improved without leaving the workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="brand">
            <Link href="/dashboard" prefetch={false}>Open Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/api">View API</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <section.icon className="h-5 w-5 text-[#E93F3F]" />
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {section.body}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border bg-background p-6">
          <div className="flex items-center gap-3">
            <Play className="h-5 w-5 text-[#E93F3F]" />
            <h2 className="text-2xl font-semibold">Workflow</h2>
          </div>
          <Separator className="my-5" />
          <div className="grid gap-5 text-sm leading-6 text-muted-foreground">
            <p>
              Start from the dashboard, choose a stack template, then open any
              file from the explorer. The preview panel boots the selected
              stack with its own package scripts.
            </p>
            <p>
              Gemini chat can insert generated code into the active file. Inline
              suggestions are designed to return only insertable code, which
              keeps Monaco completions fast and predictable.
            </p>
            <p>
              When you save, file changes are written to the persisted
              playground data and mirrored into the WebContainer virtual file
              system.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <Keyboard className="h-5 w-5 text-[#E93F3F]" />
            <CardTitle>Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {shortcuts.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <kbd className="rounded border bg-muted px-2 py-1 text-xs">
                  {value}
                </kbd>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <Sparkles className="h-5 w-5 text-[#E93F3F]" />
            <CardTitle>Gemini Setup</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Add <code>GEMINI_API_KEY</code> to your environment. Optionally set{" "}
            <code>GEMINI_MODEL</code>; otherwise the app uses{" "}
            <code>gemini-2.5-flash</code>.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <PanelRight className="h-5 w-5 text-[#E93F3F]" />
            <CardTitle>Preview Panel</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            React, Vue, Next.js, Express, Hono, and Angular starters each define
            a <code>start</code> script that WebContainers can launch directly.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
