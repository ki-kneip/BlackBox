"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderOpen, Key, Settings, ScrollText, LogOut } from "lucide-react";
import { clsx } from "clsx";
import { ProjectSwitcher } from "@/components/projects/project-switcher";
import { useAuthStore } from "@/lib/store/auth";
import { hasRole } from "@/lib/store/current-member";
import type { Project, Membership } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  minRole: Membership["role"];
}

const navItems = (slug: string): NavItem[] => [
  { href: `/${slug}/logs`,     label: "Logs",     icon: ScrollText, minRole: "viewer" },
  { href: `/${slug}/folders`,  label: "Folders",  icon: FolderOpen, minRole: "viewer" },
  { href: `/${slug}/issuers`,  label: "Issuers",  icon: Key,        minRole: "admin"  },
  { href: `/${slug}/settings`, label: "Settings", icon: Settings,   minRole: "admin"  },
];

interface Props {
  projects: Project[];
  currentSlug: string;
  myRole: Membership["role"];
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function Sidebar({ projects, currentSlug, myRole }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    clear();
    router.push("/login");
  }

  const items = navItems(currentSlug).filter((item) => hasRole(myRole, item.minRole));

  return (
    <nav className="flex w-52 shrink-0 flex-col border-r border-white/[0.06] bg-[#18181b]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/[0.08]">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="3" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9"/>
            <rect x="11" y="3" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="3" y="11" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="11" y="11" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.15"/>
          </svg>
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">BlackBox</span>
      </div>

      {/* Project switcher */}
      <div className="border-y border-white/[0.06] px-2 py-2">
        <ProjectSwitcher projects={projects} currentSlug={currentSlug} />
      </div>

      {/* Nav */}
      <div className="flex flex-1 flex-col gap-0.5 p-2 pt-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={clsx(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all",
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-[#71717a] hover:bg-white/[0.04] hover:text-[#a1a1aa]"
              )}
            >
              <Icon className={clsx("h-4 w-4 shrink-0", active ? "text-white" : "text-[#52525b]")} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* User */}
      <div className="border-t border-white/[0.06] p-2">
        <button onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all hover:bg-white/[0.04]">
          {user ? (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white/70">
              {initials(user.name)}
            </div>
          ) : (
            <LogOut className="h-4 w-4 shrink-0 text-[#52525b]" />
          )}
          <div className="min-w-0 text-left">
            {user ? (
              <p className="truncate text-xs font-medium text-[#a1a1aa]">{user.name}</p>
            ) : (
              <p className="text-xs text-[#71717a]">Sign out</p>
            )}
          </div>
          <LogOut className="ml-auto h-3.5 w-3.5 shrink-0 text-[#3f3f46]" />
        </button>
      </div>
    </nav>
  );
}
