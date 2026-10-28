"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function MobileDrawer({
  isOpen,
  onClose,
  children,
  className,
}: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape & trap scroll
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;
    const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
      className="fixed inset-0 z-50 md:hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div
        ref={drawerRef}
        className={cn(
          "fixed inset-y-0 left-0 w-[280px] max-w-[85vw] bg-white border-r border-[#ebebeb] shadow-lg flex flex-col z-10 transition-transform animate-fadeIn",
          className
        )}
      >
        <div className="flex items-center justify-between p-3 border-b border-[#ebebeb]">
          <span className="font-mono font-bold text-sm text-[#171717]">▲ RepoPilot</span>
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-1 text-[#666666] hover:text-[#171717] rounded hover:bg-[#fafafa]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
      </div>
    </div>
  );
}

