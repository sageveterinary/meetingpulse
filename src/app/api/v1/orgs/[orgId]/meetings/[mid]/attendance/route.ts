import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError, apiSuccess } from "@/lib/auth-utils";
import { attendanceEventSchema } from "@/lib/validations";

export async function POST(req: NextRequest, { params }: { params: Promise<{ orgId: string; mid: string }> }) {
  try {
    const { orgId, mid } = await params;
    await requireOrgMembership(orgId, "member");
    const body = await req.json();
    const data = attendanceEventSchema.parse(body);

    if (data.action === "join") {
      const attendance = await prisma.meetingAttendance.create({
        data: {
          meetingId: mid,
          rosterMemberId: data.rosterMemberId,
          name: data.name,
          title: data.title as any,
          role: data.role as any,
        },
      });
      return apiSuccess(attendance, 201);
    } else {
      // Find the most recent open attendance for this person
      const attendance = await prisma.meetingAttendance.findFirst({
        where: { meetingId: mid, name: data.name, leftAt: null },
        orderBy: { joinedAt: "desc" },
      });
      if (!attendance) return apiError("No active attendance found for this person", 404);
      const now = new Date();
      const duration = (now.getTime() - attendance.joinedAt.getTime()) / 60000;
      const updated = await prisma.meetingAttendance.update({
        where: { id: attendance.id },
        data: { leftAt: now, durationMinutes: Math.round(duration * 100) / 100 },
      });
      return apiSuccess(updated);
    }
  } catch (e: any) {
    if (e.name === "ZodError") return apiError("Invalid input", 422);
    return apiError(e.message, 401);
  }
}
