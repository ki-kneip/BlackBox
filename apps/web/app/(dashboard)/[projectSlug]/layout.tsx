import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/api/server";
import { Sidebar } from "@/components/ui/sidebar";
import { CurrentMemberInit } from "@/components/ui/current-member-init";
import type { Project, Membership } from "@/lib/types";

interface Props {
  children: React.ReactNode;
  params: Promise<{ projectSlug: string }>;
}

export default async function DashboardLayout({ children, params }: Props) {
  const { projectSlug } = await params;

  let projects: Project[] = [];
  let myRole: Membership["role"] = "viewer";
  let myEnvAccess: string[] = [];

  try {
    const [projectsData, meData] = await Promise.all([
      serverFetch<{ projects: Project[] }>("/projects"),
      serverFetch<{ role: Membership["role"]; env_access: string[] }>(
        `/projects/${projectSlug}/me`
      ),
    ]);
    projects = projectsData.projects ?? [];
    myRole = meData.role;
    myEnvAccess = meData.env_access ?? [];
  } catch {
    redirect("/login");
  }

  const exists = projects.some((p) => p.slug === projectSlug);
  if (!exists) redirect("/");

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f11]">
      <CurrentMemberInit role={myRole} envAccess={myEnvAccess} />
      <Sidebar projects={projects} currentSlug={projectSlug} myRole={myRole} />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
