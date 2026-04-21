import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function MeetingTypesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) notFound();

  const types = await prisma.meetingType.findMany({
    where: { orgId: org.id },
    include: {
      regularAttendees: { include: { rosterMember: true } },
      _count: { select: { meetings: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Meeting Types</h3>
        <Link
          href={`/org/${slug}/meeting-types/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + New Type
        </Link>
      </div>

      {types.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-4">No meeting types yet.</p>
          <Link href={`/org/${slug}/meeting-types/new`} className="text-blue-600 font-medium hover:underline">
            Create your first meeting type
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {types.map((mt) => {
            const sections = (mt.sections as any[]) || [];
            const totalMinutes = sections.reduce((sum: number, s: any) => sum + (s.durationSeconds || 0), 0) / 60;
            return (
              <div key={mt.id} className="bg-white rounded-lg border border-gray-200 p-5 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{mt.name}</h4>
                  {mt.description && <p className="text-sm text-gray-500 mt-0.5">{mt.description}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>{sections.length} sections</span>
                    <span>{Math.round(totalMinutes)} min total</span>
                    <span>{mt.regularAttendees.length} regular attendees</span>
                    <span>{mt._count.meetings} meetings held</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/org/${slug}/meeting-types/${mt.id}/edit`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/org/${slug}/meetings/new?type=${mt.id}`}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700"
                  >
                    Start Meeting
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
