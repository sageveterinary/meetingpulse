import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError, apiSuccess } from "@/lib/auth-utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ orgId: string; tid: string }> }) {
  try {
    const { orgId, tid } = await params;
    await requireOrgMembership(orgId, "admin");

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    const typeCount = await prisma.meetingType.count({ where: { orgId } });
    if (org && typeCount >= org.maxMeetingTypes) {
      return apiError(`Organization has reached the maximum of ${org.maxMeetingTypes} meeting types.`, 403);
    }

    const source = await prisma.meetingType.findUnique({
      where: { id: tid, orgId },
      include: { regularAttendees: true },
    });
    if (!source) return apiError("Meeting type not found", 404);

    const clone = await prisma.meetingType.create({
      data: {
        orgId,
        name: `${source.name} (Copy)`,
        description: source.description,
        sections: source.sections as any,
        sortOrder: source.sortOrder + 1,
        regularAttendees: {
          create: source.regularAttendees.map((a) => ({ rosterMemberId: a.rosterMemberId })),
        },
      },
      include: { regularAttendees: { include: { rosterMember: true } } },
    });
    return apiSuccess(clone, 201);
  } catch (e: any) {
    return apiError(e.message, 401);
  }
}
