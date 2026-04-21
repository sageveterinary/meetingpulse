"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RosterMember {
  id: string;
  name: string;
  title: string;
  defaultRole: string | null;
}

const TITLES = [
  { value: "NONE", label: "—" },
  { value: "DVM", label: "DVM" },
  { value: "DACVR", label: "DACVR" },
  { value: "DACVIM", label: "DACVIM" },
];

const ROLES = [
  { value: "", label: "—" },
  { value: "intern", label: "Intern" },
  { value: "resident", label: "Resident" },
  { value: "supervising_radiologist", label: "Supervising Radiologist" },
  { value: "guest_presenter", label: "Guest Presenter" },
];

export function RosterClient({ orgId, initialRoster }: { orgId: string; initialRoster: RosterMember[] }) {
  const router = useRouter();
  const [roster, setRoster] = useState(initialRoster);
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("NONE");
  const [newRole, setNewRole] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", title: "NONE", defaultRole: "" });

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch(`/api/v1/orgs/${orgId}/roster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), title: newTitle, defaultRole: newRole || null }),
    });
    if (res.ok) {
      setNewName(""); setNewTitle("NONE"); setNewRole("");
      router.refresh();
      const member = await res.json();
      setRoster([...roster, member]);
    } else {
      const err = await res.json();
      alert(err.error);
    }
  }

  async function updateMember(id: string) {
    const res = await fetch(`/api/v1/orgs/${orgId}/roster/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editForm.name, title: editForm.title, defaultRole: editForm.defaultRole || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRoster(roster.map((m) => (m.id === id ? updated : m)));
      setEditingId(null);
    }
  }

  async function deleteMember(id: string) {
    if (!confirm("Remove this roster member?")) return;
    const res = await fetch(`/api/v1/orgs/${orgId}/roster/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRoster(roster.filter((m) => m.id !== id));
    }
  }

  function startEditing(member: RosterMember) {
    setEditingId(member.id);
    setEditForm({ name: member.name, title: member.title, defaultRole: member.defaultRole || "" });
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Roster</h3>
      <p className="text-sm text-gray-500 mb-6">
        Manage your organization&apos;s team members. Names, titles, and default roles set here will
        auto-populate when starting meetings.
      </p>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Default Role</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {roster.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                {editingId === member.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        {TITLES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={editForm.defaultRole}
                        onChange={(e) => setEditForm({ ...editForm, defaultRole: e.target.value })}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button onClick={() => updateMember(member.id)} className="text-green-600 hover:underline text-sm">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500 hover:underline text-sm">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-sm text-gray-900">{member.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{member.title === "NONE" ? "—" : member.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {ROLES.find((r) => r.value === member.defaultRole)?.label || "—"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => startEditing(member)} className="text-blue-600 hover:underline text-sm">Edit</button>
                      <button onClick={() => deleteMember(member.id)} className="text-red-600 hover:underline text-sm">Remove</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add new member form */}
        <form onSubmit={addMember} className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New member name"
              className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
            <select
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            >
              {TITLES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Default Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            >
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <button
            type="submit"
            disabled={!newName.trim()}
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Add Member
          </button>
        </form>
      </div>
    </div>
  );
}
