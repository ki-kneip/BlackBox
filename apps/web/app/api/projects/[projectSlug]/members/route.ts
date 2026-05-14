import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const CORE = process.env.CORE_API_URL ?? "http://localhost:8080";

async function authHeader(): Promise<Record<string, string>> {
  const token = (await cookies()).get("bb_token")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectSlug: string }> }
) {
  const { projectSlug } = await params;
  const res = await fetch(`${CORE}/projects/${projectSlug}/members`, {
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectSlug: string }> }
) {
  const { projectSlug } = await params;
  const body = await req.json();
  const res = await fetch(`${CORE}/projects/${projectSlug}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
