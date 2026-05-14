"use client";

import { useState, useCallback } from "react";
import { useLogs } from "@/lib/hooks/use-logs";
import { LogRow } from "./log-row";

interface Props {
  projectSlug: string;
  folderID?: string;
  level?: string;
  environment?: string;
}

export function HistoryLogViewer({ projectSlug, folderID, level, environment }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useLogs({
    projectSlug,
    folderID,
    level,
    environment,
  });

  const logs = data?.pages.flatMap((p) => p.logs) ?? [];

  const handleSelect = useCallback((id: string | null) => setSelectedId(id), []);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-white/30">Loading logs…</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <p className="text-sm text-white/30">No logs found.</p>
        <p className="text-xs text-white/20">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="flex-1">
        {logs.map((log) => (
          <LogRow
            key={log.id}
            log={log}
            selected={selectedId === log.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {hasNextPage && (
        <div className="border-t border-white/5 p-3 text-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-md border border-white/15 px-4 py-1.5 text-xs text-white/50 hover:border-white/30 hover:text-white transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading…" : "Load older logs"}
          </button>
        </div>
      )}
    </div>
  );
}
