import { LogViewer } from "@/components/logs/log-viewer";

interface Props {
  params: Promise<{ projectSlug: string }>;
  searchParams: Promise<{
    folder_id?: string;
    level?: string;
    environment?: string;
  }>;
}

export default async function LogsPage({ params, searchParams }: Props) {
  const { projectSlug } = await params;
  const { folder_id, level, environment } = await searchParams;

  return (
    <div className="flex h-full flex-col">
      <LogViewer
        projectSlug={projectSlug}
        folderID={folder_id}
        level={level}
        environment={environment}
      />
    </div>
  );
}
