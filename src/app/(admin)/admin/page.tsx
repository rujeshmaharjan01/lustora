import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getAccountInfo, listFiles } from "@/lib/doodstream";
import { formatBytes } from "@/lib/format";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const [account, files, userCount] = await Promise.all([
    getAccountInfo(),
    listFiles({ perPage: 5, revalidate: 0 }),
    prisma.user.count(),
  ]);

  const stats = [
    { label: "Videos", value: files.results_total ?? String(files.files.length) },
    { label: "Users", value: String(userCount) },
    { label: "Balance", value: `$${account.balance}` },
    { label: "Storage used", value: formatBytes(account.storage_used) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          DoodStream account: {account.email}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {stat.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent videos</h2>
          <Link
            href="/admin/media"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Manage media
          </Link>
        </div>

        {files.files.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            No videos in the account yet.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border text-sm">
            {files.files.map((video) => (
              <li
                key={video.file_code}
                className="flex items-center justify-between gap-4 p-3"
              >
                <Link
                  href={`/watch/${video.file_code}`}
                  className="truncate font-medium hover:text-primary"
                >
                  {video.title}
                </Link>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {video.uploaded.slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
        <p>Storage left: {formatBytes(account.storage_left)}</p>
        <p>
          Premium: {account.premim_expire ? account.premim_expire : "Not active"}
        </p>
      </div>
    </div>
  );
}

export const instant = false;
