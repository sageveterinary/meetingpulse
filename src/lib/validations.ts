import { z } from "zod";

export const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
});

export const updateOrgSchema = z.object({
  name: z.string().min(2).max(100).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["admin", "member", "viewer"]),
});

export const rosterMemberSchema = z.object({
  name: z.string().min(1).max(100),
  title: z.enum(["NONE", "DVM", "DACVR", "DACVIM"]).default("NONE"),
  defaultRole: z.enum(["intern", "resident", "supervising_radiologist", "guest_presenter"]).nullable().default(null),
});

export const updateRosterMemberSchema = rosterMemberSchema.partial();

export const meetingSectionSchema = z.object({
  name: z.string().min(1),
  durationSeconds: z.number().int().min(1),
  subTimerEnabled: z.boolean().default(false),
  subTimerSeconds: z.number().int().min(1).optional(),
});

export const meetingTypeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  sections: z.array(meetingSectionSchema).min(1),
  regularAttendeeIds: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
});

export const updateMeetingTypeSchema = meetingTypeSchema.partial();

export const startMeetingSchema = z.object({
  meetingTypeId: z.string(),
  attendees: z.array(z.object({
    rosterMemberId: z.string().nullable().default(null),
    name: z.string(),
    title: z.enum(["NONE", "DVM", "DACVR", "DACVIM"]).default("NONE"),
    role: z.enum(["intern", "resident", "supervising_radiologist", "guest_presenter"]).nullable().default(null),
  })).default([]),
});

export const updateMeetingSchema = z.object({
  status: z.enum(["completed", "canceled"]).optional(),
  sectionsData: z.any().optional(),
  endedAt: z.string().datetime().optional(),
});

export const attendanceEventSchema = z.object({
  rosterMemberId: z.string().nullable().default(null),
  name: z.string(),
  title: z.enum(["NONE", "DVM", "DACVR", "DACVIM"]).default("NONE"),
  role: z.enum(["intern", "resident", "supervising_radiologist", "guest_presenter"]).nullable().default(null),
  action: z.enum(["join", "leave"]),
});

export const migrateDataSchema = z.object({
  orgId: z.string(),
  meetingTypes: z.array(z.object({
    name: z.string(),
    sections: z.array(z.any()),
    regularAttendees: z.array(z.string()).default([]),
  })).default([]),
  globalRoster: z.array(z.object({
    name: z.string(),
    title: z.string().default(""),
    defaultRole: z.string().default(""),
  })).default([]),
  meetingHistory: z.array(z.any()).default([]),
});

export const reportQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  meetingTypeId: z.string().optional(),
  rosterMemberId: z.string().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});
