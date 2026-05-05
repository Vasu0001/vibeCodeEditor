"use server"
import { currentUser } from "@/features/auth/actions";
import { db } from "@/lib/db"
import { TemplateFolder } from "../libs/path-to-json";
import { revalidatePath } from "next/cache";

type TemplateItem = TemplateFolder["items"][number];

interface GitHubTreeItem {
  path: string;
  type: "blob" | "tree";
  size?: number;
  url?: string;
}

const ignoredGitHubFolders = new Set([
  ".git",
  ".github",
  ".next",
  ".turbo",
  ".vercel",
  "coverage",
  "dist",
  "build",
  "node_modules",
]);

const ignoredGitHubFiles = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  ".DS_Store",
]);

function parseGitHubUrl(repoUrl: string) {
  let url: URL;

  try {
    url = new URL(repoUrl.trim());
  } catch {
    throw new Error("Enter a valid GitHub repository URL");
  }

  if (!["github.com", "www.github.com"].includes(url.hostname)) {
    throw new Error("Only github.com repository URLs are supported");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const [owner, repoWithSuffix] = parts;

  if (!owner || !repoWithSuffix) {
    throw new Error("GitHub URL must include an owner and repository");
  }

  const repo = repoWithSuffix.replace(/\.git$/, "");
  const treeIndex = parts.indexOf("tree");
  const branch = treeIndex >= 0 ? parts[treeIndex + 1] : undefined;

  return { owner, repo, branch };
}

function getGitHubHeaders(token?: string | null) {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function shouldSkipGitHubPath(filePath: string, size = 0) {
  const parts = filePath.split("/");
  const fileName = parts[parts.length - 1];

  if (size > 1024 * 1024) return true;
  if (ignoredGitHubFiles.has(fileName)) return true;
  return parts.some((part) => ignoredGitHubFolders.has(part));
}

function addFileToTemplateTree(root: TemplateFolder, filePath: string, content: string) {
  const parts = filePath.split("/");
  const fileName = parts.pop();
  if (!fileName) return;

  let current = root;
  for (const folderName of parts) {
    let folder = current.items.find(
      (item): item is TemplateFolder =>
        "folderName" in item && item.folderName === folderName,
    );

    if (!folder) {
      folder = { folderName, items: [] };
      current.items.push(folder);
    }

    current = folder;
  }

  const dotIndex = fileName.lastIndexOf(".");
  const filename = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const fileExtension = dotIndex > 0 ? fileName.slice(dotIndex + 1) : "";

  current.items.push({
    filename,
    fileExtension,
    content,
    path: filePath,
  });
}

function sortTemplateItems(items: TemplateItem[]) {
  items.sort((a, b) => {
    const aIsFolder = "folderName" in a;
    const bIsFolder = "folderName" in b;
    if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;

    const aName = aIsFolder
      ? a.folderName
      : `${a.filename}.${a.fileExtension}`;
    const bName = bIsFolder
      ? b.folderName
      : `${b.filename}.${b.fileExtension}`;
    return aName.localeCompare(bName);
  });

  for (const item of items) {
    if ("folderName" in item) sortTemplateItems(item.items);
  }
}


// Toggle marked status for a problem
export const toggleStarMarked = async (playgroundId: string, isChecked: boolean) => {
    const user = await currentUser();
    const userId = user?.id;
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    if (isChecked) {
      await db.starMark.create({
        data: {
          userId: userId!,
          playgroundId,
          isMarked: isChecked,
        },
      });
    } else {
      await db.starMark.delete({
        where: {
          userId_playgroundId: {
            userId,
            playgroundId: playgroundId,

          },
        },
      });
    }

    revalidatePath("/dashboard");
    return { success: true, isMarked: isChecked };
  } catch (error) {
    console.error("Error updating problem:", error);
    return { success: false, error: "Failed to update problem" };
  }
};

export const createPlayground = async (data:{
    title: string;
    template: "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR";
    description?: string;
  })=>{
    const {template , title , description} = data;

    const user = await currentUser();
    if (!user?.id) {
        throw new Error("You must be signed in to create a playground");
    }

    try {
        const playground = await db.playground.create({
            data:{
                title:title,
                description:description,
                template:template,
                userId:user.id
            }
        })

        return playground;
    } catch (error) {
        console.log(error)
    }
}

export const importGithubRepository = async (repoUrl: string) => {
    const user = await currentUser();
    if (!user?.id) {
        throw new Error("You must be signed in to import a repository");
    }

    const { owner, repo, branch } = parseGitHubUrl(repoUrl);
    const account = await db.account.findFirst({
        where: {
            userId: user.id,
            provider: "github",
        },
        select: {
            accessToken: true,
        },
    });

    const headers = getGitHubHeaders(account?.accessToken);
    const repoResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers, cache: "no-store" },
    );

    if (!repoResponse.ok) {
        throw new Error(
            repoResponse.status === 404
                ? "Repository not found or not accessible"
                : "GitHub repository lookup failed",
        );
    }

    const repoData = (await repoResponse.json()) as {
        default_branch: string;
        description?: string | null;
        full_name?: string;
    };
    const ref = branch || repoData.default_branch;

    const treeResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
        { headers, cache: "no-store" },
    );

    if (!treeResponse.ok) {
        throw new Error("Could not read the repository file tree");
    }

    const treeData = (await treeResponse.json()) as {
        tree: GitHubTreeItem[];
        truncated?: boolean;
    };

    const files = treeData.tree
        .filter((item) => item.type === "blob" && item.url)
        .filter((item) => !shouldSkipGitHubPath(item.path, item.size || 0))
        .slice(0, 120);

    if (files.length === 0) {
        throw new Error("No importable files were found in this repository");
    }

    const templateJson: TemplateFolder = {
        folderName: "Root",
        items: [],
    };

    for (const file of files) {
        const blobResponse = await fetch(file.url!, {
            headers,
            cache: "no-store",
        });

        if (!blobResponse.ok) continue;

        const blob = (await blobResponse.json()) as {
            content?: string;
            encoding?: BufferEncoding;
        };

        if (!blob.content) continue;

        const content = Buffer.from(
            blob.content.replace(/\n/g, ""),
            blob.encoding || "base64",
        ).toString("utf8");

        addFileToTemplateTree(templateJson, file.path, content);
    }

    sortTemplateItems(templateJson.items);

    const playground = await db.playground.create({
        data: {
            title: repo,
            description:
                repoData.description || `Imported from ${repoData.full_name || `${owner}/${repo}`}`,
            template: "REACT",
            userId: user.id,
            templateFiles: {
                create: {
                    content: JSON.stringify(templateJson),
                },
            },
        },
    });

    revalidatePath("/dashboard");
    return playground;
}


