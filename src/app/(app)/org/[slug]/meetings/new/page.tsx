import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { NewMeetingClient } from "./client";

export default async function NewMeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { slug } = await params;
  const { type: typeId } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) notFound();

  const meetingType = typeId
    ? await prisma.meetingType.findUnique({
        where: { id: typeId, orgId: org.id },
        include: {
          regularAttendees: { include: { rosterMember: true } },
        },
      })
    : null;

  const roster = await prisma.rosterMember.findMany({
    where: { orgId: org.id, isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <NewMeetingClient
      orgId={org.id}
      orgSlug={slug}
      meetingType={meetingType ? JSON.parse(JSON.stringify(meetingType)) : null}
      roster={JSON.parse(JSON.stringify(roster))}
    />
  );
}
