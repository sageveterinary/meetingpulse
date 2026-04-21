import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardClient } from "./client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const memberships = await prisma.orgMembership.findMany({
    where: { userId: session.user.id },
    include: {
      org: {
        include: {
          _count: { select: { memberships: true, meetingTypes: true, meetings: true } },
        },
      },
    },
  });

  // Check for pending invitations
  const invitations = await prisma.orgInvitation.findMany({
    where: { email: session.user.email!, expiresAt: { gt: new Date() } },
    include: { org: { select: { name: true } } },
  });

  return (
    <DashboardClient
      memberships={memberships.map((m) => ({
        orgId: m.org.id,
        orgName: m.org.name,
        orgSlug: m.org.slug,
        role: m.role,
        tier: m.org.subscriptionTier,
        memberCount: m.org._count.memberships,
        meetingTypeCount: m.org._count.meetingTypes,
        meetingCount: m.org._count.meetings,
      }))}
      invitations={invitations.map((inv) => ({
        id: inv.id,
        orgName: inv.org.name,
        role: inv.role,
        token: inv.token,
      }))}
    />
  );
}
