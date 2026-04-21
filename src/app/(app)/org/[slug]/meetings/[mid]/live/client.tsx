"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Section {
  name: string;
  durationSeconds: number;
  subTimerEnabled: boolean;
  subTimerSeconds?: number;
}

interface Attendance {
  id: string;
  name: string;
  title: string;
  role: string | null;
  joinedAt: string;
  leftAt: string | null;
  rosterMemberId: string | null;
}

interface LiveMeetingClientProps {
  orgId: string;
  orgSlug: string;
  meeting: {
    id: string;
    status: string;
    startedAt: string;
    meetingType: {
      id: string;
      name: string;
      sections: Section[];
    };
    attendances: Attendance[];
  };
  roster: { id: string; name: string; title: string; defaultRole: string | null }[];
}

const TANGENT_SOUNDS = [
  "Gentle Chime", "Double Bell", "Cuckoo Clock",
  "Air Horn", "Record Scratch", "Sad Trombone", "Gavel"
];

export function LiveMeetingClient({ orgId, orgSlug, meeting, roster }: LiveMeetingClientProps) {
  const router = useRouter();
  const sections = meeting.meetingType.sections;

  // Timer state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sectionTimeLeft, setSectionTimeLeft] = useState(sections[0]?.durationSeconds || 0);
  const [subTimeLeft, setSubTimeLeft] = useState(sections[0]?.subTimerSeconds || 0);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(meeting.status === "completed");
  const [totalElapsed, setTotalElapsed] = useState(0);

  // Attendance state
  const [attendances, setAttendances] = useState<Attendance[]>(meeting.attendances);
  const [addName, setAddName] = useState("");

  // Audio state
  const [audioEnabled, setAudioEnabled] = useState(true);
  const audioContext = useRef<AudioContext | null>(null);

  // Drift-corrected timer
  const startTimeRef = useRef<number>(performance.now());
  const pausedAccumRef = useRef<number>(0);
  const lastPauseRef = useRef<number | null>(null);
  const sectionStartRef = useRef<number>(performance.now());
  const sectionDurationRef = useRef<number>(sections[0]?.durationSeconds || 0);
  const subStartRef = useRef<number>(performance.now());

  const currentSection = sections[currentSectionIndex];

  // Play a simple tone
  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = "sine") => {
    if (!audioEnabled) return;
    try {
      if (!audioContext.current) audioContext.current = new AudioContext();
      const ctx = audioContext.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, [audioEnabled]);

  // Speak text using Web Speech API
  const speak = useCallback((text: string) => {
    if (!audioEnabled || typeof window === "undefined") return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      speechSynthesis.speak(utterance);
    } catch {}
  }, [audioEnabled]);

  // Play tangent sound
  function playTangent(index: number) {
    const freqs = [523, 659, 440, 880, 330, 220, 660];
    const types: OscillatorType[] = ["sine", "sine", "triangle", "sawtooth", "square", "sawtooth", "square"];
    playTone(freqs[index] || 440, 0.5, types[index] || "sine");
    if (index >= 3) {
      setTimeout(() => playTone((freqs[index] || 440) * 0.75, 0.3, types[index] || "sine"), 200);
    }
  }

  // Timer effect
  useEffect(() => {
    if (isPaused || isComplete) return;
    const interval = setInterval(() => {
      const now = performance.now();
      const totalPaused = pausedAccumRef.current;

      // Total elapsed
      const elapsed = (now - startTimeRef.current - totalPaused) / 1000;
      setTotalElapsed(Math.floor(elapsed));

      // Section time
      const sectionElapsed = (now - sectionStartRef.current - totalPaused) / 1000;
      const sectionRemaining = Math.max(0, sectionDurationRef.current - sectionElapsed);
      setSectionTimeLeft(Math.ceil(sectionRemaining));

      // Warning at 60 seconds
      if (Math.ceil(sectionRemaining) === 60) {
        speak("One minute remaining");
      }

      // Sub-timer
      if (currentSection?.subTimerEnabled && currentSection.subTimerSeconds) {
        const subElapsed = (now - subStartRef.current - totalPaused) / 1000;
        const subRemaining = Math.max(0, currentSection.subTimerSeconds - subElapsed);
        setSubTimeLeft(Math.ceil(subRemaining));
      }

      // Auto-advance when section time runs out
      if (sectionRemaining <= 0) {
        if (currentSectionIndex < sections.length - 1) {
          advanceSection();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, isComplete, currentSectionIndex]);

  function advanceSection() {
    const nextIndex = currentSectionIndex + 1;
    if (nextIndex >= sections.length) {
      endMeeting();
      return;
    }
    setCurrentSectionIndex(nextIndex);
    const nextSection = sections[nextIndex];
    sectionDurationRef.current = nextSection.durationSeconds;
    sectionStartRef.current = performance.now();
    subStartRef.current = performance.now();
    setSectionTimeLeft(nextSection.durationSeconds);
    setSubTimeLeft(nextSection.subTimerSeconds || 0);
    playTone(880, 0.3);
    speak(`Now starting: ${nextSection.name}`);
  }

  function previousSection() {
    if (currentSectionIndex <= 0) return;
    const prevIndex = currentSectionIndex - 1;
    setCurrentSectionIndex(prevIndex);
    const prevSection = sections[prevIndex];
    sectionDurationRef.current = prevSection.durationSeconds;
    sectionStartRef.current = performance.now();
    subStartRef.current = performance.now();
    setSectionTimeLeft(prevSection.durationSeconds);
    setSubTimeLeft(prevSection.subTimerSeconds || 0);
  }

  function resetSubTimer() {
    subStartRef.current = performance.now();
    setSubTimeLeft(currentSection?.subTimerSeconds || 0);
    playTone(660, 0.15);
    speak("Next presenter");
  }

  function togglePause() {
    if (isPaused) {
      const pauseDuration = performance.now() - (lastPauseRef.current || performance.now());
      pausedAccumRef.current += pauseDuration;
      lastPauseRef.current = null;
    } else {
      lastPauseRef.current = performance.now();
    }
    setIsPaused(!isPaused);
  }

  async function endMeeting() {
    setIsComplete(true);
    speak("Meeting complete. Thank you everyone.");
    playTone(523, 0.2);
    setTimeout(() => playTone(659, 0.2), 200);
    setTimeout(() => playTone(784, 0.4), 400);

    await fetch(`/api/v1/orgs/${orgId}/meetings/${meeting.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
  }

  async function addLateAttendee() {
    if (!addName.trim()) return;
    const rosterMember = roster.find((r) => r.name === addName);
    const res = await fetch(`/api/v1/orgs/${orgId}/meetings/${meeting.id}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "join",
        rosterMemberId: rosterMember?.id || null,
        name: addName.trim(),
        title: rosterMember?.title || "NONE",
        role: rosterMember?.defaultRole || null,
      }),
    });
    if (res.ok) {
      const att = await res.json();
      setAttendances([...attendances, att]);
      setAddName("");
    }
  }

  async function markLeft(attendanceId: string, name: string) {
    const res = await fetch(`/api/v1/orgs/${orgId}/meetings/${meeting.id}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "leave", name }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAttendances(attendances.map((a) => (a.id === attendanceId ? { ...a, leftAt: updated.leftAt } : a)));
    }
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <svg className="mx-auto w-16 h-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Meeting Complete</h2>
          <p className="text-gray-600 mb-1">{meeting.meetingType.name}</p>
          <p className="text-gray-500 mb-6">Total duration: {formatTime(totalElapsed)}</p>

          <h3 className="font-medium text-gray-900 mb-3">Attendees ({attendances.length})</h3>
          <div className="bg-gray-50 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((a) => {
                  const joinTime = new Date(a.joinedAt).getTime();
                  const leaveTime = a.leftAt ? new Date(a.leftAt).getTime() : Date.now();
                  const durationMin = Math.round((leaveTime - joinTime) / 60000);
                  return (
                    <tr key={a.id} className="border-b border-gray-100">
                      <td className="px-4 py-2 font-medium">{a.name}</td>
                      <td className="px-4 py-2 text-gray-500">{a.title === "NONE" ? "\u2014" : a.title}</td>
                      <td className="px-4 py-2 text-gray-500 capitalize">{(a.role || "\u2014").replace("_", " ")}</td>
                      <td className="px-4 py-2 text-gray-500">{durationMin} min</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => router.push(`/org/${orgSlug}`)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const progress = sections.length > 0
    ? ((currentSectionIndex + (1 - sectionTimeLeft / (currentSection?.durationSeconds || 1))) / sections.length) * 100
    : 0;

  const urgencyColor = sectionTimeLeft <= 30 ? "text-red-500" : sectionTimeLeft <= 60 ? "text-yellow-500" : "text-gray-900";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{meeting.meetingType.name}</h2>
          <p className="text-sm text-gray-500">Total: {formatTime(totalElapsed)}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={audioEnabled}
              onChange={(e) => setAudioEnabled(e.target.checked)}
              className="rounded"
            />
            Audio
          </label>
          <button
            onClick={endMeeting}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
          >
            End Meeting
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      {/* Section navigator */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
        {sections.map((s, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrentSectionIndex(i);
              sectionDurationRef.current = s.durationSeconds;
              sectionStartRef.current = performance.now();
              subStartRef.current = performance.now();
              setSectionTimeLeft(s.durationSeconds);
              setSubTimeLeft(s.subTimerSeconds || 0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              i === currentSectionIndex
                ? "bg-blue-600 text-white"
                : i < currentSectionIndex
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Main timer display */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-6">
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          Section {currentSectionIndex + 1} of {sections.length}
        </h3>
        <h4 className="text-2xl font-bold text-gray-900 mb-4">{currentSection?.name}</h4>

        <div className={`text-7xl font-mono font-bold mb-4 ${urgencyColor}`}>
          {formatTime(sectionTimeLeft)}
        </div>

        {/* Sub-timer */}
        {currentSection?.subTimerEnabled && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Per-presenter timer</p>
            <div className={`text-3xl font-mono font-bold ${subTimeLeft <= 15 ? "text-red-400" : "text-blue-500"}`}>
              {formatTime(subTimeLeft)}
            </div>
            <button
              onClick={resetSubTimer}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Next Presenter / Reset
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={previousSection}
            disabled={currentSectionIndex === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-30"
          >
            &larr; Previous
          </button>
          <button
            onClick={togglePause}
            className={`px-6 py-2 rounded-lg text-sm font-medium ${
              isPaused
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-yellow-500 text-white hover:bg-yellow-600"
            }`}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={advanceSection}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            {currentSectionIndex >= sections.length - 1 ? "Finish" : "Next \u2192"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Tangent alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3">Tangent Alerts</h4>
          <div className="grid grid-cols-2 gap-2">
            {TANGENT_SOUNDS.map((sound, i) => (
              <button
                key={i}
                onClick={() => playTangent(i)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  i < 3
                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                }`}
              >
                {sound}
              </button>
            ))}
          </div>
        </div>

        {/* Attendees */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3">
            Attendees ({attendances.filter((a) => !a.leftAt).length} present)
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto mb-3">
            {attendances.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${a.leftAt ? "bg-gray-300" : "bg-green-500"}`} />
                  <span className={a.leftAt ? "text-gray-400 line-through" : "text-gray-900"}>{a.name}</span>
                  {a.title !== "NONE" && <span className="text-xs text-gray-400">{a.title}</span>}
                  {a.role && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded capitalize">{a.role.replace("_", " ")}</span>}
                </div>
                {!a.leftAt && (
                  <button
                    onClick={() => markLeft(a.id, a.name)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Left
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add late attendee */}
          <div className="flex gap-2 border-t border-gray-100 pt-3">
            <select
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="">Add attendee...</option>
              {roster
                .filter((r) => !attendances.some((a) => a.rosterMemberId === r.id && !a.leftAt))
                .map((r) => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
            </select>
            <button
              onClick={addLateAttendee}
              disabled={!addName}
              className="text-sm text-blue-600 font-medium hover:underline disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
