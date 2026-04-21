import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { ReportsClient } from "./client";

export default async function ReportsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) notFound();

  const meetingTypes = await prisma.meetingType.findMany({
    where: { orgId: org.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const roster = await prisma.rosterMember.findMany({
    where: { orgId: org.id, isActive: true },
    select: { id: true, name: true, title: true },
    orderBy: { name: "asc" },
  });

  return (
    <ReportsClient
      orgId={org.id}
      orgSlug={slug}
      meetingTypes={meetingTypes}
      roster={JSON.parse(JSON.stringify(roster))}
    />
  );
}
