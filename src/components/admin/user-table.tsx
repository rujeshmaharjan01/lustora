"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  createdAt: string;
};

export function UserTable({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(
    userId: string,
    action: "ban" | "unban" | "role",
    nextRole: "admin" | "user" = "user",
  ) {
    if (
      action === "ban" &&
      !window.confirm("Ban this user? They will be signed out.")
    ) {
      return;
    }

    setPendingId(userId);
    setError(null);

    const result =
      action === "ban"
        ? await authClient.admin.banUser({
            userId,
            banReason: "Banned by admin",
          })
        : action === "unban"
          ? await authClient.admin.unbanUser({ userId })
          : await authClient.admin.setRole({ userId, role: nextRole });

    if (result.error) {
      setError(result.error.message ?? "Action failed");
    } else {
      router.refresh();
    }

    setPendingId(null);
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const isPending = pendingId === user.id;

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : "outline"}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.banned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Active
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {user.createdAt.slice(0, 10)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isSelf || isPending}
                      onClick={() =>
                        update(
                          user.id,
                          "role",
                          user.role === "admin" ? "user" : "admin",
                        )
                      }
                    >
                      {user.role === "admin" ? "Make user" : "Make admin"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isSelf || isPending}
                      onClick={() =>
                        update(user.id, user.banned ? "unban" : "ban")
                      }
                    >
                      {user.banned ? "Unban" : "Ban"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
