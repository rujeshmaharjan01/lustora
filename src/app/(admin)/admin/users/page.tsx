import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { UserTable } from "@/components/admin/user-table";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";

export const metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const result = await auth.api.listUsers({
    query: { limit: 100, sortBy: "createdAt", sortDirection: "desc" },
    headers: await headers(),
  });

  const users = result.users.map((user) => {
    const withRole = user as typeof user & {
      role?: string | null;
      banned?: boolean | null;
    };

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: withRole.role ?? "user",
      banned: Boolean(withRole.banned),
      createdAt: user.createdAt.toISOString(),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          {result.total} account{result.total === 1 ? "" : "s"}
        </p>
      </div>

      <UserTable users={users} currentUserId={session.user.id} />
    </div>
  );
}

export const instant = false;
