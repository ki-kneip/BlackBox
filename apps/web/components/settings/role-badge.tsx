import { clsx } from "clsx";
import type { Membership } from "@/lib/types";

const styles: Record<Membership["role"], string> = {
  owner:  "bg-amber-500/10 text-amber-400  ring-amber-500/20",
  admin:  "bg-blue-500/10  text-blue-400   ring-blue-500/20",
  member: "bg-white/[0.06] text-[#a1a1aa]  ring-white/[0.08]",
  viewer: "bg-white/[0.04] text-[#71717a]  ring-white/[0.06]",
};

export function RoleBadge({ role }: { role: Membership["role"] }) {
  return (
    <span className={clsx("inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ring-1", styles[role])}>
      {role}
    </span>
  );
}
