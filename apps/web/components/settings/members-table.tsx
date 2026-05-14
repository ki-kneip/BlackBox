"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, UserPlus } from "lucide-react";
import { AddMemberModal } from "./add-member-modal";
import { RoleBadge } from "./role-badge";
import { RoleSelect } from "./role-select";
import { hasRole, useCurrentMember } from "@/lib/store/current-member";
import type { Membership } from "@/lib/types";

interface MemberRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: Membership["role"];
  env_access: string[];
}

interface Props { projectSlug: string; }

export function MembersTable({ projectSlug }: Props) {
  const qc = useQueryClient();
  const myRole = useCurrentMember((s) => s.role);
  const canManage = hasRole(myRole, "admin");
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading } = useQuery<{ members: MemberRow[] }>({
    queryKey: ["members", projectSlug],
    queryFn: () => fetch(`/api/projects/${projectSlug}/members`).then((r) => r.json()),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Membership["role"] }) =>
      fetch(`/api/projects/${projectSlug}/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members", projectSlug] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/projects/${projectSlug}/members/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members", projectSlug] }),
  });

  const members = data?.members ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-white">Members</h1>
          <p className="mt-0.5 text-xs text-[#52525b]">Manage project access and roles.</p>
        </div>
        {canManage && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#a1a1aa] transition-all hover:border-white/[0.14] hover:text-white">
            <UserPlus className="h-3.5 w-3.5" />
            Add member
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.07]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-[#1f1f23]">
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#52525b]">Name</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#52525b]">Email</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#52525b]">Role</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#52525b]">Env access</th>
              {canManage && <th className="px-4 py-3 w-10" />}
            </tr>
          </thead>
          <tbody className="bg-[#18181b]">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#3f3f46]">Loading…</td>
              </tr>
            ) : (
              members.map((m, i) => (
                <tr key={m.id} className={i < members.length - 1 ? "border-b border-white/[0.04]" : ""}>
                  <td className="px-4 py-3 text-sm text-[#e4e4e7]">{m.name}</td>
                  <td className="px-4 py-3 text-sm text-[#71717a]">{m.email}</td>
                  <td className="px-4 py-3">
                    {canManage && m.role !== "owner"
                      ? <RoleSelect value={m.role} onChange={(role) => updateRole.mutate({ id: m.id, role })} />
                      : <RoleBadge role={m.role} />}
                  </td>
                  <td className="px-4 py-3">
                    {m.env_access?.length ? (
                      <div className="flex gap-1 flex-wrap">
                        {m.env_access.map((e) => (
                          <span key={e} className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-[#71717a] ring-1 ring-white/[0.06]">{e}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-[#3f3f46]">All</span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      {m.role !== "owner" && (
                        <button onClick={() => remove.mutate(m.id)}
                          className="rounded-lg p-1 text-[#3f3f46] transition-all hover:bg-red-500/10 hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddMemberModal projectSlug={projectSlug}
          onClose={() => setShowAdd(false)}
          onAdded={() => qc.invalidateQueries({ queryKey: ["members", projectSlug] })} />
      )}
    </div>
  );
}
