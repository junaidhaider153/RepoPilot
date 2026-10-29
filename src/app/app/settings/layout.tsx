"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, Sliders, Activity, Database, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/app/settings", label: "Profile", icon: User },
  { href: "/app/settings/account", label: "Account & Security", icon: Shield },
  { href: "/app/settings/preferences", label: "Preferences", icon: Sliders },
  { href: "/app/settings/usage", label: "Usage & Limits", icon: Activity },
  { href: "/app/settings/data", label: "Data & Privacy", icon: Database },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex-1 h-full w-full overflow-y-auto bg-neutral-100/60 antialiased">
      <div className="max-w-5xl mx-auto py-8 sm:py-10 px-4 sm:px-6 space-y-6 animate-fadeIn">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-200/90 pb-4">
          <div>
            <div className="mb-2">
              <Link
                href="/app"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:border-neutral-400 text-xs font-mono transition-all shadow-2xs"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to Workspace</span>
              </Link>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
              Account &amp; Application Settings
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Manage your personal profile, credentials, workspace preferences, and stored data.
            </p>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Left Sub-Navigation */}
          <nav
            aria-label="Settings Navigation"
            className="md:col-span-1 space-y-1.5 bg-white p-3 rounded-2xl border border-neutral-200/90 shadow-2xs"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/app/settings"
                  ? pathname === "/app/settings"
                  : pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150",
                    isActive
                      ? "bg-neutral-900 text-white shadow-xs font-semibold"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-neutral-400")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Content Panel */}
          <main className="md:col-span-3 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
