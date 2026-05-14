import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const CORE = process.env.CORE_API_URL ?? "http://localhost:8080";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectSlug: string }> }
) {
  const { projectSlug } = await params;
  const token = (await cookies()).get("bb_token")?.value;

  // Forward all query params as-is.
  const qs = req.nextUrl.searchParams.toString();
  const url = `${CORE}/projects/${projectSlug}/logs${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
