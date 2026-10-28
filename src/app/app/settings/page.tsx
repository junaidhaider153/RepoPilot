"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Camera, Check, AlertCircle } from "lucide-react";

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [initialState, setInitialState] = useState({ displayName: "", bio: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profile) {
          const name = data.profile.display_name || user?.displayName || "";
          const userBio = data.profile.bio || "";
          setDisplayName(name);
          setBio(userBio);
          setAvatarPreview(data.profile.avatar_url || null);
          setInitialState({ displayName: name, bio: userBio });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user]);

  const hasUnsavedChanges =
    displayName !== initialState.displayName || bio !== initialState.bio;

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAvatarError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2 MB)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Avatar image must be smaller than 2 MB.");
      return;
    }

    // Validate type (JPG or PNG)
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Only JPG, PNG, or WebP images are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim(),
          avatarUrl: avatarPreview,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile.");
      }

      setInitialState({ displayName: displayName.trim(), bio: bio.trim() });
      toast({
        title: "Profile updated",
        message: "Your profile information has been saved successfully.",
        type: "success",
      });
    } catch (err: unknown) {
      toast({
        title: "Error saving profile",
        message: err instanceof Error ? err.message : "An unexpected error occurred.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const initials = displayName
    ? displayName
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="bg-white rounded-lg border border-[#ebebeb] p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-base font-semibold text-[#171717]">Public Profile</h2>
        <p className="text-xs text-[#666666] mt-0.5">
          This information will be displayed in your workspace and shared document packages.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar Section */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#171717]">
            Profile Avatar
          </label>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full bg-[#171717] text-white flex items-center justify-center font-mono text-lg font-semibold overflow-hidden border border-[#ebebeb]">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <div>
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#ebebeb] bg-[#fafafa] hover:bg-white text-xs font-medium text-[#171717] transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-[#666666]" />
                <span>Upload new image</span>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="sr-only"
                />
              </label>
              <p className="text-[11px] font-mono text-[#8f8f8f] mt-1">
                JPG or PNG. Max file size: 2 MB.
              </p>
              {avatarError && (
                <p className="text-xs text-[#dc2626] flex items-center gap-1 mt-1 font-sans">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{avatarError}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-1.5">
          <label htmlFor="displayName" className="block text-xs font-medium text-[#171717]">
            Display Name
          </label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name or handle"
            disabled={isLoading || isSaving}
            required
          />
        </div>

        {/* Email Read-only */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-medium text-[#171717]">
            Email Address
          </label>
          <Input
            id="email"
            value={user?.email || "developer@repopilot.local"}
            disabled
            className="bg-[#fafafa] text-[#8f8f8f] cursor-not-allowed"
          />
          <p className="text-[11px] font-mono text-[#8f8f8f]">
            Email address is managed in Account & Security settings.
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label htmlFor="bio" className="block text-xs font-medium text-[#171717]">
            Bio (Optional)
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself and what codebases you analyze..."
            rows={3}
            disabled={isLoading || isSaving}
            className="w-full text-xs sm:text-sm font-sans p-3 bg-white border border-[#ebebeb] rounded text-[#171717] placeholder-[#a8a8a8] focus:border-[#171717] focus:outline-none resize-none transition-colors"
          />
        </div>

        {/* Unsaved changes notice & Save button */}
        <div className="pt-4 border-t border-[#ebebeb] flex items-center justify-between">
          <div>
            {hasUnsavedChanges && (
              <span className="text-xs text-[#d97706] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                Unsaved changes
              </span>
            )}
          </div>

          <Button
            type="submit"
            isLoading={isSaving}
            disabled={!hasUnsavedChanges || isSaving || !displayName.trim()}
          >
            <Check className="w-3.5 h-3.5 mr-1.5" />
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}

