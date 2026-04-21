"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = [
  { value: "", label: "—" },
  { value: "intern", label: "Intern" },
  { value: "resident", label: "Resident" },
  { value: "supervising_radiologist", label: "Supervising Radiologist" },
  { value: "guest_presenter", label: "Guest Presenter" },
];

interface RosterMember {
  id: string;
  name: string;
  title: string;
  defaultRole: string | null;
}

interface Attendee {
  rosterMemberId: string | null;
  name: string;
  title: string;
  role: string;
  checked: boolean;
}

export function NewMeetingClient({
  orgId,
  orgSlug,
  meetingType,
  roster,
}: {
  orgId: string;
  orgSlug: string;
  meetingType: any;
  roster: RosterMember[];
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  // Build attendee list from regular attendees + rest of roster
  const regularIds = new Set(
    (meetingType?.regularAttendees || []).map((a: any) => a.rosterMember.id)
  );

  const initialAttendees: Attendee[] = roster.map((m) => ({
    rosterMemberId: m.id,
    name: m.name,
    title: m.title,
    role: m.defaultRole || "",
    checked: regularIds.has(m.id),
  }));

  const [attendees, setAttendees] = useState(initialAttendees);
  const [newName, setNewName] = useState("");

  function toggleAttendee(index: number) {
    setAttendees(attendees.map((a, i) => (i === index ? { ...a, checked: !a.checked } : a)));
  }

  function updateRole(index: number, role: string) {
    setAttendees(attendees.map((a, i) => (i === index ? { ...a, role } : a)));
  }

  function addAdHoc() {
    if (!newName.trim()) return;
    setAttendees([...attendees, {
      rosterMemberId: null,
      name: newName.trim(),
      title: "NONE",
      role: "",
      checked: true,
    }]);
    setNewName("");
  }

  async function startMeeting() {
    if (!meetingType) return;
    setStarting(true);
    const checkedAttendees = attendees
      .filter((a) => a.checked)
      .map((a) => ({
        rosterMemberId: a.rosterMemberId,
        name: a.name,
        title: a.title,
        role: a.role || null,
      }));

    const res = await fetch(`/api/v1/orgs/${orgId}/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meetingTypeId: meetingType.id,
        attendees: checkedAttendees,
      }),
    });

    if (res.ok) {
      const meeting = await res.json();
      router.push(`/org/${orgSlug}/meetings/${meeting.id}/live`);
    } else {
      const err = await res.json();
      alert(err.error);
      setStarting(false);
    }
  }

  if (!meetingType) {
    return <p className="text-gray-500">No meeting type selected. Go back and choose one.</p>;
  }

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Start: {meetingType.name}</h3>
      <p className="text-sm text-gray-500 mb-6">Check in attendees and assign roles before starting.</p>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b text-left text-xs font-medium text-gray-500 uppercase">
              <th className="px-4 py-2 w-8"></th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {attendees.map((a, i) => (
              <tr key={i} className={a.checked ? "bg-blue-50/50" : ""}>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={a.checked}
                    onChange={() => toggleAttendee(i)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-2 text-sm font-medium text-gray-900">{a.name}</td>
                <td className="px-4 py-2 text-sm text-gray-500">{a.title === "NONE" ? "—" : a.title}</td>
                <td className="px-4 py-2">
                  <select
                    value={a.role}
                    onChange={(e) => updateRole(i, e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add ad-hoc attendee..."
            className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAdHoc())}
          />
          <button
            type="button"
            onClick={addAdHoc}
            disabled={!newName.trim()}
            className="text-sm text-blue-600 font-medium hover:underline disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      <button
        onClick={startMeeting}
        disabled={starting || !attendees.some((a) => a.checked)}
        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium text-lg hover:bg-blue-700 disabled:opacity-50 w-full"
      >
        {starting ? "Starting..." : "Start Meeting"}
      </button>
    </div>
  );
}
