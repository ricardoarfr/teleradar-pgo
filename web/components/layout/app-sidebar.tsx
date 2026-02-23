"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Radio, UserCheck, Building2, BookOpen, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Parceiros",
    href: "/partners",
    icon: UserCheck,
  },
  {
    label: "Empresas",
    href: "/companies",
    icon: Building2,
  },
  {
    label: "LPU",
    href: "/lpu",
    icon: BookOpen,
  },
  {
    label: "Catálogo",
    href: "/catalog",
    icon: Settings2,
  },
  {
    label: "Usuários",
    href: "/admin/users",
    icon: Users,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r bg-background flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <Radio className="h-6 w-6 text-primary" />
        <span className="font-bold text-lg tracking-tight">Teleradar</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
