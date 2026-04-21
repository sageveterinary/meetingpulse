import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { SettingsClient } from "./client";

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { slug },
    include: {
      memberships: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!org) notFound();

  const userMembership = org.memberships.find((m) => m.userId === session.user!.id);
  if (!userMembership || !["owner", "admin"].includes(userMembership.role)) {
    redirect(`/org/${slug}`);
  }

  return (
    <SettingsClient
      org={JSON.parse(JSON.stringify({
        id: org.id,
        name: org.name,
        slug: org.slug,
        subscriptionTier: org.subscriptionTier,
        subscriptionStatus: org.subscriptionStatus,
        maxUsers: org.maxUsers,
        maxMeetingTypes: org.maxMeetingTypes,
      }))}
      members={JSON.parse(JSON.stringify(org.memberships.map((m) => ({
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        role: m.role,
        joinedAt: m.joinedAt,
      }))))}
      currentUserId={session.user.id}
      isOwner={userMembership.role === "owner"}
    />
  );
}