export const getAllPlaygroundForUser = async ()=>{
    const user = await currentUser();
    if (!user?.id) return [];

    try {
        const playground = await db.playground.findMany({
            where:{
                userId:user.id
            },
            include:{
                user:true,
                Starmark:{
                    where:{
                        userId:user.id
                    },
                    select:{
                        isMarked:true
                    }
                }
            }
        })
      
        return playground;
    } catch (error) {
        console.log(error)
    }
}

export const getPlaygroundById = async (id:string)=>{
    try {
        const playground = await db.playground.findUnique({
            where:{id},
            select:{
              id:true,
              title:true,
              description:true,
              template:true,
              templateFiles:{
                select:{
                  content:true
                }
              }
            }
        })
        return playground;
    } catch (error) {
        console.log(error)
    }
}

export const SaveUpdatedCode = async (playgroundId: string, data: TemplateFolder) => {
  const user = await currentUser();
  if (!user) return null;

  try {
    const updatedPlayground = await db.templateFile.upsert({
      where: {
        playgroundId, // now allowed since playgroundId is unique
      },
      update: {
        content: JSON.stringify(data),
      },
      create: {
        playgroundId,
        content: JSON.stringify(data),
      },
    });

    return updatedPlayground;
  } catch (error) {
    console.log("SaveUpdatedCode error:", error);
    return null;
  }
};

export const deleteProjectById = async (id:string)=>{
    try {
        await db.playground.delete({
            where:{id}
        })
        revalidatePath("/dashboard")
    } catch (error) {
        console.log(error)
    }
}


export const editProjectById = async (id:string,data:{title:string , description:string})=>{
    try {
        await db.playground.update({
            where:{id},
            data:data
        })
        revalidatePath("/dashboard")
    } catch (error) {
        console.log(error)
    }
}

export const duplicateProjectById = async (id: string) => {
    try {
        // Fetch the original playground data
        const originalPlayground = await db.playground.findUnique({
            where: { id },
            include: {
                templateFiles: true, // Include related template files
            },
        });

        if (!originalPlayground) {
            throw new Error("Original playground not found");
        }

        // Create a new playground with the same data but a new ID
        const duplicatedPlayground = await db.playground.create({
            data: {
                title: `${originalPlayground.title} (Copy)`,
                description: originalPlayground.description,
                template: originalPlayground.template,
                userId: originalPlayground.userId,
                templateFiles: {
                  // @ts-ignore
                    create: originalPlayground.templateFiles.map((file) => ({
                        content: file.content,
                    })),
                },
            },
        });

        // Revalidate the dashboard path to reflect the changes
        revalidatePath("/dashboard");

        return duplicatedPlayground;
    } catch (error) {
        console.error("Error duplicating project:", error);
    }
};
