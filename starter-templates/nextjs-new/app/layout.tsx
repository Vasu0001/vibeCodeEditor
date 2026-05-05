import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js Playground",
  description: "A VibeCode starter running inside WebContainers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
