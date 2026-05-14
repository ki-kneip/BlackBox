"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Folder } from "@/lib/types";

interface Props {
  projectSlug: string;
  parentFolder: Folder | null;
  onClose: () => void;
  onCreated: (folder: Folder) => void;
}

export function CreateFolderModal({ projectSlug, parentFolder, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectSlug}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parent_id: parentFolder?.id ?? null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create folder"); return; }
      onCreated(data.folder);
      onClose();
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#18181b] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">New folder</h2>
            {parentFolder && (
              <p className="mt-0.5 text-xs text-[#52525b]">
                inside <span className="text-[#a1a1aa]">{parentFolder.name}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-[#52525b] transition-colors hover:bg-white/[0.06] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#a1a1aa]">Name</label>
            <input type="text" required autoFocus value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-[#52525b] outline-none transition-all focus:border-white/20 focus:bg-white/[0.06]"
              placeholder="e.g. backend, auth, payments" />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-xs text-red-400">{error}</div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-white/[0.08] py-2.5 text-sm text-[#71717a] transition-all hover:border-white/[0.14] hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={loading || !name.trim()}
              className="flex-1 rounded-lg bg-white py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40">
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
