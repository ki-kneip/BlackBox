"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import type { Log } from "@/lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";
const MAX_LOGS = 2000;

interface Options {
  projectSlug: string;
  folderID?: string;
  level?: string;
  environment?: string;
  paused: boolean;
}

export function useLogStream({ projectSlug, folderID, level, environment, paused }: Options) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [connected, setConnected] = useState(false);
  const bufferRef = useRef<Log[]>([]);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;

    const params = new URLSearchParams();
    params.set("token", token);
    if (folderID)    params.set("folder_id", folderID);
    if (level)       params.set("level", level);
    if (environment) params.set("environment", environment);

    const url = `${WS_URL}/projects/${projectSlug}/ws/logs?${params}`;
    const ws = new WebSocket(url);

    ws.onopen  = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (e) => {
      try {
        bufferRef.current.push(JSON.parse(e.data));
      } catch { /* ignore malformed frames */ }
    };

    return () => { ws.close(); setConnected(false); };
  }, [projectSlug, folderID, level, environment, token]);

  // Flush buffer into state at ~30 fps when not paused.
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      if (bufferRef.current.length === 0) return;
      setLogs((prev) => {
        const next = [...prev, ...bufferRef.current].slice(-MAX_LOGS);
        bufferRef.current = [];
        return next;
      });
    }, 33);
    return () => clearInterval(id);
  }, [paused]);

  return { logs, connected };
}
