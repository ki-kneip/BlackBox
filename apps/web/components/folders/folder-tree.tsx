"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { FolderNode, type FolderTreeNode } from "./folder-node";
import { CreateFolderModal } from "./create-folder-modal";
import { hasRole, useCurrentMember } from "@/lib/store/current-member";
import type { Folder } from "@/lib/types";

function buildTree(folders: Folder[], parentId: string | null = null): FolderTreeNode[] {
  return folders
    .filter((f) => f.parent_id === parentId)
    .map((f) => ({ ...f, children: buildTree(folders, f.id) }));
}

interface Props {
  projectSlug: string;
  selectedId?: string;
  onSelect?: (folder: Folder) => void;
}

export function FolderTree({ projectSlug, selectedId, onSelect }: Props) {
  const qc = useQueryClient();
  const myRole = useCurrentMember((s) => s.role);
  const canManage = hasRole(myRole, "member");

  const [showArchived, setShowArchived] = useState(false);
  const [creatingUnder, setCreatingUnder] = useState<Folder | null | "root">(null);

  const { data, isLoading } = useQuery<{ folders: Folder[] }>({
    queryKey: ["folders", projectSlug, showArchived],
    queryFn: () =>
      fetch(`/api/projects/${projectSlug}/folders${showArchived ? "?archived=true" : ""}`).then((r) => r.json()),
  });

  const archive = useMutation({
    mutationFn: (folderId: string) =>
      fetch(`/api/projects/${projectSlug}/folders/${folderId}/archive`, { method: "PATCH" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["folders", projectSlug] }),
  });

  const folders = data?.folders ?? [];
  const tree = buildTree(folders);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[#71717a] transition-colors hover:text-[#a1a1aa]">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)}
            className="h-3.5 w-3.5 accent-white/60 rounded" />
          Show archived
        </label>
        {canManage && (
          <button onClick={() => setCreatingUnder("root")}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#a1a1aa] transition-all hover:border-white/[0.14] hover:text-white">
            <Plus className="h-3.5 w-3.5" />
            New folder
          </button>
        )}
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-[#1f1f23] p-2 min-h-[120px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-[#3f3f46]">Loading…</div>
        ) : tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-sm text-[#52525b]">No folders yet</p>
            <p className="mt-1 text-xs text-[#3f3f46]">Create a folder to organize your logs.</p>
          </div>
        ) : (
          tree.map((node) => (
            <FolderNode key={node.id} node={node} depth={0} canManage={canManage}
              selectedId={selectedId} onSelect={onSelect}
              onCreateChild={(parent) => setCreatingUnder(parent)}
              onArchive={(folder) => archive.mutate(folder.id)} />
          ))
        )}
      </div>

      {creatingUnder !== null && (
        <CreateFolderModal projectSlug={projectSlug}
          parentFolder={creatingUnder === "root" ? null : creatingUnder}
          onClose={() => setCreatingUnder(null)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ["folders", projectSlug] }); setCreatingUnder(null); }} />
      )}
    </div>
  );
}
