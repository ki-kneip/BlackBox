"use client";

import { clsx } from "clsx";
import { format } from "date-fns";
import { LogDetail } from "./log-detail";
import type { Log } from "@/lib/types";

const levelBadge: Record<string, string> = {
  debug: "bg-zinc-800/60   text-zinc-400   ring-zinc-700/40",
  info:  "bg-blue-950/60   text-blue-400   ring-blue-800/30",
  warn:  "bg-amber-950/60  text-amber-400  ring-amber-800/30",
  error: "bg-red-950/60    text-red-400    ring-red-800/30",
  fatal: "bg-red-900/70    text-red-300    ring-red-700/40",
};

const rowAccent: Record<string, string> = {
  debug: "",
  info:  "",
  warn:  "bg-amber-500/[0.02]",
  error: "bg-red-500/[0.03]",
  fatal: "bg-red-500/[0.05]",
};

interface Props {
  log: Log;
  selected: boolean;
  onSelect: (id: string | null) => void;
}

export function LogRow({ log, selected, onSelect }: Props) {
  return (
    <div className={clsx(
      "border-b border-white/[0.04] last:border-0 transition-colors",
      rowAccent[log.level],
      selected && "bg-white/[0.03]"
    )}>
      <button
        onClick={() => onSelect(selected ? null : log.id)}
        className="flex w-full items-baseline gap-3 px-4 py-1.5 text-left font-mono text-xs hover:bg-white/[0.025] transition-colors"
      >
        {/* Timestamp */}
        <span className="w-24 shrink-0 tabular-nums text-[#3f3f46]">
          {format(new Date(log.created_at), "HH:mm:ss.SSS")}
        </span>

        {/* Level badge */}
        <span className={clsx(
          "inline-flex w-12 shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
          levelBadge[log.level]
        )}>
          {log.level}
        </span>

        {/* Environment */}
        <span className="w-20 shrink-0 truncate text-[#3f3f46]">{log.environment}</span>

        {/* Message */}
        <span className="flex-1 truncate text-[#d4d4d8]">{log.message}</span>

        {/* Tags */}
        {log.tags.length > 0 && (
          <span className="hidden shrink-0 text-[#3f3f46] sm:block">
            {log.tags.slice(0, 2).map((t) => (
              <span key={t} className="mr-1 rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-[#71717a]">{t}</span>
            ))}
            {log.tags.length > 2 && (
              <span className="text-[10px] text-[#52525b]">+{log.tags.length - 2}</span>
            )}
          </span>
        )}
      </button>

      {selected && <LogDetail log={log} onClose={() => onSelect(null)} />}
    </div>
  );
}
