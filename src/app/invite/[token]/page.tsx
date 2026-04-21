import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();

  const invitation = await prisma.orgInvitation.findUnique({
    where: { token },
    include: { org: true },
  });

  if (!invitation || invitation.expiresAt < new Date()) {
    notFound();
  }

  // If user is logged in, accept immediately
  if (session?.user?.id) {
    // Check if already a member
    const existing = await prisma.orgMembership.findUnique({
      where: { userId_orgId: { userId: session.user.id, orgId: invitation.orgId } },
    });

    if (!existing) {
      await prisma.orgMembership.create({
        data: {
          userId: session.user.id,
          orgId: invitation.orgId,
          role: invitation.role,
        },
      });
    }

    // Delete the invitation
    await prisma.orgInvitation.delete({ where: { id: invitation.id } });

    redirect(`/org/${invitation.org.slug}`);
  }

  // Not logged in — redirect to login with callback
  redirect(`/login?callbackUrl=/invite/${token}`);
}
