import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, Heart, MessageSquare } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "@/components/web/profile-form";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo";
import { getSession } from "@/lib/session";

export const metadata = pageMetadata({
  title: "Profile",
  description: "Manage your Lustora account.",
  path: "/profile",
  noIndex: true,
});

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) redirect("/login?next=/profile");

  const user = session.user;
  const [comments, likes, saves] = await Promise.all([
    prisma.videoComment.count({ where: { userId: user.id } }),
    prisma.videoLike.count({ where: { userId: user.id } }),
    prisma.videoSave.count({ where: { userId: user.id } }),
  ]);

  const stats = [
    { label: "Comments", value: comments, icon: MessageSquare },
    { label: "Likes", value: likes, icon: Heart },
    { label: "Saved", value: saves, icon: Bookmark },
  ];

  const initials =
    user.name
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-medium">
              {initials}
            </div>
            <div className="min-w-0">
              <CardTitle>{user.name}</CardTitle>
              <CardDescription>
                {user.email} · Joined {user.createdAt.toISOString().slice(0, 10)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border p-3">
                <stat.icon className="mx-auto size-4 text-muted-foreground" />
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <ProfileForm name={user.name} />

          <Link
            href="/saved"
            className="inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View saved videos
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}

export const instant = false;
