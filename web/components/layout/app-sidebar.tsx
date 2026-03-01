"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSidebarScreens } from "@/lib/screens";
import { useScreenAccess } from "@/hooks/use-screen-access";
import { useAuth } from "@/providers/auth-provider";

function SidebarItem({ screenKey, label, path, icon: Icon }: {
  screenKey: string;
  label: string;
  path: string;
  icon: React.ElementType;
}) {
  const { view } = useScreenAccess(screenKey);
  const pathname = usePathname();

  if (!view) return null;

  const isActive = pathname.startsWith(path);
  return (
    <Link
      href={path}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function AppSidebar() {
  const { isLoading } = useAuth();
  const screens = getSidebarScreens();

  return (
    <aside className="w-60 border-r bg-background flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <Radio className="h-6 w-6 text-primary" />
        <span className="font-bold text-lg tracking-tight">Teleradar</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {!isLoading && screens.map((screen) => (
          <SidebarItem
            key={screen.key}
            screenKey={screen.key}
            label={screen.label}
            path={screen.path}
            icon={screen.icon!}
          />
        ))}
      </nav>
    </aside>
  );
}
