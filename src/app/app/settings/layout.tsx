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
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#ebebeb] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8f8f8f] mb-1">
            <Link
              href="/app"
              className="inline-flex items-center gap-1 hover:text-[#171717] transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Workspace</span>
            </Link>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#171717]">
            Account & Application Settings
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Manage your personal profile, credentials, workspace preferences, and stored data.
          </p>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Left Sub-Navigation */}
        <nav
          aria-label="Settings Navigation"
          className="md:col-span-1 space-y-1 bg-white p-2 rounded-lg border border-[#ebebeb]"
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
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                  isActive
                    ? "bg-[#171717] text-white shadow-xs"
                    : "text-[#666666] hover:text-[#171717] hover:bg-[#fafafa]"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-[#8f8f8f]")} />
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
  );
}
