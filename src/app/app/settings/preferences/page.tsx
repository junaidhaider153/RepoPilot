"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Check, Sliders } from "lucide-react";

export interface UserPreferences {
  defaultSidebarState: "expanded" | "collapsed";
  defaultExportFormat: "markdown" | "json";
  autoTitleSessions: boolean;
  reducedMotion: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultSidebarState: "expanded",
  defaultExportFormat: "markdown",
  autoTitleSessions: true,
  reducedMotion: false,
};

export default function PreferencesSettingsPage() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [initialPrefs, setInitialPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("repopilot_user_preferences");
      if (stored) {
        const parsed = JSON.parse(stored);
        setPrefs(parsed);
        setInitialPrefs(parsed);
      }
    } catch {
      // Fallback
    }
  }, []);

  const hasChanges =
    prefs.defaultSidebarState !== initialPrefs.defaultSidebarState ||
    prefs.defaultExportFormat !== initialPrefs.defaultExportFormat ||
    prefs.autoTitleSessions !== initialPrefs.autoTitleSessions ||
    prefs.reducedMotion !== initialPrefs.reducedMotion;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      localStorage.setItem("repopilot_user_preferences", JSON.stringify(prefs));
      setInitialPrefs(prefs);
      toast({
        title: "Preferences saved",
        message: "Your application preferences have been updated.",
        type: "success",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-lg border border-[#ebebeb] p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-base font-semibold text-[#171717]">Workspace Preferences</h2>
        <p className="text-xs text-[#666666] mt-0.5">
          Customize sidebar default layout, export format defaults, and animation behaviors.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Default Sidebar State */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#171717]">
            Default Sidebar Layout
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => setPrefs({ ...prefs, defaultSidebarState: "expanded" })}
              className={`p-3 rounded border text-left transition-all ${
                prefs.defaultSidebarState === "expanded"
                  ? "border-[#171717] bg-[#fafafa] shadow-xs"
                  : "border-[#ebebeb] hover:border-[#171717]"
              }`}
            >
              <p className="text-xs font-semibold text-[#171717]">Expanded (260px)</p>
              <p className="text-[11px] text-[#666666] mt-0.5">
                Displays session titles, repository names, and full navigation.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPrefs({ ...prefs, defaultSidebarState: "collapsed" })}
              className={`p-3 rounded border text-left transition-all ${
                prefs.defaultSidebarState === "collapsed"
                  ? "border-[#171717] bg-[#fafafa] shadow-xs"
                  : "border-[#ebebeb] hover:border-[#171717]"
              }`}
            >
              <p className="text-xs font-semibold text-[#171717]">Collapsed (56px)</p>
              <p className="text-[11px] text-[#666666] mt-0.5">
                Compact icon-only rail maximizing screen width for chat.
              </p>
            </button>
          </div>
        </div>

        {/* Default Export Format */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#171717]">
            Default Document Export Format
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => setPrefs({ ...prefs, defaultExportFormat: "markdown" })}
              className={`p-3 rounded border text-left transition-all ${
                prefs.defaultExportFormat === "markdown"
                  ? "border-[#171717] bg-[#fafafa] shadow-xs"
                  : "border-[#ebebeb] hover:border-[#171717]"
              }`}
            >
              <p className="text-xs font-semibold text-[#171717]">Markdown (.md)</p>
              <p className="text-[11px] text-[#666666] mt-0.5">
                Portable, human-readable format ideal for GitHub and documentation.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPrefs({ ...prefs, defaultExportFormat: "json" })}
              className={`p-3 rounded border text-left transition-all ${
                prefs.defaultExportFormat === "json"
                  ? "border-[#171717] bg-[#fafafa] shadow-xs"
                  : "border-[#ebebeb] hover:border-[#171717]"
              }`}
            >
              <p className="text-xs font-semibold text-[#171717]">Structured JSON (.json)</p>
              <p className="text-[11px] text-[#666666] mt-0.5">
                Machine-readable format for ingestion by developer tooling.
              </p>
            </button>
          </div>
        </div>

        {/* Auto-Title Sessions */}
        <div className="pt-2 border-t border-[#ebebeb] space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#171717]">
                Auto-generate Session Titles
              </p>
              <p className="text-xs text-[#666666] mt-0.5">
                Automatically name new sessions using the first question asked instead of falling back to the repository slug.
              </p>
            </div>
            <input
              type="checkbox"
              id="autoTitle"
              checked={prefs.autoTitleSessions}
              onChange={(e) => setPrefs({ ...prefs, autoTitleSessions: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-[#ebebeb] text-[#171717] focus:ring-[#171717]"
            />
          </div>

          {/* Reduced Motion */}
          <div className="flex items-start justify-between gap-4 pt-2 border-t border-[#f5f5f5]">
            <div>
              <p className="text-xs font-semibold text-[#171717]">
                Reduced Motion
              </p>
              <p className="text-xs text-[#666666] mt-0.5">
                Disable sliding animations and drawer transitions across the workspace.
              </p>
            </div>
            <input
              type="checkbox"
              id="reducedMotion"
              checked={prefs.reducedMotion}
              onChange={(e) => setPrefs({ ...prefs, reducedMotion: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-[#ebebeb] text-[#171717] focus:ring-[#171717]"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-[#ebebeb] flex items-center justify-between">
          <div>
            {hasChanges && (
              <span className="text-xs text-[#d97706] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                Unsaved changes
              </span>
            )}
          </div>

          <Button type="submit" isLoading={isSaving} disabled={!hasChanges || isSaving}>
            <Check className="w-3.5 h-3.5 mr-1.5" />
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
