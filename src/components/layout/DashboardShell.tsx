"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { signOutAction } from "@/actions/auth";
import TimezoneSync from "./TimezoneSync";
import Toaster from "./Toaster";

const NAV_ITEMS = [
  { name: "Dashboard",   icon: "fa-house",        href: "/dashboard" },
  { name: "Today's Log", icon: "fa-calendar-day", href: "/today" },
  { name: "Analytics",   icon: "fa-chart-bar",    href: "/analytics" },
  { name: "Templates",   icon: "fa-layer-group",  href: "/templates" },
];

const MOBILE_NAV = [
  { name: "Home",      icon: "fa-house",        href: "/dashboard" },
  { name: "Today",     icon: "fa-calendar-day", href: "/today" },
  { name: "Analytics", icon: "fa-chart-bar",    href: "/analytics" },
  { name: "Settings",  icon: "fa-gear",         href: "/settings" },
];

export type UserSummary = {
  id: string;
  email: string;
  name: string | null;
  timeZone: string;
};

export default function DashboardShell({
  user,
  children,
}: {
  user: UserSummary;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Initialise theme from localStorage — default light
  useEffect(() => {
    const stored = localStorage.getItem("klok-theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("klok-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("klok-theme", "light");
    }
  };

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  // Close sidebar on resize
  useEffect(() => {
    const fn = () => { if (window.innerWidth >= 1024) setSidebarOpen(false); };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const displayName = user.name?.trim() || user.email.split("@")[0];
  const initial = (user.name?.trim() || user.email).charAt(0).toUpperCase();

  const currentPage =
    NAV_ITEMS.find(
      (n) => pathname === n.href || pathname.startsWith(n.href + "/")
    )?.name ?? (pathname === "/settings" ? "Settings" : "Dashboard");

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* Keep the user's timezone in sync with their browser */}
      <TimezoneSync current={user.timeZone} />
      <Toaster />

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay open lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────── */}
      <aside
        className={`sidebar w-[216px] flex-shrink-0 flex flex-col h-screen ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="w-6 h-6 flex items-center justify-center flex-shrink-0"
            style={{
              background: "var(--btn-primary-bg)",
              borderRadius: "5px",
            }}
          >
            <i
              className="fa-solid fa-calendar-check"
              style={{ fontSize: "11px", color: "var(--btn-primary-text)" }}
            ></i>
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--text)", letterSpacing: "-0.01em" }}
          >
            Klok
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 overflow-y-auto">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${active ? "nav-item-active" : ""}`}
                >
                  <i className={`fa-solid ${item.icon}`}></i>
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div
            style={{
              height: "1px",
              background: "var(--border)",
              margin: "10px 4px",
            }}
          />

          {/* Account */}
          <p
            className="px-2 mb-1"
            style={{
              fontSize: "10.5px",
              fontWeight: 500,
              color: "var(--text-3)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Account
          </p>
          <Link
            href="/settings"
            className={`nav-item ${
              pathname === "/settings" ? "nav-item-active" : ""
            }`}
          >
            <i className="fa-solid fa-gear"></i>
            Settings
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="nav-item w-full text-left"
              style={{ background: "transparent", border: "none" }}
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              Sign out
            </button>
          </form>
        </nav>

        {/* Bottom */}
        <div
          className="px-2 py-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="nav-item w-full text-left mb-0.5"
            style={{ background: "transparent", border: "none" }}
          >
            <i
              className={`fa-solid ${
                theme === "dark" ? "fa-sun" : "fa-moon"
              }`}
            ></i>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>

          {/* User */}
          <Link
            href="/settings"
            className="flex items-center gap-2 px-2 py-1.5 transition-colors"
            style={{ borderRadius: "var(--radius)" }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "var(--surface-2)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <div
              className="w-6 h-6 flex items-center justify-center font-bold flex-shrink-0"
              style={{
                fontSize: "10px",
                background: "var(--btn-primary-bg)",
                color: "var(--btn-primary-text)",
                borderRadius: "5px",
              }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="truncate font-semibold"
                style={{ fontSize: "12.5px", color: "var(--text)" }}
              >
                {displayName}
              </div>
              <div
                className="truncate"
                style={{ fontSize: "10.5px", color: "var(--text-3)" }}
              >
                {user.email}
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="flex items-center justify-between px-5 flex-shrink-0"
          style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            height: "44px",
          }}
        >
          <div className="flex items-center gap-2.5">
            {/* Hamburger (mobile) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="mobile-menu-btn btn btn-ghost lg:hidden"
              style={{ padding: "5px 7px" }}
            >
              <i
                className="fa-solid fa-bars"
                style={{ fontSize: "13px" }}
              ></i>
            </button>

            {/* Breadcrumb */}
            <div
              className="flex items-center gap-1.5"
              style={{ fontSize: "13px" }}
            >
              <span style={{ color: "var(--text-3)" }}>Klok</span>
              <span style={{ color: "var(--text-3)", fontSize: "11px" }}>
                /
              </span>
              <span style={{ color: "var(--text)", fontWeight: 500 }}>
                {currentPage}
              </span>
            </div>
          </div>

          {/* Theme toggle (topbar, for discoverability) */}
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}
          >
            <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`} style={{ fontSize: "13px" }}></i>
          </button>
        </header>

        {/* Page content */}
        <div className="app-canvas flex-1 overflow-y-auto p-5">
          {children}
        </div>

        {/* Mobile bottom spacer */}
        <div className="h-16 lg:hidden flex-shrink-0"></div>
      </div>

      {/* ── MOBILE BOTTOM NAV ───────────────────────── */}
      <div className="mobile-bottom-nav lg:hidden">
        <div className="flex items-center justify-around px-2">
          {MOBILE_NAV.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 py-1 px-3 transition-colors"
                style={{
                  color: active ? "var(--accent)" : "var(--text-3)",
                  background: active ? "var(--accent-bg)" : "transparent",
                  borderRadius: "var(--radius)",
                }}
              >
                <i
                  className={`fa-solid ${item.icon}`}
                  style={{ fontSize: "15px" }}
                ></i>
                <span style={{ fontSize: "10px", fontWeight: 600 }}>
                  {item.name}
                </span>
              </Link>
            );
          })}
          <Link
            href="/today"
            className="flex items-center justify-center"
            style={{
              background: "var(--accent)",
              color: "white",
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius)",
            }}
          >
            <i className="fa-solid fa-plus" style={{ fontSize: "14px" }}></i>
          </Link>
        </div>
      </div>
    </div>
  );
}
