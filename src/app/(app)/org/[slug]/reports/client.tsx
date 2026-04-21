"use client";

import { useState, useEffect } from "react";

interface ReportsClientProps {
  orgId: string;
  orgSlug: string;
  meetingTypes: { id: string; name: string }[];
  roster: { id: string; name: string; title: string }[];
}

export function ReportsClient({ orgId, orgSlug, meetingTypes, roster }: ReportsClientProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [meetingTypeId, setMeetingTypeId] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"summary" | "person">("summary");
  const [selectedPerson, setSelectedPerson] = useState("");
  const [personReport, setPersonReport] = useState<any>(null);

  async function loadSummary() {
    setLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", new Date(startDate).toISOString());
    if (endDate) params.set("endDate", new Date(endDate).toISOString());
    if (meetingTypeId) params.set("meetingTypeId", meetingTypeId);
    const res = await fetch(`/api/v1/orgs/${orgId}/reports/summary?${params}`);
    if (res.ok) setSummary(await res.json());
    setLoading(false);
  }

  async function loadPersonReport(rid: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", new Date(startDate).toISOString());
    if (endDate) params.set("endDate", new Date(endDate).toISOString());
    const res = await fetch(`/api/v1/orgs/${orgId}/reports/person/${rid}?${params}`);
    if (res.ok) setPersonReport(await res.json());
    setLoading(false);
  }

  function exportCSV(type: string) {
    const params = new URLSearchParams({ type, format: "csv" });
    if (startDate) params.set("startDate", new Date(startDate).toISOString());
    if (endDate) params.set("endDate", new Date(endDate).toISOString());
    if (meetingTypeId) params.set("meetingTypeId", meetingTypeId);
    window.open(`/api/v1/orgs/${orgId}/reports/export?${params}`, "_blank");
  }

  function exportPersonCSV(rid: string) {
    const params = new URLSearchParams({ format: "csv" });
    if (startDate) params.set("startDate", new Date(startDate).toISOString());
    if (endDate) params.set("endDate", new Date(endDate).toISOString());
    window.open(`/api/v1/orgs/${orgId}/reports/person/${rid}?${params}`, "_blank");
  }

  useEffect(() => { loadSummary(); }, []);

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports</h3>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Meeting Type</label>
          <select value={meetingTypeId} onChange={(e) => setMeetingTypeId(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm">
            <option value="">All Types</option>
            {meetingTypes.map((mt) => <option key={mt.id} value={mt.id}>{mt.name}</option>)}
          </select>
        </div>
        <button onClick={loadSummary}
          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700">
          Apply Filters
        </button>
        <button onClick={() => exportCSV("meetings")}
          className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded text-sm hover:bg-gray-50">
          Export Meetings CSV
        </button>
        <button onClick={() => exportCSV("attendance")}
          className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded text-sm hover:bg-gray-50">
          Export Attendance CSV
        </button>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setView("summary")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${view === "summary" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
          Summary
        </button>
        <button onClick={() => setView("person")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${view === "person" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
          By Person
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      {view === "summary" && summary && !loading && (
        <div className="space-y-6">
          {/* Overview stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-900">{summary.totalMeetings}</p>
              <p className="text-sm text-gray-500">Total Meetings</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-900">{Math.round(summary.totalMinutes)}</p>
              <p className="text-sm text-gray-500">Total Minutes</p>
            </div>
          </div>

          {/* By type */}
          {Object.keys(summary.byType).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3">By Meeting Type</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase border-b">
                    <th className="pb-2">Type</th><th className="pb-2">Count</th><th className="pb-2">Total Minutes</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.byType).map(([type, data]: [string, any]) => (
                    <tr key={type} className="border-b border-gray-50">
                      <td className="py-2">{type}</td>
                      <td className="py-2">{data.count}</td>
                      <td className="py-2">{Math.round(data.totalMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* By role */}
          {Object.keys(summary.byRole).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3">By Role</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase border-b">
                    <th className="pb-2">Role</th><th className="pb-2">Attendances</th><th className="pb-2">Total Minutes</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.byRole).map(([role, data]: [string, any]) => (
                    <tr key={role} className="border-b border-gray-50">
                      <td className="py-2 capitalize">{role.replace("_", " ")}</td>
                      <td className="py-2">{data.count}</td>
                      <td className="py-2">{Math.round(data.totalMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === "person" && !loading && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Person</label>
            <div className="flex gap-3">
              <select value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1">
                <option value="">Choose a person...</option>
                {roster.map((m) => <option key={m.id} value={m.id}>{m.name} {m.title !== "NONE" ? `(${m.title})` : ""}</option>)}
              </select>
              <button
                onClick={() => selectedPerson && loadPersonReport(selectedPerson)}
                disabled={!selectedPerson}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Load Report
              </button>
              {selectedPerson && (
                <button onClick={() => exportPersonCSV(selectedPerson)}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Export CSV
                </button>
              )}
            </div>
          </div>

          {personReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-2xl font-bold text-gray-900">{personReport.totalMeetings}</p>
                  <p className="text-sm text-gray-500">Meetings Attended</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-2xl font-bold text-gray-900">{Math.round(personReport.totalMinutes)}</p>
                  <p className="text-sm text-gray-500">Total Minutes</p>
                </div>
              </div>

              {Object.keys(personReport.byRole).length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Time by Role</h4>
                  {Object.entries(personReport.byRole).map(([role, mins]: [string, any]) => (
                    <div key={role} className="flex justify-between py-1 text-sm">
                      <span className="capitalize">{role.replace("_", " ")}</span>
                      <span className="text-gray-600">{Math.round(mins)} min</span>
                    </div>
                  ))}
                </div>
              )}

              {personReport.attendances?.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b text-left text-xs text-gray-500 uppercase">
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Meeting Type</th>
                        <th className="px-4 py-2">Role</th>
                        <th className="px-4 py-2">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personReport.attendances.map((a: any, i: number) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="px-4 py-2">{new Date(a.date).toLocaleDateString()}</td>
                          <td className="px-4 py-2">{a.meetingType}</td>
                          <td className="px-4 py-2 capitalize">{(a.role || "—").replace("_", " ")}</td>
                          <td className="px-4 py-2">{a.durationMinutes ? `${Math.round(a.durationMinutes)} min` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
