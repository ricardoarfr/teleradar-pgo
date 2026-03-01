"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useScreenAccess } from "@/hooks/use-screen-access";
import { LogOut, ShieldCheck } from "lucide-react";

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
  const { view: canViewProfiles } = useScreenAccess("admin.profiles");

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        {canViewProfiles && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/profiles" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              PERFIL
            </Link>
          </Button>
        )}
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
