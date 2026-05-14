"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useLogStream } from "@/lib/hooks/use-log-stream";
import { LogRow } from "./log-row";

interface Props {
  projectSlug: string;
  folderID?: string;
  level?: string;
  environment?: string;
  paused: boolean;
}

export function LiveLogViewer({ projectSlug, folderID, level, environment, paused }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { logs, connected } = useLogStream({ projectSlug, folderID, level, environment, paused });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paused && !selectedId) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, paused, selectedId]);

  const handleSelect = useCallback((id: string | null) => setSelectedId(id), []);

  return (
    <div className="relative flex flex-1 flex-col overflow-auto">
      {!connected && (
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/[0.05] px-4 py-2 text-xs text-amber-400/70">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400/60 animate-pulse" />
          Connecting to log stream…
        </div>
      )}

      {logs.length === 0 && connected && (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04]">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <p className="text-sm text-[#52525b]">Waiting for logs</p>
          <p className="text-xs text-[#3f3f46]">Logs will appear here as they are emitted.</p>
        </div>
      )}

      <div className="flex-1">
        {logs.map((log) => (
          <LogRow key={log.id} log={log} selected={selectedId === log.id} onSelect={handleSelect} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
