"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { NotificationBell } from "./notification-bell";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

const NAV = [
  { label: "Home",    href: "/dashboard", glyph: "⊞" },
  { label: "Courses", href: "/explore",   glyph: "◎" },
  { label: "Study",   href: "/study",     glyph: "⏱" },
];

export function SidebarNav({ user }: { user: User }) {
  const pathname = usePathname();

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden sm:flex fixed left-0 top-0 h-full w-56 flex-col border-r border-border bg-surface z-40">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-md bg-teal flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: "0 0 12px -2px rgba(14,200,181,0.5)" }}
            >
              <span className="text-paper font-display font-bold text-xs">M</span>
            </div>
            <span className="font-display font-bold text-ink tracking-tight text-sm">Meridian</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-px overflow-y-auto">
          {NAV.map(({ label, href, glyph }) => {
            const active =
              pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all ${
                  active
                    ? "text-teal bg-teal/10"
                    : "text-ink-3 hover:text-ink hover:bg-surface-2"
                }`}
              >
                <span className="text-base leading-none">{glyph}</span>
                <span className="font-body font-medium uppercase tracking-widest">{label}</span>
                {active && (
                  <span className="ml-auto w-1 h-1 rounded-full bg-teal" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            {user?.image ? (
              <img
                src={user.image}
                alt=""
                className="w-7 h-7 rounded-full border border-border flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-teal/15 border border-teal/25 flex items-center justify-center flex-shrink-0">
                <span className="text-teal text-xs font-bold">{initials}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-body text-ink truncate leading-snug">{user?.name}</p>
              <p className="text-xs font-body text-ink-3 truncate leading-snug" style={{ fontSize: "0.65rem" }}>
                {user?.email}
              </p>
            </div>
            <NotificationBell />
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-ink-3 hover:text-teal transition-colors flex-shrink-0"
              title="Sign out"
              style={{ fontSize: "1.1rem" }}
            >
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-t border-border flex items-center justify-around px-2 py-2">
        {NAV.map(({ label, href, glyph }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                active ? "text-teal" : "text-ink-3"
              }`}
            >
              <span className="text-xl leading-none">{glyph}</span>
              <span className="font-body uppercase tracking-widest" style={{ fontSize: "0.6rem" }}>
                {label}
              </span>
            </Link>
          );
        })}
        <div className="flex flex-col items-center gap-1 px-3 py-1">
          <NotificationBell />
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-ink-3 transition-colors"
        >
          {user?.image ? (
            <img src={user.image} alt="" className="w-6 h-6 rounded-full border border-border" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-teal/15 border border-teal/25 flex items-center justify-center">
              <span className="text-teal font-bold" style={{ fontSize: "0.6rem" }}>{initials}</span>
            </div>
          )}
          <span className="font-body uppercase tracking-widest" style={{ fontSize: "0.6rem" }}>You</span>
        </button>
      </nav>
    </>
  );
}
