export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-4xl font-semibold tracking-normal">Terms of Service</h1>
      <div className="mt-6 space-y-4 leading-7 text-muted-foreground">
        <p>
          VibeCode Editor is a local development workspace. You are responsible
          for the code, repositories, prompts, and API keys you use with it.
        </p>
        <p>
          Do not use the editor to store secrets in shared playgrounds. Imported
          repositories and generated code should be reviewed before running or
          deploying.
        </p>
      </div>
    </main>
  );
}
