import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const CORE = process.env.CORE_API_URL ?? "http://localhost:8080";

async function authHeader(): Promise<Record<string, string>> {
  const token = (await cookies()).get("bb_token")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectSlug: string; memberID: string }> }
) {
  const { projectSlug, memberID } = await params;
  const body = await req.json();
  const res = await fetch(`${CORE}/projects/${projectSlug}/members/${memberID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectSlug: string; memberID: string }> }
) {
  const { projectSlug, memberID } = await params;
  const res = await fetch(`${CORE}/projects/${projectSlug}/members/${memberID}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
