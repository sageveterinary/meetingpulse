import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { MeetingTypeEditor } from "@/components/meeting/meeting-type-editor";

export default async function NewMeetingTypePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) notFound();

  const roster = await prisma.rosterMember.findMany({
    where: { orgId: org.id, isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Create Meeting Type</h3>
      <MeetingTypeEditor
        orgId={org.id}
        orgSlug={slug}
        roster={JSON.parse(JSON.stringify(roster))}
      />
    </div>
  );
}
