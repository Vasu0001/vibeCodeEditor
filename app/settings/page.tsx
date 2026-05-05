import { currentUser } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, KeyRound, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await currentUser();

  if (!user?.id) {
    redirect("/auth/sign-in");
  }

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <Button asChild variant="outline" className="w-fit">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Basic account and workspace checks for this local editor.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <User className="h-5 w-5 text-cyan-600" />
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-muted-foreground">Name</div>
              <div className="font-medium">{user.name || "Not set"}</div>
            </div>
            <Separator />
            <div>
              <div className="text-muted-foreground">Email</div>
              <div className="font-medium">{user.email || "Not set"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <KeyRound className="h-5 w-5 text-emerald-600" />
            <CardTitle>AI Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Gemini API key</span>
              <Badge variant={hasGeminiKey ? "secondary" : "destructive"}>
                {hasGeminiKey ? "Configured" : "Missing"}
              </Badge>
            </div>
            <p className="leading-6 text-muted-foreground">
              Inline suggestions and chat use <code>GEMINI_API_KEY</code>. Set
              <code> GEMINI_MODEL</code> only when you want to override the
              default model.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
