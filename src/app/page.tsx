import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-blue-600" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="3" />
              <path d="M20 10V20L27 27" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <circle cx="20" cy="20" r="2" fill="currentColor" />
            </svg>
            <span className="text-xl font-bold text-gray-900">MeetingPulse</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Sign In
            </Link>
            <Link
              href="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
          Run Structured Meetings<br />That Actually Stay on Track
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          AI-powered audio cues keep your team focused. Timed sections ensure every topic gets covered.
          Role-based tracking proves compliance.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 shadow-lg shadow-blue-600/25"
          >
            Start Free
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Everything you need for structured meetings</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "AI Audio Cues", desc: "Voice announcements guide your meeting. Section transitions, time warnings, and custom alerts keep everyone on track." },
            { title: "Timed Sections", desc: "Define your meeting structure once. Each section gets its own timer with configurable durations and sub-timers." },
            { title: "Role-Based Tracking", desc: "Track who attended each meeting and in what role — intern, resident, supervisor, guest presenter." },
            { title: "Tangent Alerts", desc: "Seven fun sound effects to gently redirect off-topic discussions. From subtle chimes to comedic horns." },
            { title: "Compliance Reports", desc: "Filter by date range, meeting type, or person. See total hours logged per role. Export as CSV." },
            { title: "Custom Templates", desc: "Start with built-in templates for rounds, lectures, journal clubs, and case reviews. Customize or create your own." },
          ].map((f, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Simple, transparent pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 text-lg">Free</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">$0<span className="text-base font-normal text-gray-500">/mo</span></p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>10 team members</li>
                <li>5 meeting templates</li>
                <li>90 days history</li>
                <li>Browser audio cues</li>
              </ul>
              <Link href="/login" className="mt-6 block text-center bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
                Get Started
              </Link>
            </div>
            <div className="bg-white rounded-xl border-2 border-blue-600 p-6 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </span>
              <h3 className="font-bold text-gray-900 text-lg">Pro</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">$29<span className="text-base font-normal text-gray-500">/mo</span></p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>50 team members</li>
                <li>Unlimited templates</li>
                <li>Unlimited history</li>
                <li>ElevenLabs AI voice</li>
              </ul>
              <button className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
                Coming Soon
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 text-lg">Enterprise</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">Custom</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>Unlimited everything</li>
                <li>SSO/SAML</li>
                <li>API access</li>
                <li>Dedicated support</li>
              </ul>
              <button className="mt-6 w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} MeetingPulse by Sage Veterinary Imaging. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
