"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import type { Environment, Folder, Issuer } from "@/lib/types";

const ALL_ENVS: Environment[] = ["dev", "production", "app"];

interface Props {
  projectSlug: string;
  folders: Folder[];
  onClose: () => void;
  onCreated: (issuer: Issuer, token: string) => void;
}

export function CreateIssuerModal({ projectSlug, folders, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [requireSignature, setRequireSignature] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [allowedEnvs, setAllowedEnvs] = useState<Environment[]>([...ALL_ENVS]);
  const [allowedFolders, setAllowedFolders] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleEnv(env: Environment) {
    setAllowedEnvs((prev) => prev.includes(env) ? prev.filter((e) => e !== env) : [...prev, env]);
  }
  function toggleFolder(id: string) {
    setAllowedFolders((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (allowedEnvs.length === 0) { setError("Select at least one environment"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectSlug}/issuers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          require_signature: requireSignature,
          public_key: requireSignature ? publicKey : undefined,
          allowed_envs: allowedEnvs,
          allowed_folders: allowedFolders,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create issuer"); return; }
      onCreated(data.issuer, data.token);
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-[#52525b] outline-none transition-all focus:border-white/20 focus:bg-white/[0.06]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#18181b] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">New issuer</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-[#52525b] transition-colors hover:bg-white/[0.06] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#a1a1aa]">Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className={inputCls} placeholder="e.g. backend-prod, auth-service" />
          </div>

          {/* Environments */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[#a1a1aa]">Allowed environments</label>
            <div className="flex gap-2">
              {ALL_ENVS.map((env) => (
                <button key={env} type="button" onClick={() => toggleEnv(env)}
                  className={clsx(
                    "rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-all",
                    allowedEnvs.includes(env)
                      ? "bg-white/10 text-white ring-white/20"
                      : "bg-transparent text-[#52525b] ring-white/[0.06] hover:text-[#a1a1aa]"
                  )}>
                  {env}
                </button>
              ))}
            </div>
          </div>

          {/* Folders */}
          {folders.filter((f) => !f.archived).length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#a1a1aa]">
                Allowed folders <span className="text-[#3f3f46] font-normal">(empty = all)</span>
              </label>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-white/[0.06] bg-[#1f1f23] p-1.5 space-y-0.5">
                {folders.filter((f) => !f.archived).map((folder) => (
                  <label key={folder.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-white/[0.04]">
                    <input type="checkbox" checked={allowedFolders.includes(folder.id)}
                      onChange={() => toggleFolder(folder.id)}
                      className="h-3.5 w-3.5 accent-white/60 rounded" />
                    <span className="text-[#a1a1aa]">{folder.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Signature */}
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-3">
              <button type="button" onClick={() => setRequireSignature((v) => !v)}
                className={clsx(
                  "relative h-5 w-9 rounded-full transition-colors",
                  requireSignature ? "bg-white/80" : "bg-white/[0.12]"
                )}>
                <span className={clsx(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-[#18181b] shadow transition-transform",
                  requireSignature ? "translate-x-4" : "translate-x-0.5"
                )} />
              </button>
              <span className="text-sm text-[#a1a1aa]">Require ECDSA signature</span>
            </label>

            {requireSignature && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#a1a1aa]">Public key (PEM)</label>
                <textarea required rows={4} value={publicKey} onChange={(e) => setPublicKey(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 font-mono text-xs text-white placeholder-[#52525b] outline-none transition-all focus:border-white/20 resize-none"
                  placeholder="-----BEGIN PUBLIC KEY-----" />
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-xs text-red-400">{error}</div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-white/[0.08] py-2.5 text-sm text-[#71717a] transition-all hover:border-white/[0.14] hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={loading || !name}
              className="flex-1 rounded-lg bg-white py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40">
              {loading ? "Creating…" : "Create issuer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
