import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError, apiSuccess } from "@/lib/auth-utils";
import { updateMeetingTypeSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: Promise<{ orgId: string; tid: string }> }) {
  try {
    const { orgId, tid } = await params;
    await requireOrgMembership(orgId);
    const mt = await prisma.meetingType.findUnique({
      where: { id: tid, orgId },
      include: { regularAttendees: { include: { rosterMember: true } } },
    });
    if (!mt) return apiError("Meeting type not found", 404);
    return apiSuccess(mt);
  } catch (e: any) {
    return apiError(e.message, 401);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ orgId: string; tid: string }> }) {
  try {
    const { orgId, tid } = await params;
    await requireOrgMembership(orgId, "admin");
    const body = await req.json();
    const data = updateMeetingTypeSchema.parse(body);
    const { regularAttendeeIds, ...rest } = data;

    const updated = await prisma.$transaction(async (tx) => {
      if (regularAttendeeIds !== undefined) {
        await tx.meetingTypeRoster.deleteMany({ where: { meetingTypeId: tid } });
        if (regularAttendeeIds.length > 0) {
          await tx.meetingTypeRoster.createMany({
            data: regularAttendeeIds.map((id) => ({ meetingTypeId: tid, rosterMemberId: id })),
          });
        }
      }
      return tx.meetingType.update({
        where: { id: tid, orgId },
        data: rest,
        include: { regularAttendees: { include: { rosterMember: true } } },
      });
    });
    return apiSuccess(updated);
  } catch (e: any) {
    if (e.name === "ZodError") return apiError("Invalid input", 422);
    return apiError(e.message, 401);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ orgId: string; tid: string }> }) {
  try {
    const { orgId, tid } = await params;
    await requireOrgMembership(orgId, "admin");
    await prisma.meetingType.delete({ where: { id: tid, orgId } });
    return apiSuccess({ success: true });
  } catch (e: any) {
    return apiError(e.message, 401);
  }
}
