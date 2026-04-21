import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError, apiSuccess } from "@/lib/auth-utils";
import { startMeetingSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireOrgMembership(orgId);
    const url = new URL(req.url);
    const meetingTypeId = url.searchParams.get("meetingTypeId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

    const where: any = { orgId };
    if (meetingTypeId) where.meetingTypeId = meetingTypeId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) where.startedAt.gte = new Date(startDate);
      if (endDate) where.startedAt.lte = new Date(endDate);
    }

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        include: {
          meetingType: { select: { name: true } },
          createdBy: { select: { name: true } },
          attendances: true,
        },
        orderBy: { startedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.meeting.count({ where }),
    ]);

    return apiSuccess({ meetings, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (e: any) {
    return apiError(e.message, 401);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const { user } = await requireOrgMembership(orgId, "member");
    const body = await req.json();
    const data = startMeetingSchema.parse(body);

    const meeting = await prisma.meeting.create({
      data: {
        orgId,
        meetingTypeId: data.meetingTypeId,
        createdById: user.id,
        attendances: {
          create: data.attendees.map((a) => ({
            rosterMemberId: a.rosterMemberId,
            name: a.name,
            title: a.title as any,
            role: a.role as any,
          })),
        },
      },
      include: { attendances: true, meetingType: { select: { name: true } } },
    });
    return apiSuccess(meeting, 201);
  } catch (e: any) {
    if (e.name === "ZodError") return apiError("Invalid input", 422);
    return apiError(e.message, 401);
  }
}
