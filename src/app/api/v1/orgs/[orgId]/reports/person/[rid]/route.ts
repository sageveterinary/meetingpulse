import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError, apiSuccess } from "@/lib/auth-utils";
import { toCSV } from "@/lib/csv-export";

export async function GET(req: NextRequest, { params }: { params: Promise<{ orgId: string; rid: string }> }) {
  try {
    const { orgId, rid } = await params;
    await requireOrgMembership(orgId);
    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const format = url.searchParams.get("format") || "json";

    const rosterMember = await prisma.rosterMember.findUnique({ where: { id: rid, orgId } });
    if (!rosterMember) return apiError("Roster member not found", 404);

    const where: any = { rosterMemberId: rid, meeting: { orgId, status: "completed" } };
    if (startDate || endDate) {
      where.joinedAt = {};
      if (startDate) where.joinedAt.gte = new Date(startDate);
      if (endDate) where.joinedAt.lte = new Date(endDate);
    }

    const attendances = await prisma.meetingAttendance.findMany({
      where,
      include: { meeting: { include: { meetingType: { select: { name: true } } } } },
      orderBy: { joinedAt: "desc" },
    });

    const report = {
      person: rosterMember,
      totalMeetings: attendances.length,
      totalMinutes: attendances.reduce((sum, a) => sum + (a.durationMinutes || 0), 0),
      byRole: {} as Record<string, number>,
      byMeetingType: {} as Record<string, { count: number; totalMinutes: number }>,
      attendances: attendances.map((a) => ({
        meetingId: a.meetingId,
        meetingType: a.meeting.meetingType.name,
        date: a.joinedAt,
        role: a.role,
        durationMinutes: a.durationMinutes,
      })),
    };

    for (const att of attendances) {
      const role = att.role || "unassigned";
      report.byRole[role] = (report.byRole[role] || 0) + (att.durationMinutes || 0);
      const typeName = att.meeting.meetingType.name;
      if (!report.byMeetingType[typeName]) report.byMeetingType[typeName] = { count: 0, totalMinutes: 0 };
      report.byMeetingType[typeName].count++;
      report.byMeetingType[typeName].totalMinutes += att.durationMinutes || 0;
    }

    if (format === "csv") {
      const headers = ["Date", "Meeting Type", "Role", "Duration (min)"];
      const rows = attendances.map((a) => [
        new Date(a.joinedAt).toISOString().split("T")[0],
        a.meeting.meetingType.name,
        a.role || "Unassigned",
        String(a.durationMinutes || 0),
      ]);
      const csv = toCSV(headers, rows);
      return new Response(csv, {
        headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename=${rosterMember.name.replace(/\s+/g, "-")}-report.csv` },
      });
    }

    return apiSuccess(report);
  } catch (e: any) {
    return apiError(e.message, 401);
  }
}
