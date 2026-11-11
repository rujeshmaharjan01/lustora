import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/admin/sign-out-button";
import { getSession } from "@/lib/session";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const adminLinks = [
  { label: "Overview", href: "/admin" },
  { label: "Upload", href: "/admin/upload" },
  { label: "Media", href: "/admin/media" },
  { label: "Folders", href: "/admin/folders" },
  { label: "Users", href: "/admin/users" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/login");
  if ((session.user as { role?: string | null }).role !== "admin") redirect("/");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center gap-4 px-4 lg:px-8">
          <Link href="/admin" className="shrink-0 font-semibold">
            Lustora
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto text-sm">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <span className="hidden text-xs text-muted-foreground lg:inline">
              {session.user.email}
            </span>
            <Link
              href="/"
              className="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              View site
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-2xl flex-1 p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}

export const instant = false;
