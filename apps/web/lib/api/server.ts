import { cookies } from "next/headers";

const CORE = process.env.CORE_API_URL ?? "http://localhost:8080";

export async function serverFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = (await cookies()).get("bb_token")?.value;
  const res = await fetch(`${CORE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}
