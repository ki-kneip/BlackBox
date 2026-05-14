"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { Log } from "@/lib/types";

interface Options {
  projectSlug: string;
  folderID?: string;
  level?: string;
  environment?: string;
  tags?: string[];
  enabled?: boolean;
}

interface LogPage {
  logs: Log[];
  next_cursor: string;
  has_more: boolean;
}

export function useLogs({ projectSlug, folderID, level, environment, tags, enabled = true }: Options) {
  return useInfiniteQuery<LogPage>({
    queryKey: ["logs", projectSlug, folderID, level, environment, tags],
    enabled,
    initialPageParam: "",
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (folderID)    params.set("folder_id", folderID);
      if (level)       params.set("level", level);
      if (environment) params.set("environment", environment);
      if (tags?.length) params.set("tags", tags.join(","));
      if (pageParam)   params.set("cursor", pageParam as string);

      const res = await fetch(`/api/projects/${projectSlug}/logs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
    getNextPageParam: (last) => last.has_more ? last.next_cursor : null,
  });
}
