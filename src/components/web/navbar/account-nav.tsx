"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const linkClass =
  "rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export function AccountNav() {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return <div className="h-8 w-16 rounded-md bg-muted/50" />;
  }

  if (!data) {
    return (
      <Link
        href="/login"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Link href="/saved" className={linkClass}>
        Saved
      </Link>
      <Link href="/profile" className={linkClass}>
        Profile
      </Link>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Sign out"
        onClick={async () => {
          await authClient.signOut();
          router.push("/");
          router.refresh();
        }}
      >
        <LogOut />
        <span className="hidden lg:inline">Sign out</span>
      </Button>
    </div>
  );
}
