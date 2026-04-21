import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function OrgHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) notFound();

  const meetingTypes = await prisma.meetingType.findMany({
    where: { orgId: org.id },
    orderBy: { sortOrder: "asc" },
  });

  const recentMeetings = await prisma.meeting.findMany({
    where: { orgId: org.id },
    include: {
      meetingType: { select: { name: true } },
      createdBy: { select: { name: true } },
      _count: { select: { attendances: true } },
    },
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-8">
      {/* Quick start */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Start a Meeting</h3>
        {meetingTypes.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600 mb-3">No meeting types configured yet.</p>
            <Link
              href={`/org/${slug}/meeting-types/new`}
              className="text-blue-600 font-medium hover:underline"
            >
              Create your first meeting type
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {meetingTypes.map((mt) => (
              <Link
                key={mt.id}
                href={`/org/${slug}/meetings/new?type=${mt.id}`}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <h4 className="font-medium text-gray-900">{mt.name}</h4>
                {mt.description && (
                  <p className="text-sm text-gray-500 mt-1">{mt.description}</p>
                )}
                <p className="text-xs text-blue-600 mt-2 font-medium">Start &rarr;</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent meetings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Meetings</h3>
        {recentMeetings.length === 0 ? (
          <p className="text-gray-500">No meetings yet. Start one above!</p>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Attendees</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Started By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentMeetings.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <Link href={`/org/${slug}/meetings/${m.id}`} className="hover:text-blue-600">
                        {new Date(m.startedAt).toLocaleDateString()}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.meetingType.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        m.status === "completed" ? "bg-green-100 text-green-700" :
                        m.status === "in_progress" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {m.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m._count.attendances}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.createdBy.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
