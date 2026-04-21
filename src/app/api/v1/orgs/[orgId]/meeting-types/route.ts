import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError, apiSuccess } from "@/lib/auth-utils";
import { meetingTypeSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireOrgMembership(orgId);
    const types = await prisma.meetingType.findMany({
      where: { orgId },
      include: { regularAttendees: { include: { rosterMember: true } } },
      orderBy: { sortOrder: "asc" },
    });
    return apiSuccess(types);
  } catch (e: any) {
    return apiError(e.message, 401);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireOrgMembership(orgId, "admin");

    // Check meeting type limits
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    const typeCount = await prisma.meetingType.count({ where: { orgId } });
    if (org && typeCount >= org.maxMeetingTypes) {
      return apiError(`Organization has reached the maximum of ${org.maxMeetingTypes} meeting types. Upgrade your plan to add more.`, 403);
    }

    const body = await req.json();
    const data = meetingTypeSchema.parse(body);
    const { regularAttendeeIds, ...rest } = data;

    const meetingType = await prisma.meetingType.create({
      data: {
        orgId,
        ...rest,
        regularAttendees: {
          create: regularAttendeeIds.map((id) => ({ rosterMemberId: id })),
        },
      },
      include: { regularAttendees: { include: { rosterMember: true } } },
    });
    return apiSuccess(meetingType, 201);
  } catch (e: any) {
    if (e.name === "ZodError") return apiError("Invalid input", 422);
    return apiError(e.message, 401);
  }
}
