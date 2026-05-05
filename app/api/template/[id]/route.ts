import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { templatePaths } from "@/lib/template";
import { scanTemplateDirectory } from "@/features/playground/libs/path-to-json";
import type { TemplateFolder } from "@/features/playground/types";
import { currentUser } from "@/features/auth/actions";

function resolveTemplateAbsPath(templateKey: keyof typeof templatePaths) {
  // templatePaths are stored like "/starter-templates/react-ts"
  const relative = templatePaths[templateKey].replace(/^\/+/, "");
  return path.join(process.cwd(), relative);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const playground = await db.playground.findFirst({
      where: { id, userId: user.id },
      select: { template: true },
    });

    if (!playground) {
      return NextResponse.json(
        { success: false, error: "Playground not found" },
        { status: 404 },
      );
    }

    const templateKey = playground.template as keyof typeof templatePaths;

    let absTemplatePath = resolveTemplateAbsPath(templateKey);

    // If the selected template directory doesn't exist (repo missing starters),
    // fall back to the React starter so the playground can still boot.
    try {
      await scanTemplateDirectory(absTemplatePath);
    } catch {
      absTemplatePath = resolveTemplateAbsPath("REACT");
    }

    const scanned = await scanTemplateDirectory(absTemplatePath);

    const templateJson: TemplateFolder = {
      folderName: "Root",
      items: scanned.items,
    };

    return NextResponse.json({ success: true, templateJson });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to load template",
      },
      { status: 500 },
    );
  }
}
