"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Section {
  name: string;
  durationSeconds: number;
  subTimerEnabled: boolean;
  subTimerSeconds?: number;
}

interface RosterMember {
  id: string;
  name: string;
  title: string;
  defaultRole: string | null;
}

interface Existing {
  id: string;
  name: string;
  description: string;
  sections: Section[];
  regularAttendeeIds: string[];
}

export function MeetingTypeEditor({
  orgId,
  orgSlug,
  roster,
  existing,
}: {
  orgId: string;
  orgSlug: string;
  roster: RosterMember[];
  existing?: Existing;
}) {
  const router = useRouter();
  const [name, setName] = useState(existing?.name || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [sections, setSections] = useState<Section[]>(
    existing?.sections || [{ name: "", durationSeconds: 300, subTimerEnabled: false }]
  );
  const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(
    new Set(existing?.regularAttendeeIds || [])
  );
  const [saving, setSaving] = useState(false);

  function addSection() {
    setSections([...sections, { name: "", durationSeconds: 300, subTimerEnabled: false }]);
  }

  function removeSection(index: number) {
    setSections(sections.filter((_, i) => i !== index));
  }

  function updateSection(index: number, updates: Partial<Section>) {
    setSections(sections.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  }

  function toggleAttendee(id: string) {
    const next = new Set(selectedAttendees);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAttendees(next);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || sections.length === 0) return;
    setSaving(true);

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      sections: sections.filter((s) => s.name.trim()),
      regularAttendeeIds: Array.from(selectedAttendees),
    };

    try {
      const url = existing
        ? `/api/v1/orgs/${orgId}/meeting-types/${existing.id}`
        : `/api/v1/orgs/${orgId}/meeting-types`;
      const res = await fetch(url, {
        method: existing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push(`/org/${orgSlug}/meeting-types`);
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6 max-w-3xl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Morning Rounds"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this meeting type"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">Sections</label>
          <button type="button" onClick={addSection} className="text-sm text-blue-600 hover:underline">+ Add Section</button>
        </div>
        <div className="space-y-3">
          {sections.map((section, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <input
                    value={section.name}
                    onChange={(e) => updateSection(i, { name: e.target.value })}
                    placeholder="Section name"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    value={section.durationSeconds / 60}
                    onChange={(e) => updateSection(i, { durationSeconds: parseInt(e.target.value || "0") * 60 })}
                    min={1}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                  />
                  <span className="text-xs text-gray-400">minutes</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSection(i)}
                  className="text-red-400 hover:text-red-600 mt-1"
                  title="Remove section"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={section.subTimerEnabled}
                    onChange={(e) => updateSection(i, { subTimerEnabled: e.target.checked })}
                    className="rounded"
                  />
                  Sub-timer
                </label>
                {section.subTimerEnabled && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={(section.subTimerSeconds || 180) / 60}
                      onChange={(e) => updateSection(i, { subTimerSeconds: parseInt(e.target.value || "0") * 60 })}
                      min={1}
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-gray-400">min per person</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regular attendees */}
      {roster.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Regular Attendees</label>
          <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
            {roster.map((member) => (
              <label key={member.id} className="flex items-center gap-2 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={selectedAttendees.has(member.id)}
                  onChange={() => toggleAttendee(member.id)}
                  className="rounded"
                />
                <span className="text-gray-900">{member.name}</span>
                {member.title !== "NONE" && (
                  <span className="text-xs text-gray-400">{member.title}</span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : existing ? "Save Changes" : "Create Meeting Type"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
