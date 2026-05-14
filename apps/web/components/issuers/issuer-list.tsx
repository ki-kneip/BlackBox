"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldOff, Plus } from "lucide-react";
import { CreateIssuerModal } from "./create-issuer-modal";
import { TokenRevealModal } from "./token-reveal-modal";
import { format } from "date-fns";
import { clsx } from "clsx";
import type { Folder, Issuer } from "@/lib/types";

interface Props { projectSlug: string; }

export function IssuerList({ projectSlug }: Props) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [revealToken, setRevealToken] = useState<{ token: string; name: string } | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const { data: issuersData, isLoading } = useQuery<{ issuers: Issuer[] }>({
    queryKey: ["issuers", projectSlug],
    queryFn: () => fetch(`/api/projects/${projectSlug}/issuers`).then((r) => r.json()),
  });
  const { data: foldersData } = useQuery<{ folders: Folder[] }>({
    queryKey: ["folders", projectSlug, false],
    queryFn: () => fetch(`/api/projects/${projectSlug}/folders`).then((r) => r.json()),
  });

  const revoke = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/projects/${projectSlug}/issuers/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["issuers", projectSlug] }); setConfirmRevoke(null); },
  });

  const issuers = issuersData?.issuers ?? [];
  const folders = foldersData?.folders ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-white">Issuers</h1>
          <p className="mt-0.5 text-xs text-[#52525b]">Certificates that authorize log emission.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#a1a1aa] transition-all hover:border-white/[0.14] hover:text-white">
          <Plus className="h-3.5 w-3.5" />
          New issuer
        </button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-[#3f3f46]">Loading…</div>
        ) : issuers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] py-14">
            <p className="text-sm text-[#52525b]">No issuers yet</p>
            <p className="mt-1 text-xs text-[#3f3f46]">Create an issuer to start emitting logs.</p>
          </div>
        ) : (
          issuers.map((iss) => (
            <div key={iss.id} className={clsx(
              "rounded-xl border p-4 transition-all",
              iss.active ? "border-white/[0.07] bg-[#1f1f23]" : "border-white/[0.04] bg-[#18181b] opacity-50"
            )}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={clsx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    iss.active ? "bg-green-500/10 ring-1 ring-green-500/20" : "bg-white/[0.04] ring-1 ring-white/[0.06]"
                  )}>
                    {iss.active
                      ? <ShieldCheck className="h-4 w-4 text-green-400" />
                      : <ShieldOff className="h-4 w-4 text-[#52525b]" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{iss.name}</p>
                    <p className="text-xs text-[#52525b]">
                      {format(new Date(iss.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>

                {iss.active && (
                  confirmRevoke === iss.id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-[#71717a]">Revoke?</span>
                      <button onClick={() => revoke.mutate(iss.id)} disabled={revoke.isPending}
                        className="rounded-lg bg-red-500/15 px-2.5 py-1 text-xs text-red-400 ring-1 ring-red-500/20 transition-colors hover:bg-red-500/25">
                        Yes
                      </button>
                      <button onClick={() => setConfirmRevoke(null)}
                        className="rounded-lg px-2.5 py-1 text-xs text-[#52525b] transition-colors hover:text-white">
                        No
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmRevoke(iss.id)}
                      className="shrink-0 rounded-lg border border-white/[0.07] px-3 py-1 text-xs text-[#52525b] transition-all hover:border-red-500/30 hover:text-red-400">
                      Revoke
                    </button>
                  )
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {iss.allowed_envs.map((env) => (
                  <span key={env} className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] text-[#71717a] ring-1 ring-white/[0.06]">
                    {env}
                  </span>
                ))}
                {iss.require_signature && (
                  <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-400 ring-1 ring-blue-500/20">
                    sig required
                  </span>
                )}
                {iss.allowed_folders.length > 0 && (
                  <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] text-[#52525b] ring-1 ring-white/[0.04]">
                    {iss.allowed_folders.length} folder{iss.allowed_folders.length !== 1 ? "s" : ""}
                  </span>
                )}
                {!iss.active && (
                  <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[11px] text-red-400 ring-1 ring-red-500/20">
                    revoked
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <CreateIssuerModal projectSlug={projectSlug} folders={folders}
          onClose={() => setShowCreate(false)}
          onCreated={(iss, token) => {
            qc.invalidateQueries({ queryKey: ["issuers", projectSlug] });
            setShowCreate(false);
            setRevealToken({ token, name: iss.name });
          }} />
      )}
      {revealToken && (
        <TokenRevealModal token={revealToken.token} issuerName={revealToken.name}
          onClose={() => setRevealToken(null)} />
      )}
    </div>
  );
}
