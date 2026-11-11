"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DoodFolder } from "@/lib/doodstream";
import { useTRPC } from "@/trpc/client";

export function FolderManager({ folders }: { folders: DoodFolder[] }) {
  const router = useRouter();
  const trpc = useTRPC();

  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState<DoodFolder | null>(null);
  const [renameName, setRenameName] = useState("");

  const create = useMutation(
    trpc.doodStream.createFolder.mutationOptions({
      onSuccess: () => {
        setName("");
        router.refresh();
      },
    }),
  );

  const rename = useMutation(
    trpc.doodStream.renameFolder.mutationOptions({
      onSuccess: () => {
        setRenaming(null);
        router.refresh();
      },
    }),
  );

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    create.mutate({ name });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="flex max-w-xl gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New folder name"
          aria-label="New folder name"
          required
        />
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Creating..." : "Create folder"}
        </Button>
      </form>

      {create.error && (
        <p className="text-sm text-destructive">{create.error.message}</p>
      )}

      {folders.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No folders yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Videos</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {folders.map((folder) => (
                <TableRow key={folder.fld_id}>
                  <TableCell className="font-medium">{folder.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {folder.total_files ?? "0"}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Link
                      href={`/categories/${folder.fld_id}?name=${encodeURIComponent(folder.name)}`}
                      className="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      Open
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRenaming(folder);
                        setRenameName(folder.name);
                        rename.reset();
                      }}
                    >
                      <Pencil />
                      Rename
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={renaming !== null}
        onOpenChange={(open) => {
          if (!open) setRenaming(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename folder</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (renaming) {
                rename.mutate({
                  folderId: renaming.fld_id,
                  name: renameName,
                });
              }
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="folder-name">Name</Label>
              <Input
                id="folder-name"
                value={renameName}
                onChange={(event) => setRenameName(event.target.value)}
                required
              />
            </div>

            {rename.error && (
              <p className="text-sm text-destructive">{rename.error.message}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenaming(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={rename.isPending}>
                {rename.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
