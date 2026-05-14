import type { Membership } from "@/lib/types";

type Role = Membership["role"];
const ALL_ROLES: Role[] = ["owner", "admin", "member", "viewer"];

interface Props {
  value: Role;
  onChange: (role: Role) => void;
  excludeOwner?: boolean;
}

export function RoleSelect({ value, onChange, excludeOwner }: Props) {
  const roles = excludeOwner ? ALL_ROLES.filter((r) => r !== "owner") : ALL_ROLES;

  return (
    <select value={value} onChange={(e) => onChange(e.target.value as Role)}
      className="rounded-lg border border-white/[0.08] bg-[#1f1f23] px-2.5 py-1 text-xs text-[#a1a1aa] outline-none transition-all hover:border-white/[0.14] focus:border-white/[0.18] capitalize appearance-none cursor-pointer">
      {roles.map((r) => (
        <option key={r} value={r} className="bg-[#1f1f23]">{r}</option>
      ))}
    </select>
  );
}
