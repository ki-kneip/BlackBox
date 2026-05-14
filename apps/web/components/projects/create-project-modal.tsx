"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface Props { onClose: () => void; }

function toSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function CreateProjectModal({ onClose }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNameChange(v: string) {
    setName(v);
    if (!slugEdited) setSlug(toSlug(v));
  }

  function handleSlugChange(v: string) {
    setSlugEdited(true);
    setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create project"); return; }
      router.push(`/${data.project.slug}/logs`);
      router.refresh();
      onClose();
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-[#52525b] outline-none transition-all focus:border-white/20 focus:bg-white/[0.06]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#18181b] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">New project</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-[#52525b] transition-colors hover:bg-white/[0.06] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#a1a1aa]">Name</label>
            <input type="text" required value={name} onChange={(e) => handleNameChange(e.target.value)}
              className={inputCls} placeholder="My Project" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#a1a1aa]">Slug</label>
            <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 transition-all focus-within:border-white/20 focus-within:bg-white/[0.06]">
              <span className="text-sm text-[#3f3f46] select-none">blackbox/</span>
              <input type="text" required value={slug} onChange={(e) => handleSlugChange(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder-[#52525b]"
                placeholder="my-project" />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-xs text-red-400">{error}</div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-white/[0.08] py-2.5 text-sm text-[#71717a] transition-all hover:border-white/[0.14] hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={loading || !name || !slug}
              className="flex-1 rounded-lg bg-white py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40">
              {loading ? "Creating…" : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
