"use client";

import { useEffect } from "react";
import { useCurrentMember } from "@/lib/store/current-member";
import type { Membership } from "@/lib/types";

interface Props {
  role: Membership["role"];
  envAccess: string[];
}

export function CurrentMemberInit({ role, envAccess }: Props) {
  const set = useCurrentMember((s) => s.set);
  useEffect(() => { set(role, envAccess); }, [role, envAccess, set]);
  return null;
}
