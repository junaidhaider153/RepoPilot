"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: Array<DropdownItem | "divider">;
  align?: "left" | "right";
  className?: string;
  width?: string;
}

export function Dropdown({
  trigger,
  items,
  align = "right",
  className,
  width = "w-48",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const actionableItems = items.filter((item): item is DropdownItem => item !== "divider" && !item.disabled);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % actionableItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + actionableItems.length) % actionableItems.length);
    } else if (e.key === "Enter" && focusedIndex >= 0 && focusedIndex < actionableItems.length) {
      e.preventDefault();
      actionableItems[focusedIndex].onClick();
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left" onKeyDown={handleKeyDown}>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={cn(
            "absolute z-50 mt-1.5 bg-white border border-[#ebebeb] rounded py-1 shadow-sm focus:outline-none animate-fadeIn",
            align === "right" ? "right-0" : "left-0",
            width,
            className
          )}
        >
          {items.map((item, index) => {
            if (item === "divider") {
              return <div key={`divider-${index}`} className="h-px bg-[#ebebeb] my-1" />;
            }

            const isActionable = !item.disabled;
            const actionableIdx = actionableItems.findIndex((ai) => ai.id === item.id);
            const isFocused = actionableIdx === focusedIndex;

            return (
              <button
                key={item.id}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs font-mono flex items-center justify-between transition-colors",
                  item.danger
                    ? "text-[#dc2626] hover:bg-[#fef2f2]"
                    : "text-[#171717] hover:bg-[#fafafa]",
                  isFocused && (item.danger ? "bg-[#fef2f2]" : "bg-[#fafafa]"),
                  item.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  {item.icon && <span className="w-3.5 h-3.5 shrink-0 text-[#666666]">{item.icon}</span>}
                  <span className="truncate">{item.label}</span>
                </span>
                {item.shortcut && (
                  <span className="text-[10px] text-[#8f8f8f] font-mono shrink-0 ml-2">
                    {item.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

