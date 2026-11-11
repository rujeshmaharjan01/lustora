"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { EyeOff, FolderInput, Pencil, RotateCcw } from "lucide-react";

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
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DoodFolder, DoodVideo } from "@/lib/doodstream";
import { useTRPC } from "@/trpc/client";

export function MediaManager({
  files,
  folders,
  hiddenFileCodes,
}: {
  files: DoodVideo[];
  folders: DoodFolder[];
  hiddenFileCodes: string[];
}) {
  const router = useRouter();
  const trpc = useTRPC();

  const [editing, setEditing] = useState<DoodVideo | null>(null);
  const [title, setTitle] = useState("");
  const [moving, setMoving] = useState<DoodVideo | null>(null);
  const [targetFolder, setTargetFolder] = useState("0");
  const [toggling, setToggling] = useState<DoodVideo | null>(null);

  const hidden = new Set(hiddenFileCodes);
  const currentlyHidden = toggling !== null && hidden.has(toggling.file_code);

  const rename = useMutation(
    trpc.doodStream.renameFile.mutationOptions({
      onSuccess: () => {
        setEditing(null);
        router.refresh();
      },
    }),
  );

  const move = useMutation(
    trpc.doodStream.moveFile.mutationOptions({
      onSuccess: () => {
        setMoving(null);
        router.refresh();
      },
    }),
  );

  const setHidden = useMutation(
    trpc.doodStream.setHidden.mutationOptions({
      onSuccess: () => {
        setToggling(null);
        router.refresh();
      },
    }),
  );

  if (files.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No videos found.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Video</TableHead>
              <TableHead className="hidden sm:table-cell">Uploaded</TableHead>
              <TableHead className="hidden md:table-cell">Views</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.file_code}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={file.single_img}
                      alt=""
                      loading="lazy"
                      className="h-10 w-16 shrink-0 rounded object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="max-w-56 truncate font-medium">
                          {file.title}
                        </p>
                        {hidden.has(file.file_code) && (
                          <span className="shrink-0 rounded border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {file.file_code}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {file.uploaded.slice(0, 10)}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {file.views}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(file);
                      setTitle(file.title);
                      rename.reset();
                    }}
                  >
                    <Pencil />
                    Rename
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMoving(file);
                      setTargetFolder("0");
                      move.reset();
                    }}
                  >
                    <FolderInput />
                    Move
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setToggling(file);
                      setHidden.reset();
                    }}
                  >
                    {hidden.has(file.file_code) ? <RotateCcw /> : <EyeOff />}
                    {hidden.has(file.file_code) ? "Restore" : "Hide"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename video</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (editing) {
                rename.mutate({ fileCode: editing.file_code, title });
              }
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="file-title">Title</Label>
              <Input
                id="file-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
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
                onClick={() => setEditing(null)}
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

      <Dialog
        open={moving !== null}
        onOpenChange={(open) => {
          if (!open) setMoving(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move video</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (moving) {
                move.mutate({
                  fileCode: moving.file_code,
                  folderId: targetFolder,
                });
              }
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="target-folder">Folder</Label>
              <NativeSelect
                id="target-folder"
                value={targetFolder}
                onChange={(event) => setTargetFolder(event.target.value)}
                className="w-full"
              >
                <NativeSelectOption value="0">Root</NativeSelectOption>
                {folders.map((folder) => (
                  <NativeSelectOption key={folder.fld_id} value={folder.fld_id}>
                    {folder.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            {move.error && (
              <p className="text-sm text-destructive">{move.error.message}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMoving(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={move.isPending}>
                {move.isPending ? "Moving..." : "Move"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={toggling !== null}
        onOpenChange={(open) => {
          if (!open) setToggling(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentlyHidden ? "Restore video" : "Hide video"}
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            {currentlyHidden ? (
              "This shows the video on the site again."
            ) : (
              <>
                This hides the video on Lustora only. DoodStream has no delete
                API — remove the file in{" "}
                <a
                  href="https://doodstream.com/?op=my_files"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  your DoodStream files
                </a>{" "}
                to delete it permanently.
              </>
            )}
          </p>

          {setHidden.error && (
            <p className="text-sm text-destructive">
              {setHidden.error.message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setToggling(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={currentlyHidden ? "default" : "destructive"}
              disabled={setHidden.isPending}
              onClick={() => {
                if (toggling) {
                  setHidden.mutate({
                    fileCode: toggling.file_code,
                    hidden: !currentlyHidden,
                  });
                }
              }}
            >
              {setHidden.isPending
                ? "Saving..."
                : currentlyHidden
                  ? "Restore"
                  : "Hide"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
