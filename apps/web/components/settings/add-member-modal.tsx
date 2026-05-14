"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { RoleSelect } from "./role-select";
import type { Membership } from "@/lib/types";

type Role = Exclude<Membership["role"], "owner">;

interface Props {
  projectSlug: string;
  onClose: () => void;
  onAdded: () => void;
}

export function AddMemberModal({ projectSlug, onClose, onAdded }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectSlug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to add member"); return; }
      onAdded(); onClose();
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#18181b] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Add member</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-[#52525b] transition-colors hover:bg-white/[0.06] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#a1a1aa]">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-[#52525b] outline-none transition-all focus:border-white/20 focus:bg-white/[0.06]"
              placeholder="teammate@example.com" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#a1a1aa]">Role</label>
            <RoleSelect value={role} onChange={(r) => setRole(r as Role)} excludeOwner />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-xs text-red-400">{error}</div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-white/[0.08] py-2.5 text-sm text-[#71717a] transition-all hover:border-white/[0.14] hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={loading || !email}
              className="flex-1 rounded-lg bg-white py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40">
              {loading ? "Adding…" : "Add member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
