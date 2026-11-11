import { FolderManager } from "@/components/admin/folder-manager";
import { getFolder } from "@/lib/doodstream";

export const metadata = { title: "Folders" };

export default async function AdminFoldersPage() {
  const { folders } = await getFolder("0");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Folders</h1>
        <p className="text-sm text-muted-foreground">
          Organize files in DoodStream. Public categories are built from tags.
        </p>
      </div>

      <FolderManager folders={folders} />
    </div>
  );
}

export const instant = false;
