"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface AppShellProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2">
                <svg className="w-8 h-8 text-blue-600" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="3" />
                  <path d="M20 10V20L27 27" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="20" cy="20" r="2" fill="currentColor" />
                </svg>
                <span className="text-xl font-bold text-gray-900">Meeting Rails</span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                <NavLink href="/dashboard" active={pathname === "/dashboard"}>Dashboard</NavLink>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 transition-colors"
                >
                  {user.image ? (
                    <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                      {user.name?.[0] || user.email?.[0] || "?"}
                    </div>
                  )}
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-md hover:bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2 px-4">
            <NavLink href="/dashboard" active={pathname === "/dashboard"} mobile>Dashboard</NavLink>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, active, children, mobile }: { href: string; active: boolean; children: React.ReactNode; mobile?: boolean }) {
  const base = mobile
    ? "block py-2 text-sm font-medium rounded-md"
    : "px-3 py-2 text-sm font-medium rounded-md";
  const styles = active
    ? `${base} text-blue-600 bg-blue-50`
    : `${base} text-gray-600 hover:text-gray-900 hover:bg-gray-50`;
  return <Link href={href} className={styles}>{children}</Link>;
}
