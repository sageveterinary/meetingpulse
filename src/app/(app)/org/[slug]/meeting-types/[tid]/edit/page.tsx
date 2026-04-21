import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { MeetingTypeEditor } from "@/components/meeting/meeting-type-editor";

export default async function EditMeetingTypePage({ params }: { params: Promise<{ slug: string; tid: string }> }) {
  const { slug, tid } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) notFound();

  const meetingType = await prisma.meetingType.findUnique({
    where: { id: tid, orgId: org.id },
    include: { regularAttendees: true },
  });
  if (!meetingType) notFound();

  const roster = await prisma.rosterMember.findMany({
    where: { orgId: org.id, isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Edit: {meetingType.name}</h3>
      <MeetingTypeEditor
        orgId={org.id}
        orgSlug={slug}
        roster={JSON.parse(JSON.stringify(roster))}
        existing={JSON.parse(JSON.stringify({
          id: meetingType.id,
          name: meetingType.name,
          description: meetingType.description || "",
          sections: meetingType.sections,
          regularAttendeeIds: meetingType.regularAttendees.map((a) => a.rosterMemberId),
        }))}
      />
    </div>
  );
}
