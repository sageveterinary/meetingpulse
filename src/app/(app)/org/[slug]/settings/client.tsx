"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SettingsClientProps {
  org: {
    id: string;
    name: string;
    slug: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    maxUsers: number;
    maxMeetingTypes: number;
  };
  members: {
    userId: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
    joinedAt: string;
  }[];
  currentUserId: string;
  isOwner: boolean;
}

export function SettingsClient({ org, members, currentUserId, isOwner }: SettingsClientProps) {
  const router = useRouter();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch(`/api/v1/orgs/${org.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Invitation sent! Share this link: ${data.inviteUrl}`);
        setInviteEmail("");
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(userId: string) {
    if (!confirm("Remove this member?")) return;
    await fetch(`/api/v1/orgs/${org.id}/members/${userId}`, { method: "DELETE" });
    router.refresh();
  }

  async function updateRole(userId: string, role: string) {
    await fetch(`/api/v1/orgs/${org.id}/members/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    router.refresh();
  }

  async function openBillingPortal() {
    const res = await fetch("/api/v1/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId: org.id }),
    });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    }
  }

  async function upgradePlan(plan: string) {
    const res = await fetch("/api/v1/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId: org.id, plan }),
    });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      const err = await res.json();
      alert(err.error);
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Org Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-4">Organization</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="font-medium">{org.name}</span></div>
          <div><span className="text-gray-500">Plan:</span> <span className="font-medium capitalize">{org.subscriptionTier}</span></div>
          <div><span className="text-gray-500">Max Members:</span> <span className="font-medium">{org.maxUsers}</span></div>
          <div><span className="text-gray-500">Max Meeting Types:</span> <span className="font-medium">{org.maxMeetingTypes}</span></div>
        </div>
      </div>

      {/* Billing */}
      {isOwner && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Billing</h4>
          {org.subscriptionTier === "free" ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">You&apos;re on the Free plan. Upgrade to unlock more features.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => upgradePlan("pro")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Upgrade to Pro — $29/mo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Current plan: <span className="font-medium capitalize">{org.subscriptionTier}</span> ({org.subscriptionStatus})
              </p>
              <button
                onClick={openBillingPortal}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Manage Billing
              </button>
            </div>
          )}
        </div>
      )}

      {/* Members */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-4">Members ({members.length}/{org.maxUsers})</h4>
        <div className="space-y-3 mb-6">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                {m.image ? (
                  <img src={m.image} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                    {m.name?.[0] || m.email[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.name || m.email}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {m.role === "owner" ? (
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Owner</span>
                ) : (
                  <>
                    {isOwner && (
                      <select
                        value={m.role}
                        onChange={(e) => updateRole(m.userId, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    )}
                    {(isOwner || m.userId === currentUserId) && (
                      <button
                        onClick={() => removeMember(m.userId)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Invite */}
        <form onSubmit={invite} className="flex gap-3 items-end border-t border-gray-200 pt-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Invite by Email</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {inviting ? "Sending..." : "Invite"}
          </button>
        </form>
      </div>
    </div>
  );
}
