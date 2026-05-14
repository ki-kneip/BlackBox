import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ projectSlug: string }>;
}

export default async function ProjectRoot({ params }: Props) {
  const { projectSlug } = await params;
  redirect(`/${projectSlug}/logs`);
}
