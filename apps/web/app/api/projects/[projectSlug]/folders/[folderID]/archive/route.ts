import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const CORE = process.env.CORE_API_URL ?? "http://localhost:8080";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ projectSlug: string; folderID: string }> }
) {
  const { projectSlug, folderID } = await params;
  const token = (await cookies()).get("bb_token")?.value;

  const res = await fetch(
    `${CORE}/projects/${projectSlug}/folders/${folderID}/archive`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
