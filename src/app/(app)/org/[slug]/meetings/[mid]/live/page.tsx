import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { LiveMeetingClient } from "./client";

export default async function LiveMeetingPage({
  params,
}: {
  params: Promise<{ slug: string; mid: string }>;
}) {
  const { slug, mid } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) notFound();

  const meeting = await prisma.meeting.findUnique({
    where: { id: mid, orgId: org.id },
    include: {
      meetingType: true,
      attendances: { include: { rosterMember: true } },
    },
  });
  if (!meeting) notFound();

  // Get full roster for adding late arrivals
  const roster = await prisma.rosterMember.findMany({
    where: { orgId: org.id, isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <LiveMeetingClient
      orgId={org.id}
      orgSlug={slug}
      meeting={JSON.parse(JSON.stringify(meeting))}
      roster={JSON.parse(JSON.stringify(roster))}
    />
  );
}
