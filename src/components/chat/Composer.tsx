"use client";

import React, { useRef, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComposerProps {
  value: string;
  onChange: (val: string) => void;
  onSend: (text: string) => void;
  onStop?: () => void;
  isLoading?: boolean;
  sessionId?: string;
  placeholder?: string;
  className?: string;
}

const MAX_CHARS = 1000;

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  isLoading = false,
  sessionId = "default",
  placeholder = "Ask a question about the repository (e.g. How is authentication handled?)...",
  className,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const draftKey = `repopilot_draft_${sessionId}`;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Restore draft on mount
  useEffect(() => {
    try {
      const savedDraft = window.sessionStorage.getItem(draftKey);
      if (savedDraft) {
        onChangeRef.current(savedDraft);
      }
    } catch {
      // Ignore storage errors
    }
  }, [draftKey]);

  // Persist draft on changes
  useEffect(() => {
    try {
      if (value.trim()) {
        window.sessionStorage.setItem(draftKey, value);
      } else {
        window.sessionStorage.removeItem(draftKey);
      }
    } catch {
      // Ignore storage errors
    }
  }, [value, draftKey]);

  // Auto-grow textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.min(el.scrollHeight, 200); // 200px max height (~8 lines)
    el.style.height = `${Math.max(newHeight, 48)}px`;
  }, [value]);

  // Global `/` shortcut to focus composer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== textareaRef.current) {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA" && !(document.activeElement as HTMLElement)?.isContentEditable) {
          e.preventDefault();
          textareaRef.current?.focus();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && value.length <= MAX_CHARS) {
        handleSubmit();
      }
    }
  }

  function handleSubmit() {
    if (!value.trim() || isLoading || value.length > MAX_CHARS) return;
    const toSend = value;
    try {
      window.sessionStorage.removeItem(draftKey);
    } catch {
      // Ignore
    }
    onSend(toSend);
  }

  const charsLeft = MAX_CHARS - value.length;
  const isOverLimit = charsLeft < 0;
  const isNearLimit = charsLeft <= 100;

  return (
    <div
      className={cn(
        "relative rounded-lg border border-[#ebebeb] bg-white p-3 shadow-sm transition-all focus-within:border-[#171717]",
        isOverLimit && "border-[#dc2626] focus-within:border-[#dc2626]",
        className
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={isLoading}
        aria-label="Ask a question about the repository"
        className="w-full text-xs sm:text-sm font-sans bg-transparent placeholder-[#8f8f8f] focus:outline-none resize-none leading-relaxed text-[#171717] disabled:opacity-50"
      />

      <div className="flex items-center justify-between pt-2 border-t border-[#f5f5f5] mt-1 text-[11px] font-mono text-[#8f8f8f]">
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">
            Press <kbd className="px-1 py-0.5 rounded bg-[#f0f0f0] border border-[#d6d6d6] text-[10px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-[#f0f0f0] border border-[#d6d6d6] text-[10px]">Shift+Enter</kbd> for newline
          </span>
          <span
            className={cn(
              "transition-colors",
              isNearLimit && "text-[#d97706] font-semibold",
              isOverLimit && "text-[#dc2626] font-bold"
            )}
          >
            {charsLeft} / {MAX_CHARS}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop generation"
              title="Stop generating"
              className="p-1.5 rounded-full bg-[#171717] text-white hover:bg-[#333333] transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!value.trim() || isOverLimit}
              aria-label="Send question"
              className="p-1.5 rounded-full bg-[#171717] text-white hover:bg-[#333333] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
