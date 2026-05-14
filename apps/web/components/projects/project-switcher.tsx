"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import { clsx } from "clsx";
import { CreateProjectModal } from "./create-project-modal";
import type { Project } from "@/lib/types";

interface Props {
  projects: Project[];
  currentSlug: string;
}

export function ProjectSwitcher({ projects, currentSlug }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = projects.find((p) => p.slug === currentSlug);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <>
      <div ref={ref} className="relative">
        <button onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-all hover:bg-white/[0.05]">
          <span className="truncate font-medium text-[#e4e4e7]">{current?.name ?? currentSlug}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-[#3f3f46]" />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#1f1f23] py-1 shadow-2xl">
            {projects.map((p) => (
              <button key={p.id}
                onClick={() => { router.push(`/${p.slug}/logs`); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/[0.05]">
                <Check className={clsx("h-3.5 w-3.5 shrink-0", p.slug === currentSlug ? "text-white" : "text-transparent")} />
                <span className={clsx("truncate", p.slug === currentSlug ? "text-white" : "text-[#71717a]")}>
                  {p.name}
                </span>
              </button>
            ))}

            <div className="my-1 border-t border-white/[0.06]" />

            <button onClick={() => { setOpen(false); setShowCreate(true); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#52525b] transition-colors hover:bg-white/[0.05] hover:text-[#a1a1aa]">
              <Plus className="h-3.5 w-3.5 shrink-0" />
              New project
            </button>
          </div>
        )}
      </div>

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </>
  );
}
