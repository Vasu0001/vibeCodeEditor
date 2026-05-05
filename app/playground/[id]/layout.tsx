import { SidebarProvider } from "@/components/ui/sidebar";
import { currentUser } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import React from "react";

export default async function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user?.id) {
    redirect("/auth/sign-in");
  }

  return (
    <SidebarProvider>
      {children}
    </SidebarProvider>
  );
}
