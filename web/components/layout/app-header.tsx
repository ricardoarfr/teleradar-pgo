"use client";

import { useTransition } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        {user && (
          <>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
          </>
        )}
        <Button variant="ghost" size="icon" onClick={handleLogout} disabled={isPending}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
