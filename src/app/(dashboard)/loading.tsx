// Scoped loader for dashboard routes. Renders inside DashboardShell
// (sidebar + topbar stay put) so navigation between pages feels instant
// instead of flashing the full-screen root loader.

export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      {/* Page heading */}
      <div className="space-y-2">
        <div className="skeleton" style={{ height: 26, width: 220 }} />
        <div className="skeleton" style={{ height: 14, width: 300 }} />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-5 flex items-center gap-4">
            <div
              className="skeleton flex-shrink-0"
              style={{ width: 44, height: 44, borderRadius: "var(--radius)" }}
            />
            <div className="flex-1 space-y-2">
              <div className="skeleton" style={{ height: 22, width: "55%" }} />
              <div className="skeleton" style={{ height: 12, width: "75%" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5 space-y-3">
          <div className="skeleton" style={{ height: 16, width: 160 }} />
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 56, width: "100%", borderRadius: "var(--radius)" }}
            />
          ))}
        </div>
        <div className="card p-5 space-y-3">
          <div className="skeleton" style={{ height: 16, width: 120 }} />
          <div
            className="skeleton"
            style={{ height: 90, width: "100%", borderRadius: "var(--radius)" }}
          />
          <div className="skeleton" style={{ height: 12, width: "80%" }} />
          <div className="skeleton" style={{ height: 12, width: "65%" }} />
        </div>
      </div>
    </div>
  );
}
