// This file provides type stubs for development environments where
// `prisma generate` hasn't been run yet. Once you run `prisma generate`,
// the actual types from @prisma/client will take precedence.
// Delete this file after running `prisma generate` for the first time.

declare module "@prisma/client" {
  export type OrgRole = "owner" | "admin" | "member" | "viewer";
  export type SubscriptionTier = "free" | "pro" | "enterprise";
  export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled";
  export type AttendeeTitle = "NONE" | "DVM" | "DACVR" | "DACVIM";
  export type MeetingRole = "intern" | "resident" | "supervising_radiologist" | "guest_presenter";
  export type MeetingStatus = "in_progress" | "completed" | "canceled";

  export class PrismaClient {
    constructor(options?: any);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $transaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
    user: any;
    account: any;
    session: any;
    verificationToken: any;
    organization: any;
    orgMembership: any;
    orgInvitation: any;
    rosterMember: any;
    meetingType: any;
    meetingTypeRoster: any;
    meeting: any;
    meetingAttendance: any;
  }
}
