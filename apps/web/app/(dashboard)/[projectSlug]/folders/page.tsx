import { FolderTree } from "@/components/folders/folder-tree";

interface Props {
  params: Promise<{ projectSlug: string }>;
}

export default async function FoldersPage({ params }: Props) {
  const { projectSlug } = await params;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-base font-semibold text-white">Folders</h1>
          <p className="mt-0.5 text-xs text-[#52525b]">Organize logs into a hierarchical structure.</p>
        </div>
        <FolderTree projectSlug={projectSlug} />
      </div>
    </div>
  );
}
