import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Bot,
  Boxes,
  Github,
  Play,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const capabilities = [
  {
    icon: Bot,
    title: "Gemini-native coding",
    body: "Chat and inline completions understand the active file, cursor, language, and project context.",
  },
  {
    icon: Boxes,
    title: "Real stack templates",
    body: "Launch React, Next.js, Express, Hono, Vue, and Angular projects directly in WebContainers.",
  },
  {
    icon: TerminalSquare,
    title: "Browser runtime",
    body: "Install dependencies, run dev servers, and use an embedded terminal without leaving the editor.",
  },
  {
    icon: Github,
    title: "GitHub import",
    body: "Bring public repositories into a playground and keep editing with the same file explorer.",
  },
];

const stackIcons = [
  { name: "React", src: "/react.svg" },
  { name: "Next.js", src: "/nextjs-icon.svg" },
  { name: "Vue", src: "/vuejs-icon.svg" },
  { name: "Angular", src: "/angular-2.svg" },
  { name: "Express", src: "/expressjs-icon.svg" },
  { name: "Hono", src: "/hono.svg" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f7f8fb] text-[#0f172a] dark:bg-[#080b12] dark:text-zinc-50">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_520px] lg:py-16">
        <div className="space-y-8">
          <Badge className="w-fit border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            Production-ready AI playground
          </Badge>

          <div className="max-w-3xl space-y-5">
            <h1 className="text-5xl font-semibold leading-tight tracking-normal text-[#0b1020] sm:text-6xl lg:text-7xl dark:text-white">
              Build, run, and ship code from one focused workspace.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-zinc-300">
              VibeCode Editor brings Monaco, WebContainers, xterm.js, Gemini,
              OAuth, and real starter stacks into a clean browser IDE that feels
              ready for serious product work.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-[#0f172a] text-white hover:bg-[#1e293b] dark:bg-white dark:text-[#0f172a] dark:hover:bg-zinc-200"
            >
              <Link href="/dashboard" prefetch={false}>
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-slate-300 bg-white/80 text-slate-800 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <Link href="/docs">
                View Docs
                <Play className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid max-w-2xl grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-2xl font-semibold">6</div>
              <div className="text-slate-500 dark:text-zinc-400">
                starter stacks
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold">Gemini</div>
              <div className="text-slate-500 dark:text-zinc-400">
                chat and completions
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold">OAuth</div>
              <div className="text-slate-500 dark:text-zinc-400">
                Google and GitHub
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-[#0b1020] shadow-2xl shadow-slate-300/60 dark:border-zinc-800 dark:shadow-black/50">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-300" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="text-xs text-zinc-400">playground/app.tsx</div>
            </div>
            <div className="grid min-h-[420px] grid-cols-[160px_1fr]">
              <div className="border-r border-white/10 bg-white/[0.03] p-4">
                <div className="mb-4 text-xs font-medium uppercase text-zinc-500">
                  Files
                </div>
                {["app", "components", "api", "package.json"].map((item) => (
                  <div
                    key={item}
                    className="mb-2 rounded-md px-2 py-1.5 text-sm text-zinc-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="p-5 font-mono text-sm leading-7">
                <div className="text-cyan-300">import</div>
                <div className="text-zinc-300">
                  {"{ GeminiAssistant, WebContainerPreview }"}
                </div>
                <div className="mt-5 text-emerald-300">
                  export default function Workspace() {"{"}
                </div>
                <div className="pl-5 text-zinc-300">
                  return &lt;Editor ai=&quot;gemini&quot; runtime=&quot;browser&quot; /&gt;
                </div>
                <div className="text-emerald-300">{"}"}</div>

                <div className="mt-8 rounded-md border border-emerald-400/20 bg-emerald-400/10 p-4 font-sans text-sm text-emerald-100">
                  <div className="mb-2 flex items-center gap-2 font-medium">
                    <Sparkles className="h-4 w-4" />
                    Gemini suggestion ready
                  </div>
                  <p className="text-emerald-100/80">
                    Press Tab to insert the completion at your cursor.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-6 gap-3">
            {stackIcons.map((stack) => (
              <div
                key={stack.name}
                className="flex h-14 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                title={stack.name}
              >
                <Image
                  src={stack.src}
                  alt={stack.name}
                  width={26}
                  height={26}
                  className="max-h-7 object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-14 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-4">
          {capabilities.map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 p-5 dark:border-zinc-800">
              <item.icon className="mb-4 h-5 w-5 text-cyan-600 dark:text-cyan-300" />
              <h2 className="mb-2 text-base font-semibold">{item.title}</h2>
              <p className="text-sm leading-6 text-slate-600 dark:text-zinc-400">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <Badge variant="outline" className="w-fit">
            Built for demos and real work
          </Badge>
          <h2 className="text-3xl font-semibold tracking-normal">
            A recruiter sees polish. A developer gets control.
          </h2>
          <p className="leading-7 text-slate-600 dark:text-zinc-400">
            The product now has protected routes, working starter files, local
            API documentation, GitHub import, stable editor state, and a browser
            runtime that mounts the actual selected stack.
          </p>
        </div>
        <div className="grid gap-3">
          {[
            "Clean OAuth entry with Google and GitHub",
            "Path-aware file explorer and save flow",
            "Gemini chat with active Monaco context",
            "Inline suggestions through Ctrl+Space and double Enter",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
              <span className="text-sm font-medium">{item}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
