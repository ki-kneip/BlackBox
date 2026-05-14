import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const CORE = process.env.CORE_API_URL ?? "http://localhost:8080";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectSlug: string; issuerID: string }> }
) {
  const { projectSlug, issuerID } = await params;
  const token = (await cookies()).get("bb_token")?.value;

  const res = await fetch(`${CORE}/projects/${projectSlug}/issuers/${issuerID}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
