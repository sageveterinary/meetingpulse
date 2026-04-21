import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError, apiSuccess } from "@/lib/auth-utils";
import { migrateDataSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = migrateDataSchema.parse(body);
    const { orgId } = data;
    await requireOrgMembership(orgId, "admin");

    const result = { rosterImported: 0, meetingTypesImported: 0, meetingsImported: 0 };

    // Import roster members
    const titleMap: Record<string, string> = { "": "NONE", DVM: "DVM", DACVR: "DACVR", DACVIM: "DACVIM" };
    const roleMap: Record<string, string> = {
      "": "", intern: "intern", resident: "resident",
      supervising_radiologist: "supervising_radiologist", guest_presenter: "guest_presenter",
    };

    const rosterIdMap = new Map<string, string>(); // name -> db id
    for (const member of data.globalRoster) {
      try {
        const created = await prisma.rosterMember.upsert({
          where: { orgId_name: { orgId, name: member.name } },
          update: {},
          create: {
            orgId,
            name: member.name,
            title: (titleMap[member.title] || "NONE") as any,
            defaultRole: member.defaultRole ? (roleMap[member.defaultRole] as any) : null,
          },
        });
        rosterIdMap.set(member.name, created.id);
        result.rosterImported++;
      } catch { /* skip duplicates */ }
    }

    // Import meeting types
    for (const mt of data.meetingTypes) {
      try {
        const attendeeIds = mt.regularAttendees
          .map((name) => rosterIdMap.get(name))
          .filter(Boolean) as string[];

        await prisma.meetingType.upsert({
          where: { orgId_name: { orgId, name: mt.name } },
          update: {},
          create: {
            orgId,
            name: mt.name,
            sections: mt.sections,
            regularAttendees: {
              create: attendeeIds.map((id) => ({ rosterMemberId: id })),
            },
          },
        });
        result.meetingTypesImported++;
      } catch { /* skip duplicates */ }
    }

    return apiSuccess(result, 201);
  } catch (e: any) {
    if (e.name === "ZodError") return apiError("Invalid input", 422);
    return apiError(e.message, 401);
  }
}
