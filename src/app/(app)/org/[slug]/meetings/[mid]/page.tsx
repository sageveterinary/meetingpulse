import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function MeetingDetailPage({ params }: { params: Promise<{ slug: string; mid: string }> }) {
  const { slug, mid } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) notFound();

  const meeting = await prisma.meeting.findUnique({
    where: { id: mid, orgId: org.id },
    include: {
      meetingType: true,
      createdBy: { select: { name: true } },
      attendances: { orderBy: { joinedAt: "asc" } },
    },
  });
  if (!meeting) notFound();

  const duration = meeting.endedAt
    ? Math.round((new Date(meeting.endedAt).getTime() - new Date(meeting.startedAt).getTime()) / 60000)
    : null;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{meeting.meetingType.name}</h3>
          <p className="text-sm text-gray-500">
            {new Date(meeting.startedAt).toLocaleString()} &middot; {duration ? `${duration} minutes` : "In progress"}
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          meeting.status === "completed" ? "bg-green-100 text-green-700" :
          meeting.status === "in_progress" ? "bg-yellow-100 text-yellow-700" :
          "bg-gray-100 text-gray-600"
        }`}>
          {meeting.status.replace("_", " ")}
        </span>
      </div>

      {meeting.status === "in_progress" && (
        <Link
          href={`/org/${slug}/meetings/${mid}/live`}
          className="inline-block mb-6 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Rejoin Live Meeting
        </Link>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Attendees ({meeting.attendances.length})</h4>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-gray-500 uppercase">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Joined</th>
              <th className="px-4 py-2">Left</th>
              <th className="px-4 py-2">Duration</th>
            </tr>
          </thead>
          <tbody>
            {meeting.attendances.map((a) => {
              const joinTime = new Date(a.joinedAt).getTime();
              const leaveTime = a.leftAt ? new Date(a.leftAt).getTime() : (meeting.endedAt ? new Date(meeting.endedAt).getTime() : Date.now());
              const attDuration = Math.round((leaveTime - joinTime) / 60000);
              return (
                <tr key={a.id} className="border-b border-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{a.name}</td>
                  <td className="px-4 py-2 text-gray-500">{a.title === "NONE" ? "\u2014" : a.title}</td>
                  <td className="px-4 py-2 text-gray-500 capitalize">{(a.role || "\u2014").replace("_", " ")}</td>
                  <td className="px-4 py-2 text-gray-500">{new Date(a.joinedAt).toLocaleTimeString()}</td>
                  <td className="px-4 py-2 text-gray-500">{a.leftAt ? new Date(a.leftAt).toLocaleTimeString() : "\u2014"}</td>
                  <td className="px-4 py-2 text-gray-500">{attDuration} min</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        Started by: {meeting.createdBy.name}
      </div>
    </div>
  );
}
