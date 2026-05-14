"use client";

import { format } from "date-fns";
import { X } from "lucide-react";
import type { Log } from "@/lib/types";

const levelColor: Record<string, string> = {
  debug: "text-zinc-400",
  info:  "text-blue-400",
  warn:  "text-amber-400",
  error: "text-red-400",
  fatal: "text-red-300",
};

interface Props {
  log: Log;
  onClose: () => void;
}

export function LogDetail({ log, onClose }: Props) {
  return (
    <div className="border-t border-white/[0.05] bg-[#1a1a1d] px-5 py-4 font-mono text-xs">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap text-[#52525b]">
          <span className={`font-bold uppercase tracking-wider ${levelColor[log.level]}`}>{log.level}</span>
          <span>·</span>
          <span className="text-[#71717a]">{log.environment}</span>
          <span>·</span>
          <span>{format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss.SSS")}</span>
          <span>·</span>
          <span>seq {log.seq}</span>
        </div>
        <button onClick={onClose}
          className="shrink-0 rounded-md p-1 text-[#52525b] transition-colors hover:bg-white/[0.06] hover:text-white">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Message */}
      <p className="mb-4 font-sans text-sm text-[#e4e4e7] break-words leading-relaxed">{log.message}</p>

      {/* Tags */}
      {log.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {log.tags.map((t) => (
            <span key={t} className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] text-[#a1a1aa] ring-1 ring-white/[0.08]">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Metadata */}
      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <div className="mb-4 rounded-lg border border-white/[0.06] bg-[#0f0f11] p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#3f3f46]">metadata</p>
          <pre className="overflow-x-auto text-[11px] leading-relaxed text-[#a1a1aa]">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}

      {/* Hash chain */}
      <div className="space-y-1.5 border-t border-white/[0.05] pt-3">
        <div className="flex gap-2">
          <span className="w-8 shrink-0 text-[#3f3f46]">hash</span>
          <span className="break-all text-[#71717a]">{log.hash}</span>
        </div>
        <div className="flex gap-2">
          <span className="w-8 shrink-0 text-[#3f3f46]">prev</span>
          <span className="break-all text-[#52525b]">{log.prev_hash || "—"}</span>
        </div>
      </div>
    </div>
  );
}
