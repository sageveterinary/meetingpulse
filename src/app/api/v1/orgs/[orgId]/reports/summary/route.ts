import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError, apiSuccess } from "@/lib/auth-utils";
import { toCSV } from "@/lib/csv-export";

export async function GET(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireOrgMembership(orgId);
    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const meetingTypeId = url.searchParams.get("meetingTypeId");
    const format = url.searchParams.get("format") || "json";

    const where: any = { orgId, status: "completed" };
    if (meetingTypeId) where.meetingTypeId = meetingTypeId;
    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) where.startedAt.gte = new Date(startDate);
      if (endDate) where.startedAt.lte = new Date(endDate);
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        meetingType: { select: { name: true } },
        attendances: true,
      },
      orderBy: { startedAt: "desc" },
    });

    const summary = {
      totalMeetings: meetings.length,
      totalMinutes: meetings.reduce((sum, m) => {
        if (m.endedAt && m.startedAt) {
          return sum + (new Date(m.endedAt).getTime() - new Date(m.startedAt).getTime()) / 60000;
        }
        return sum;
      }, 0),
      byType: {} as Record<string, { count: number; totalMinutes: number }>,
      byRole: {} as Record<string, { count: number; totalMinutes: number }>,
      byPerson: {} as Record<string, { name: string; title: string; totalMinutes: number; meetingCount: number; byRole: Record<string, number> }>,
    };

    for (const meeting of meetings) {
      const typeName = meeting.meetingType.name;
      const meetingDuration = meeting.endedAt
        ? (new Date(meeting.endedAt).getTime() - new Date(meeting.startedAt).getTime()) / 60000
        : 0;

      if (!summary.byType[typeName]) summary.byType[typeName] = { count: 0, totalMinutes: 0 };
      summary.byType[typeName].count++;
      summary.byType[typeName].totalMinutes += meetingDuration;

      for (const att of meeting.attendances) {
        const role = att.role || "unassigned";
        if (!summary.byRole[role]) summary.byRole[role] = { count: 0, totalMinutes: 0 };
        summary.byRole[role].count++;
        summary.byRole[role].totalMinutes += att.durationMinutes || 0;

        const personKey = att.rosterMemberId || att.name;
        if (!summary.byPerson[personKey]) {
          summary.byPerson[personKey] = { name: att.name, title: att.title, totalMinutes: 0, meetingCount: 0, byRole: {} };
        }
        summary.byPerson[personKey].meetingCount++;
        summary.byPerson[personKey].totalMinutes += att.durationMinutes || 0;
        if (!summary.byPerson[personKey].byRole[role]) summary.byPerson[personKey].byRole[role] = 0;
        summary.byPerson[personKey].byRole[role] += att.durationMinutes || 0;
      }
    }

    if (format === "csv") {
      const headers = ["Date", "Meeting Type", "Duration (min)", "Attendees"];
      const rows = meetings.map((m) => [
        new Date(m.startedAt).toISOString().split("T")[0],
        m.meetingType.name,
        m.endedAt ? String(Math.round((new Date(m.endedAt).getTime() - new Date(m.startedAt).getTime()) / 60000)) : "N/A",
        String(m.attendances.length),
      ]);
      const csv = toCSV(headers, rows);
      return new Response(csv, {
        headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=meeting-report.csv" },
      });
    }

    return apiSuccess(summary);
  } catch (e: any) {
    return apiError(e.message, 401);
  }
}
