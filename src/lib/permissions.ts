import { OrgRole } from "@prisma/client";

export type Permission =
  | "org:read"
  | "org:update"
  | "org:delete"
  | "members:read"
  | "members:invite"
  | "members:update"
  | "members:remove"
  | "roster:read"
  | "roster:write"
  | "meeting_types:read"
  | "meeting_types:write"
  | "meetings:read"
  | "meetings:start"
  | "meetings:manage_attendance"
  | "reports:read"
  | "reports:export"
  | "billing:read"
  | "billing:manage";

const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  owner: [
    "org:read", "org:update", "org:delete",
    "members:read", "members:invite", "members:update", "members:remove",
    "roster:read", "roster:write",
    "meeting_types:read", "meeting_types:write",
    "meetings:read", "meetings:start", "meetings:manage_attendance",
    "reports:read", "reports:export",
    "billing:read", "billing:manage",
  ],
  admin: [
    "org:read", "org:update",
    "members:read", "members:invite", "members:update", "members:remove",
    "roster:read", "roster:write",
    "meeting_types:read", "meeting_types:write",
    "meetings:read", "meetings:start", "meetings:manage_attendance",
    "reports:read", "reports:export",
    "billing:read",
  ],
  member: [
    "org:read",
    "members:read",
    "roster:read", "roster:write",
    "meeting_types:read",
    "meetings:read", "meetings:start", "meetings:manage_attendance",
    "reports:read", "reports:export",
  ],
  viewer: [
    "org:read",
    "members:read",
    "roster:read",
    "meeting_types:read",
    "meetings:read",
    "reports:read",
  ],
};

export function hasPermission(role: OrgRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getPermissions(role: OrgRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}
