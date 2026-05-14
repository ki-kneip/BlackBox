"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  projectSlug: string;
  paused: boolean;
  onPauseToggle: () => void;
}

const levels = ["", "debug", "info", "warn", "error", "fatal"];
const envs = ["", "dev", "production", "app"];

export function LogFilter({ projectSlug, paused, onPauseToggle }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/${projectSlug}/logs?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2">
      <select
        className="bg-transparent text-sm text-white/70 border border-white/20 rounded px-2 py-1"
        value={sp.get("environment") ?? ""}
        onChange={(e) => update("environment", e.target.value)}
      >
        {envs.map((e) => <option key={e} value={e}>{e || "all envs"}</option>)}
      </select>

      <select
        className="bg-transparent text-sm text-white/70 border border-white/20 rounded px-2 py-1"
        value={sp.get("level") ?? ""}
        onChange={(e) => update("level", e.target.value)}
      >
        {levels.map((l) => <option key={l} value={l}>{l || "all levels"}</option>)}
      </select>

      <button
        onClick={onPauseToggle}
        className="ml-auto text-xs border border-white/20 rounded px-3 py-1 text-white/60 hover:text-white transition-colors"
      >
        {paused ? "Resume" : "Pause"}
      </button>
    </div>
  );
}
