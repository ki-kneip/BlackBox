"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useCurrentMember } from "@/lib/store/current-member";
import { Pause, Play } from "lucide-react";
import { clsx } from "clsx";
import type { Folder, Environment, Level } from "@/lib/types";

const LEVELS: Level[] = ["debug", "info", "warn", "error", "fatal"];
const ALL_ENVS: Environment[] = ["dev", "production", "app"];

interface Props {
  projectSlug: string;
  mode: "live" | "history";
  onModeChange: (mode: "live" | "history") => void;
  paused?: boolean;
  onPauseToggle?: () => void;
}

export function LogFilters({ projectSlug, mode, onModeChange, paused, onPauseToggle }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const envAccess = useCurrentMember((s) => s.envAccess);

  const { data: foldersData } = useQuery<{ folders: Folder[] }>({
    queryKey: ["folders", projectSlug, false],
    queryFn: () => fetch(`/api/projects/${projectSlug}/folders`).then((r) => r.json()),
  });

  const folders = (foldersData?.folders ?? []).filter((f) => !f.archived);
  const availableEnvs = envAccess.length > 0 ? ALL_ENVS.filter((e) => envAccess.includes(e)) : ALL_ENVS;

  function set(key: string, value: string) {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set(key, value); else p.delete(key);
    router.push(`/${projectSlug}/logs?${p}`);
  }

  const selectCls = "h-8 rounded-lg border border-white/[0.08] bg-[#1f1f23] px-2.5 text-xs text-[#a1a1aa] outline-none transition-all hover:border-white/[0.14] focus:border-white/[0.18] appearance-none cursor-pointer";

  return (
    <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#18181b] px-4 py-2.5 flex-wrap">
      {/* Filters */}
      <select className={selectCls} value={sp.get("folder_id") ?? ""} onChange={(e) => set("folder_id", e.target.value)}>
        <option value="">All folders</option>
        {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>

      <select className={selectCls} value={sp.get("environment") ?? ""} onChange={(e) => set("environment", e.target.value)}>
        <option value="">All envs</option>
        {availableEnvs.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>

      <select className={selectCls} value={sp.get("level") ?? ""} onChange={(e) => set("level", e.target.value)}>
        <option value="">All levels</option>
        {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>

      {/* Mode toggle */}
      <div className="ml-auto flex items-center gap-2">
        {mode === "live" && onPauseToggle && (
          <button onClick={onPauseToggle}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#1f1f23] px-3 text-xs text-[#71717a] transition-all hover:border-white/[0.14] hover:text-[#a1a1aa]">
            {paused
              ? <><Play className="h-3 w-3" /> Resume</>
              : <><Pause className="h-3 w-3" /> Pause</>}
          </button>
        )}

        <div className="flex h-8 items-center gap-0.5 rounded-lg border border-white/[0.08] bg-[#1f1f23] p-0.5">
          {(["live", "history"] as const).map((m) => (
            <button key={m} onClick={() => onModeChange(m)}
              className={clsx(
                "flex h-full items-center gap-1.5 rounded-md px-3 text-xs font-medium capitalize transition-all",
                mode === m
                  ? "bg-white/[0.1] text-white shadow-sm"
                  : "text-[#52525b] hover:text-[#a1a1aa]"
              )}>
              {m === "live" && (
                <span className={clsx(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  mode === "live" ? "bg-green-400 animate-pulse" : "bg-[#3f3f46]"
                )} />
              )}
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
