"use client";

import { useState } from "react";
import { LogFilters } from "./log-filters";
import { HistoryLogViewer } from "./history-log-viewer";
import { LiveLogViewer } from "./live-log-viewer";

interface Props {
  projectSlug: string;
  folderID?: string;
  level?: string;
  environment?: string;
}

export function LogViewer({ projectSlug, folderID, level, environment }: Props) {
  const [mode, setMode] = useState<"live" | "history">("live");
  const [paused, setPaused] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <LogFilters
        projectSlug={projectSlug}
        mode={mode}
        onModeChange={setMode}
        paused={paused}
        onPauseToggle={() => setPaused((p) => !p)}
      />

      {mode === "live" ? (
        <LiveLogViewer
          projectSlug={projectSlug}
          folderID={folderID}
          level={level}
          environment={environment}
          paused={paused}
        />
      ) : (
        <HistoryLogViewer
          projectSlug={projectSlug}
          folderID={folderID}
          level={level}
          environment={environment}
        />
      )}
    </div>
  );
}
