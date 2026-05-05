import Link from "next/link";
import { Github as LucideGithub } from "lucide-react";

export function Footer() {
  const repoUrl =
    process.env.NEXT_PUBLIC_GITHUB_REPO_URL ||
    "https://github.com/Vasu0001/vibeCodeEditor";

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-col items-center space-y-6 text-center">
        {repoUrl && (
          <Link
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Project GitHub repository"
          >
            <LucideGithub className="w-5 h-5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" />
          </Link>
        )}

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          &copy; {new Date().getFullYear()} VibeCode Editor. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
