"use client";

import { useState } from "react";
import { Copy, Check, AlertTriangle } from "lucide-react";

interface Props {
  token: string;
  issuerName: string;
  onClose: () => void;
}

export function TokenRevealModal({ token, issuerName, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-amber-500/25 bg-[#18181b] p-6 shadow-2xl">
        {/* Warning header */}
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Save your token</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#71717a]">
              This is the only time the token for{" "}
              <span className="font-medium text-[#a1a1aa]">{issuerName}</span> will be shown.
              Copy it now — it cannot be retrieved later.
            </p>
          </div>
        </div>

        {/* Token display */}
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-[#0f0f11] p-3.5">
          <code className="flex-1 break-all font-mono text-xs leading-relaxed text-green-400 select-all">
            {token}
          </code>
          <button onClick={handleCopy}
            className="ml-1 shrink-0 rounded-lg p-1.5 text-[#52525b] transition-all hover:bg-white/[0.06] hover:text-white"
            title="Copy token">
            {copied
              ? <Check className="h-4 w-4 text-green-400" />
              : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <button onClick={onClose}
          className="w-full rounded-lg bg-white py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90">
          I&apos;ve saved the token
        </button>
      </div>
    </div>
  );
}
