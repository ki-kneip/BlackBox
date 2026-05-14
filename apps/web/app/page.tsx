import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/api/server";
import { CreateFirstProject } from "@/components/projects/create-first-project";
import type { Project } from "@/lib/types";

export default async function Home() {
  let projects: Project[] = [];

  try {
    const data = await serverFetch<{ projects: Project[] }>("/projects");
    projects = data.projects ?? [];
  } catch {
    redirect("/login");
  }

  if (projects.length > 0) {
    redirect(`/${projects[0].slug}/logs`);
  }

  return <CreateFirstProject />;
}
