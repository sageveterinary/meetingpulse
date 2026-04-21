import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_MEETING_TYPES = [
  {
    name: "Morning Rounds",
    description: "Daily morning case review rounds",
    sections: [
      { name: "Roll Call & Announcements", durationSeconds: 300, subTimerEnabled: false },
      { name: "Overnight Cases", durationSeconds: 900, subTimerEnabled: true, subTimerSeconds: 180 },
      { name: "Today's Schedule", durationSeconds: 300, subTimerEnabled: false },
      { name: "Questions & Discussion", durationSeconds: 300, subTimerEnabled: false },
    ],
  },
  {
    name: "Afternoon Rounds",
    description: "End-of-day case follow-up rounds",
    sections: [
      { name: "Case Follow-Ups", durationSeconds: 900, subTimerEnabled: true, subTimerSeconds: 180 },
      { name: "Pending Results", durationSeconds: 600, subTimerEnabled: false },
      { name: "Overnight Plan", durationSeconds: 300, subTimerEnabled: false },
    ],
  },
  {
    name: "Lunchtime Lecture",
    description: "Educational lecture during lunch",
    sections: [
      { name: "Introduction", durationSeconds: 300, subTimerEnabled: false },
      { name: "Presentation", durationSeconds: 2400, subTimerEnabled: false },
      { name: "Q&A", durationSeconds: 600, subTimerEnabled: false },
    ],
  },
  {
    name: "Journal Club",
    description: "Literature review and discussion",
    sections: [
      { name: "Article Overview", durationSeconds: 600, subTimerEnabled: false },
      { name: "Methods Review", durationSeconds: 600, subTimerEnabled: false },
      { name: "Results Discussion", durationSeconds: 900, subTimerEnabled: false },
      { name: "Clinical Application", durationSeconds: 600, subTimerEnabled: false },
    ],
  },
  {
    name: "Case Review",
    description: "In-depth case presentation and discussion",
    sections: [
      { name: "Case Presentation", durationSeconds: 600, subTimerEnabled: false },
      { name: "Imaging Review", durationSeconds: 900, subTimerEnabled: false },
      { name: "Differential Discussion", durationSeconds: 600, subTimerEnabled: false },
      { name: "Outcome & Lessons", durationSeconds: 300, subTimerEnabled: false },
    ],
  },
];

async function main() {
  console.log("Seeding database...");

  // Create a demo org if none exist
  const orgCount = await prisma.organization.count();
  if (orgCount === 0) {
    const org = await prisma.organization.create({
      data: {
        name: "Demo Organization",
        slug: "demo",
      },
    });

    // Create default meeting types
    for (let i = 0; i < DEFAULT_MEETING_TYPES.length; i++) {
      const mt = DEFAULT_MEETING_TYPES[i];
      await prisma.meetingType.create({
        data: {
          orgId: org.id,
          name: mt.name,
          description: mt.description,
          sections: mt.sections,
          isDefault: true,
          sortOrder: i,
        },
      });
    }

    console.log(`Created demo org with ${DEFAULT_MEETING_TYPES.length} meeting types`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
