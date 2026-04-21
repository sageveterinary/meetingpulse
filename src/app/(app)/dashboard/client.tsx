"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Membership {
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: string;
  tier: string;
  memberCount: number;
  meetingTypeCount: number;
  meetingCount: number;
}

interface Invitation {
  id: string;
  orgName: string;
  role: string;
  token: string;
}

export function DashboardClient({ memberships, invitations }: { memberships: Membership[]; invitations: Invitation[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName.trim() }),
      });
      if (res.ok) {
        const org = await res.json();
        router.push(`/org/${org.slug}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create organization");
      }
    } finally {
      setLoading(false);
    }
  }

  async function acceptInvitation(token: string) {
    const res = await fetch(`/api/v1/invitations/${token}/accept`, { method: "POST" });
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Your organizations and meetings</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + New Organization
        </button>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="mb-6 space-y-3">
          {invitations.map((inv) => (
            <div key={inv.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">You&apos;ve been invited to join {inv.orgName}</p>
                <p className="text-sm text-blue-700">Role: {inv.role}</p>
              </div>
              <button
                onClick={() => acceptInvitation(inv.token)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create org modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Organization</h2>
            <form onSubmit={createOrg}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Sage Veterinary Imaging"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !orgName.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Org cards */}
      {memberships.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations yet</h3>
          <p className="text-gray-500 mb-4">Create your first organization to start running structured meetings.</p>
          <button
            onClick={() => setCreating(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            Create Organization
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {memberships.map((m) => (
            <Link
              key={m.orgId}
              href={`/org/${m.orgSlug}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{m.orgName}</h3>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full capitalize">{m.role}</span>
              </div>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>{m.memberCount} members</span>
                <span>{m.meetingTypeCount} types</span>
                <span>{m.meetingCount} meetings</span>
              </div>
              <div className="mt-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  m.tier === "pro" ? "bg-blue-100 text-blue-700" :
                  m.tier === "enterprise" ? "bg-purple-100 text-purple-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {m.tier.charAt(0).toUpperCase() + m.tier.slice(1)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
