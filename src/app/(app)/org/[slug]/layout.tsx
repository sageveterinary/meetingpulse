import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { OrgNav } from "@/components/layout/org-nav";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { slug },
    include: {
      memberships: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
  });

  if (!org || org.memberships.length === 0) notFound();

  const membership = org.memberships[0];

  return (
    <div>
      <OrgNav orgSlug={slug} orgName={org.name} role={membership.role} orgId={org.id} />
      {children}
    </div>
  );
}
