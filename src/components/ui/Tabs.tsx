"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: "line" | "pill";
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  variant = "line",
}: TabsProps) {
  const tabListRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    const availableTabs = tabs.filter((t) => !t.disabled);
    const currentIndex = availableTabs.findIndex((t) => t.id === tabs[index].id);

    let nextIndex = -1;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % availableTabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + availableTabs.length) % availableTabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = availableTabs.length - 1;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      const targetTab = availableTabs[nextIndex];
      onChange(targetTab.id);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      const targetButton = Array.from(buttons || []).find(
        (b) => b.getAttribute("data-tab-id") === targetTab.id
      );
      targetButton?.focus();
    }
  }

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        "flex items-center gap-1 overflow-x-auto scrollbar-none",
        variant === "line" ? "border-b border-[#ebebeb]" : "p-1 bg-[#fafafa] border border-[#ebebeb] rounded",
        className
      )}
    >
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id;

        if (variant === "pill") {
          return (
            <button
              key={tab.id}
              role="tab"
              data-tab-id={tab.id}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-mono transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#171717]",
                isActive
                  ? "bg-[#171717] text-white font-medium shadow-sm"
                  : "text-[#666666] hover:text-[#171717] hover:bg-[#ebebeb]/50",
                tab.disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              {tab.icon && <span className="w-3.5 h-3.5 shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={cn(
                    "ml-1 px-1.5 py-0.2 rounded text-[10px]",
                    isActive ? "bg-white/20 text-white" : "bg-[#ebebeb] text-[#666666]"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        }

        // Line variant (default for session top bar / workspace)
        return (
          <button
            key={tab.id}
            role="tab"
            data-tab-id={tab.id}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              "px-3 py-2 text-xs sm:text-sm font-mono tracking-tight flex items-center gap-2 border-b-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] -mb-px",
              isActive
                ? "border-[#171717] text-[#171717] font-semibold"
                : "border-transparent text-[#666666] hover:text-[#171717] hover:border-[#ebebeb]",
              tab.disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            {tab.icon && <span className="w-3.5 h-3.5 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-[#ebebeb] text-[#666666] text-[10px]">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
