import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError, apiSuccess } from "@/lib/auth-utils";
import { updateMeetingSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: Promise<{ orgId: string; mid: string }> }) {
  try {
    const { orgId, mid } = await params;
    await requireOrgMembership(orgId);
    const meeting = await prisma.meeting.findUnique({
      where: { id: mid, orgId },
      include: {
        meetingType: true,
        createdBy: { select: { name: true, email: true } },
        attendances: { include: { rosterMember: true } },
      },
    });
    if (!meeting) return apiError("Meeting not found", 404);
    return apiSuccess(meeting);
  } catch (e: any) {
    return apiError(e.message, 401);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ orgId: string; mid: string }> }) {
  try {
    const { orgId, mid } = await params;
    await requireOrgMembership(orgId, "member");
    const body = await req.json();
    const data = updateMeetingSchema.parse(body);

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.sectionsData) updateData.sectionsData = data.sectionsData;
    if (data.endedAt) updateData.endedAt = new Date(data.endedAt);
    if (data.status === "completed" && !data.endedAt) updateData.endedAt = new Date();

    // Calculate attendance durations when completing
    if (data.status === "completed") {
      const attendances = await prisma.meetingAttendance.findMany({ where: { meetingId: mid } });
      const now = new Date();
      for (const att of attendances) {
        const left = att.leftAt || now;
        const duration = (left.getTime() - att.joinedAt.getTime()) / 60000;
        await prisma.meetingAttendance.update({
          where: { id: att.id },
          data: { leftAt: att.leftAt || now, durationMinutes: Math.round(duration * 100) / 100 },
        });
      }
    }

    const meeting = await prisma.meeting.update({
      where: { id: mid, orgId },
      data: updateData,
      include: { attendances: true, meetingType: { select: { name: true } } },
    });
    return apiSuccess(meeting);
  } catch (e: any) {
    if (e.name === "ZodError") return apiError("Invalid input", 422);
    return apiError(e.message, 401);
  }
}
