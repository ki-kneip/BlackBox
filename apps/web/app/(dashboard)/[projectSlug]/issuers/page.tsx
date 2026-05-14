import { IssuerList } from "@/components/issuers/issuer-list";

interface Props {
  params: Promise<{ projectSlug: string }>;
}

export default async function IssuersPage({ params }: Props) {
  const { projectSlug } = await params;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-3xl">
        <IssuerList projectSlug={projectSlug} />
      </div>
    </div>
  );
}
