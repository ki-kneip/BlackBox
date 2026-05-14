"use client";

import { useState } from "react";
import { ChevronRight, Folder, FolderOpen, Plus, Archive, Copy, Check } from "lucide-react";
import { clsx } from "clsx";
import type { Folder as FolderType } from "@/lib/types";

export interface FolderTreeNode extends FolderType {
  children: FolderTreeNode[];
}

interface Props {
  node: FolderTreeNode;
  depth: number;
  canManage: boolean;
  selectedId?: string;
  onSelect?: (folder: FolderTreeNode) => void;
  onCreateChild: (parent: FolderType) => void;
  onArchive: (folder: FolderType) => void;
}

export function FolderNode({ node, depth, canManage, selectedId, onSelect, onCreateChild, onArchive }: Props) {
  const [expanded, setExpanded] = useState(depth === 0);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;

  function handleCopyID() {
    navigator.clipboard.writeText(node.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <div
        style={{ paddingLeft: `${depth * 18 + 8}px` }}
        className={clsx(
          "group flex items-center gap-1.5 rounded-lg py-1.5 pr-2 text-sm transition-colors",
          isSelected ? "bg-white/[0.08] text-white" : "text-[#71717a] hover:bg-white/[0.04] hover:text-[#e4e4e7]",
          node.archived && "opacity-40"
        )}
      >
        {/* Expand toggle */}
        <button onClick={() => setExpanded((e) => !e)}
          className="flex h-4 w-4 shrink-0 items-center justify-center text-[#3f3f46] transition-colors hover:text-[#71717a]">
          {hasChildren
            ? <ChevronRight className={clsx("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")} />
            : <span className="h-3.5 w-3.5" />}
        </button>

        {/* Icon + name */}
        <button onClick={() => onSelect?.(node)} className="flex flex-1 items-center gap-1.5 min-w-0 text-left">
          {expanded && hasChildren
            ? <FolderOpen className="h-4 w-4 shrink-0 text-amber-400/60" />
            : <Folder className="h-4 w-4 shrink-0 text-amber-400/60" />}
          <span className="truncate">{node.name}</span>
          {node.archived && (
            <span className="ml-1 shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-[#52525b]">
              archived
            </span>
          )}
        </button>

        {/* Hover actions */}
        <div className="ml-auto hidden items-center gap-0.5 group-hover:flex">
          {/* Copy ID */}
          <button onClick={handleCopyID} title={copied ? "Copied!" : `Copy ID: ${node.id}`}
            className="flex h-5 w-5 items-center justify-center rounded-md text-[#3f3f46] transition-colors hover:bg-white/[0.06] hover:text-[#a1a1aa]">
            {copied
              ? <Check className="h-3 w-3 text-green-400" />
              : <Copy className="h-3 w-3" />}
          </button>

          {canManage && !node.archived && (
            <>
              <button onClick={() => onCreateChild(node)} title="New subfolder"
                className="flex h-5 w-5 items-center justify-center rounded-md text-[#3f3f46] transition-colors hover:bg-white/[0.06] hover:text-[#a1a1aa]">
                <Plus className="h-3 w-3" />
              </button>

              {!confirmArchive ? (
                <button onClick={() => setConfirmArchive(true)} title="Archive folder"
                  className="flex h-5 w-5 items-center justify-center rounded-md text-[#3f3f46] transition-colors hover:bg-white/[0.06] hover:text-amber-400">
                  <Archive className="h-3 w-3" />
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-amber-400/80">Archive?</span>
                  <button onClick={() => { onArchive(node); setConfirmArchive(false); }}
                    className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-400 transition-colors hover:bg-amber-500/25">
                    Yes
                  </button>
                  <button onClick={() => setConfirmArchive(false)}
                    className="rounded-md px-1.5 py-0.5 text-[10px] text-[#52525b] transition-colors hover:text-white">
                    No
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {expanded && node.children.map((child) => (
        <FolderNode key={child.id} node={child} depth={depth + 1} canManage={canManage}
          selectedId={selectedId} onSelect={onSelect}
          onCreateChild={onCreateChild} onArchive={onArchive} />
      ))}
    </div>
  );
}
