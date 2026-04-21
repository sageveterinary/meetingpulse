export const ATTENDEE_TITLES = [
  { value: "NONE", label: "None" },
  { value: "DVM", label: "DVM" },
  { value: "DACVR", label: "DACVR" },
  { value: "DACVIM", label: "DACVIM" },
] as const;

export const MEETING_ROLES = [
  { value: "intern", label: "Intern" },
  { value: "resident", label: "Resident" },
  { value: "supervising_radiologist", label: "Supervising Radiologist" },
  { value: "guest_presenter", label: "Guest Presenter" },
] as const;

export const DEFAULT_MEETING_TYPES = [
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
