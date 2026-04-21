"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface OrgNavProps {
  orgSlug: string;
  orgName: string;
  role: string;
  orgId: string;
}

export function OrgNav({ orgSlug, orgName, role }: OrgNavProps) {
  const pathname = usePathname();
  const base = `/org/${orgSlug}`;

  const tabs = [
    { label: "Meetings", href: base, exact: true },
    { label: "Meeting Types", href: `${base}/meeting-types` },
    { label: "Roster", href: `${base}/roster` },
    { label: "Reports", href: `${base}/reports` },
    ...(["owner", "admin"].includes(role)
      ? [{ label: "Settings", href: `${base}/settings` }]
      : []),
  ];

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{orgName}</h2>
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap px-4 py-3 border-b-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
