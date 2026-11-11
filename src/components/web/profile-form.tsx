"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function ProfileForm({ name }: { name: string }) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    const { error: updateError } = await authClient.updateUser({
      name: value.trim(),
    });

    if (updateError) {
      setError(updateError.message ?? "Could not update your name");
    } else {
      setMessage("Name updated.");
      router.refresh();
    }

    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Label htmlFor="profile-name">Display name</Label>
      <div className="flex gap-2">
        <Input
          id="profile-name"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={60}
          required
        />
        <Button
          type="submit"
          variant="outline"
          disabled={pending || !value.trim() || value.trim() === name}
        >
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
