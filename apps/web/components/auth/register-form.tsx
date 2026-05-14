"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth";

export function RegisterForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Registration failed"); return; }
      setUser(data.user);
      setToken(data.token ?? null);
      router.push("/");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = [
    "w-full rounded-xl border border-white/[0.08] bg-white/[0.03]",
    "px-4 py-3 text-sm text-white placeholder-[#3f3f46]",
    "outline-none transition-all",
    "hover:border-white/[0.12] focus:border-white/[0.2] focus:bg-white/[0.05]",
  ].join(" ");

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#71717a]">Name</label>
        <input type="text" required autoComplete="name" value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls} placeholder="Your name" />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#71717a]">Email</label>
        <input type="email" required autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls} placeholder="you@example.com" />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#71717a]">Password</label>
        <input type="password" required autoComplete="new-password" minLength={8} value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls} placeholder="Min. 8 characters" />
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-xs text-red-400">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading}
        className="mt-2 w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40">
        {loading ? "Creating account…" : "Create account"}
      </button>

      <p className="pt-1 text-center text-xs text-[#3f3f46]">
        Already have an account?{" "}
        <Link href="/login" className="text-[#71717a] underline underline-offset-4 transition-colors hover:text-white">
          Sign in
        </Link>
      </p>
    </form>
  );
}
