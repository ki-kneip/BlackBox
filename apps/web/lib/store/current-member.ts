"use client";

import { create } from "zustand";
import type { Membership } from "@/lib/types";

type Role = Membership["role"];

interface CurrentMemberState {
  role: Role | null;
  envAccess: string[];
  set: (role: Role, envAccess: string[]) => void;
  clear: () => void;
}

export const useCurrentMember = create<CurrentMemberState>()((set) => ({
  role: null,
  envAccess: [],
  set: (role, envAccess) => set({ role, envAccess }),
  clear: () => set({ role: null, envAccess: [] }),
}));

// Helpers for permission checks in client components.
const roleRank: Record<Role, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export function hasRole(current: Role | null, required: Role): boolean {
  if (!current) return false;
  return roleRank[current] >= roleRank[required];
}
