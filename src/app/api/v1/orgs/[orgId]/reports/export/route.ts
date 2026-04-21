import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError } from "@/lib/auth-utils";
import { toCSV } from "@/lib/csv-export";

export async function GET(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireOrgMembership(orgId);
    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const meetingTypeId = url.searchParams.get("meetingTypeId");
    const type = url.searchParams.get("type") || "meetings"; // meetings | attendance

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
        createdBy: { select: { name: true } },
      },
      orderBy: { startedAt: "desc" },
    });

    let csv: string;
    let filename: string;

    if (type === "attendance") {
      const headers = ["Date", "Meeting Type", "Attendee", "Title", "Role", "Joined", "Left", "Duration (min)"];
      const rows: string[][] = [];
      for (const m of meetings) {
        for (const a of m.attendances) {
          rows.push([
            new Date(m.startedAt).toISOString().split("T")[0],
            m.meetingType.name,
            a.name,
            a.title === "NONE" ? "" : a.title,
            a.role || "",
            new Date(a.joinedAt).toISOString(),
            a.leftAt ? new Date(a.leftAt).toISOString() : "",
            String(a.durationMinutes || 0),
          ]);
        }
      }
      csv = toCSV(headers, rows);
      filename = "attendance-export.csv";
    } else {
      const headers = ["Date", "Meeting Type", "Started", "Ended", "Duration (min)", "Attendees", "Created By"];
      const rows = meetings.map((m) => [
        new Date(m.startedAt).toISOString().split("T")[0],
        m.meetingType.name,
        new Date(m.startedAt).toISOString(),
        m.endedAt ? new Date(m.endedAt).toISOString() : "",
        m.endedAt ? String(Math.round((new Date(m.endedAt).getTime() - new Date(m.startedAt).getTime()) / 60000)) : "",
        String(m.attendances.length),
        m.createdBy.name || "",
      ]);
      csv = toCSV(headers, rows);
      filename = "meetings-export.csv";
    }

    return new Response(csv, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename=${filename}` },
    });
  } catch (e: any) {
    return apiError(e.message, 401);
  }
}
