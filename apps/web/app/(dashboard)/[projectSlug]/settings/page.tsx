import { MembersTable } from "@/components/settings/members-table";

interface Props {
  params: Promise<{ projectSlug: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { projectSlug } = await params;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-3xl">
        <MembersTable projectSlug={projectSlug} />
      </div>
    </div>
  );
}
