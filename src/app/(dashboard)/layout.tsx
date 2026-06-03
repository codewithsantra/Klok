"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { name: "Dashboard", icon: "fa-house", href: "/dashboard" },
  { name: "Today's Log", icon: "fa-calendar-day", href: "/today" },
  { name: "Templates", icon: "fa-layer-group", href: "/templates" },
  { name: "Recurring Blocks", icon: "fa-rotate", href: "/recurring-blocks" },
];

const MOBILE_NAV = [
  { name: "Home", icon: "fa-house", href: "/dashboard", screen: "dashboard" },
  { name: "Today", icon: "fa-calendar-day", href: "/today", screen: "today" },
  { name: "Templates", icon: "fa-layer-group", href: "/templates", screen: "templates" },
  { name: "Settings", icon: "fa-gear", href: "/settings", screen: "settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="h-screen flex overflow-hidden bg-[#ECECF8]">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay open lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar w-[220px] flex-shrink-0 bg-white flex flex-col h-screen ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
        style={{ boxShadow: "2px 0 16px rgba(0,0,0,0.04)" }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-4 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#6C6FDF] rounded-xl flex items-center justify-center shadow-md shadow-[#6C6FDF]/40">
            <i className="fa-solid fa-calendar-check text-white text-xs"></i>
          </div>
          <span className="text-lg font-extrabold text-[#1A1A2E]">DayLog</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-2 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "nav-item-active"
                  : ""
              }`}
            >
              <i className={`fa-solid ${item.icon}`}></i> {item.name}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 border-t border-[#F3F4F6] pt-3">
          <Link
            href="/settings"
            className={`nav-item ${pathname === "/settings" ? "nav-item-active" : ""}`}
          >
            <i className="fa-solid fa-gear"></i> Settings
          </Link>
          <Link href="/" className="nav-item">
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
          </Link>
          {/* User mini */}
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 pt-3 mt-1 cursor-pointer rounded-xl hover:bg-[#F5F5FA] transition-colors"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
              style={{
                background: "linear-gradient(135deg,#6C6FDF,#9B9EEF)",
              }}
            >
              S
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1A1A2E] truncate">
                Santra
              </div>
              <div className="text-[10px] text-[#9CA3AF] truncate">
                santra@daylog.app
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="bg-white flex items-center justify-between px-4 md:px-6 py-3.5 flex-shrink-0"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="mobile-menu-btn w-9 h-9 bg-[#F9F9FD] rounded-xl flex items-center justify-center hover:bg-[#EEEEFF] transition-colors lg:hidden"
            >
              <i className="fa-solid fa-bars text-[#6B7280] text-sm"></i>
            </button>
            <div>
              <div className="text-xs font-semibold text-[#9CA3AF]">
                Monday / 2nd June 2026
              </div>
              <div className="text-base lg:text-lg font-extrabold text-[#1A1A2E]">
                Good afternoon, Santra! ☀️
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="topbar-search relative hidden md:block">
              <input
                className="inp pl-9 bg-[#F9F9FD]"
                style={{
                  width: "200px",
                  padding: "9px 14px 9px 36px",
                  fontSize: "13px",
                }}
                placeholder="Search blocks, todos..."
              />
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-[#9CA3AF] text-sm"></i>
            </div>
            <button
              className="w-9 h-9 bg-[#F9F9FD] rounded-xl flex items-center justify-center hover:bg-[#EEEEFF] transition-colors"
              title="Notifications coming soon"
            >
              <i className="fa-solid fa-bell text-[#6B7280] text-sm"></i>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#ECECF8]">
          {children}
        </div>

        {/* Bottom padding spacer for mobile nav */}
        <div className="h-16 lg:hidden flex-shrink-0"></div>
      </div>

      {/* Mobile bottom nav */}
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
                className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors"
                style={{
                  color: active ? "#6C6FDF" : "#9CA3AF",
                  background: active ? "#EEEEFF" : "transparent",
                }}
              >
                <i className={`fa-solid ${item.icon} text-base`}></i>
                <span style={{ fontSize: "10px", fontWeight: 600 }}>
                  {item.name}
                </span>
              </Link>
            );
          })}
          {/* Center + button */}
          <button
            className="flex flex-col items-center gap-1 py-2 px-4 rounded-2xl"
            style={{ background: "#6C6FDF", color: "white" }}
          >
            <i className="fa-solid fa-plus text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
