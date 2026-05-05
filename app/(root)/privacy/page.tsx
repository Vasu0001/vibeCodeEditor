export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-4xl font-semibold tracking-normal">Privacy Policy</h1>
      <div className="mt-6 space-y-4 leading-7 text-muted-foreground">
        <p>
          Authentication is handled through NextAuth. Repository imports use the
          GitHub API, and Gemini requests are sent to Google with the active
          editor context needed to answer your prompt.
        </p>
        <p>
          Keep API keys in environment variables and avoid pasting private
          credentials into chat or playground files.
        </p>
      </div>
    </main>
  );
}
