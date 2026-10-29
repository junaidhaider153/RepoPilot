"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldAlert,
  Smartphone,
  Laptop,
  LogOut,
  AlertTriangle,
  KeyRound,
  Check,
  Mail,
} from "lucide-react";

function AccountSettingsContent() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [confirmedEmailParam, setConfirmedEmailParam] = useState<string | null>(null);

  useEffect(() => {
    if (!searchParams) return;
    if (searchParams.get("email_updated") === "true") {
      const confirmed = searchParams.get("email");
      if (confirmed) {
        setConfirmedEmailParam(confirmed);
      }
      toast({
        title: "Email verified & updated",
        message: confirmed
          ? `Your primary account email has been updated to ${confirmed}.`
          : "Your primary account email has been successfully updated.",
        type: "success",
      });
    } else if (searchParams.get("error")) {
      toast({
        title: "Verification failed",
        message: searchParams.get("error") || "Verification token is invalid or expired.",
        type: "error",
      });
    }
  }, [searchParams, toast]);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [isRequestingEmail, setIsRequestingEmail] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const timer = setInterval(() => {
      setEmailCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailCooldown]);

  // Danger zone state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [typedConfirmEmail, setTypedConfirmEmail] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Other devices state
  const [isSigningOutOthers, setIsSigningOutOthers] = useState(false);
  const [isSigningOutCurrent, setIsSigningOutCurrent] = useState(false);

  async function handleSignOutCurrent() {
    setIsSigningOutCurrent(true);
    try {
      await signOut();
      toast({
        title: "Signed out",
        message: "You have been signed out of your RepoPilot account.",
        type: "info",
      });
      router.push("/login");
    } catch (err: unknown) {
      toast({
        title: "Sign out failed",
        message: err instanceof Error ? err.message : "Error signing out.",
        type: "error",
      });
      setIsSigningOutCurrent(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 10) {
      toast({
        title: "Password too short",
        message: "New password must be at least 10 characters long.",
        type: "error",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        message: "New password and confirmation must match.",
        type: "error",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Password update failed",
          message: data?.error?.message || "Failed to update password.",
          type: "error",
        });
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password updated",
        message: "Your password has been changed successfully.",
        type: "success",
      });
    } catch (err: unknown) {
      toast({
        title: "Password update failed",
        message: err instanceof Error ? err.message : "Error contacting server.",
        type: "error",
      });
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes("@")) return;

    setIsRequestingEmail(true);
    try {
      const res = await fetch("/api/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Email update failed",
          message: data?.error?.message || "Failed to send verification email.",
          type: "error",
        });
        return;
      }
      const requestedEmail = newEmail.trim();
      setPendingVerificationEmail(requestedEmail);
      setEmailCooldown(0);
      toast({
        title: "Verification email sent",
        message: data?.message || `A confirmation link was sent to ${requestedEmail}. Please verify to complete the change.`,
        type: "success",
      });
      setNewEmail("");
    } catch (err: unknown) {
      toast({
        title: "Email update failed",
        message: err instanceof Error ? err.message : "Network error contacting server.",
        type: "error",
      });
    } finally {
      setIsRequestingEmail(false);
    }
  }

  async function handleResendVerificationEmail() {
    if (!pendingVerificationEmail || isResendingEmail || emailCooldown > 0) return;

    setIsResendingEmail(true);
    try {
      const res = await fetch("/api/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: pendingVerificationEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Resend failed",
          message: data?.error?.message || "Failed to resend verification email.",
          type: "error",
        });
        return;
      }
      toast({
        title: "Verification email resent",
        message: `A new verification email was dispatched to ${pendingVerificationEmail}. Please check your inbox and Spam folder.`,
        type: "success",
      });
      setEmailCooldown(30);
    } catch (err: unknown) {
      toast({
        title: "Resend failed",
        message: err instanceof Error ? err.message : "Network error contacting server.",
        type: "error",
      });
    } finally {
      setIsResendingEmail(false);
    }
  }

  async function handleSignOutOthers() {
    setIsSigningOutOthers(true);
    try {
      const res = await fetch("/api/account/sessions", {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Failed to revoke sessions",
          message: data?.error?.message || "Could not revoke other sessions.",
          type: "error",
        });
        return;
      }
      toast({
        title: "Sessions revoked",
        message: data?.message || "Signed out of all other active browser sessions.",
        type: "success",
      });
    } catch (err: unknown) {
      toast({
        title: "Failed to revoke sessions",
        message: err instanceof Error ? err.message : "Error contacting server.",
        type: "error",
      });
    } finally {
      setIsSigningOutOthers(false);
    }
  }

  async function handleDeleteAccount() {
    if (user?.email && typedConfirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      toast({
        title: "Email mismatch",
        message: "Please type your exact email address to confirm deletion.",
        type: "error",
      });
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail: typedConfirmEmail.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete account.");
      }

      toast({
        title: "Account deleted",
        message: "Your account and all associated data have been permanently removed.",
        type: "info",
      });

      setIsDeleteModalOpen(false);
      await signOut();
      router.push("/");
    } catch (err: unknown) {
      toast({
        title: "Deletion failed",
        message: err instanceof Error ? err.message : "Error contacting server.",
        type: "error",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  }

  const userEmail = confirmedEmailParam || user?.email || "developer@repopilot.local";
  const isDeleteConfirmed = typedConfirmEmail.trim().toLowerCase() === userEmail.toLowerCase();

  return (
    <div className="space-y-6">
      {/* Email Section */}
      <div className="bg-white rounded-lg border border-[#ebebeb] p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#171717]">Account Email</h2>
          <p className="text-xs text-[#666666] mt-0.5">
            Your primary email address is used for authentication and security alerts.
          </p>
        </div>

        <form onSubmit={handleEmailChange} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#171717]">
              Current Email
            </label>
            <div className="flex items-center gap-2">
              <Input value={userEmail} disabled className="bg-[#fafafa]" />
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#eaf5ed] text-[#16a34a] border border-[#d2edd7] shrink-0 font-medium">
                Verified
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="newEmail" className="block text-xs font-medium text-[#171717]">
              New Email Address
            </label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="name@company.com"
              disabled={isRequestingEmail}
            />
          </div>

          <Button
            type="submit"
            variant="secondary"
            disabled={!newEmail.trim() || isRequestingEmail}
            isLoading={isRequestingEmail}
          >
            Update Email Address
          </Button>

          {pendingVerificationEmail && (
            <div className="p-3.5 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] space-y-2.5 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#1e40af]">
                    Verification email dispatched to {pendingVerificationEmail}
                  </p>
                  <p className="text-[11px] text-[#3b82f6] leading-relaxed">
                    Please click the verification link in the email to activate your new address. Link expires in 24 hours.
                  </p>
                  <p className="text-[10px] text-[#64748b]">
                    💡 Check your <strong>Spam / Junk</strong> folder. If you sent the verification to your own sender Gmail, also check <strong>All Mail</strong> or <strong>Sent</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-[#dbeafe]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Resend verification email"
                  onClick={handleResendVerificationEmail}
                  disabled={isResendingEmail || emailCooldown > 0}
                  isLoading={isResendingEmail}
                  className="bg-white text-xs font-mono"
                >
                  {emailCooldown > 0
                    ? `Resend available in ${emailCooldown}s`
                    : "Resend verification email"}
                </Button>
                <button
                  type="button"
                  onClick={() => setPendingVerificationEmail(null)}
                  className="text-xs font-mono text-[#64748b] hover:text-[#171717] px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Password Change Section */}
      <div className="bg-white rounded-lg border border-[#ebebeb] p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#171717]">Change Password</h2>
          <p className="text-xs text-[#666666] mt-0.5">
            Update your account password. Must be at least 10 characters.
          </p>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label htmlFor="currentPassword" className="block text-xs font-medium text-[#171717]">
              Current Password
            </label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isChangingPassword}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="block text-xs font-medium text-[#171717]">
              New Password
            </label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isChangingPassword}
              required
            />
            <div className="text-[11px] font-mono space-y-1 pt-1">
              <div
                className={`flex items-center gap-1.5 ${
                  newPassword.length >= 10 ? "text-[#16a34a]" : "text-[#8f8f8f]"
                }`}
              >
                <Check className="w-3 h-3" />
                <span>At least 10 characters long ({newPassword.length}/10)</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-[#171717]">
              Confirm New Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isChangingPassword}
              required
            />
          </div>

          <Button
            type="submit"
            isLoading={isChangingPassword}
            disabled={
              !currentPassword ||
              newPassword.length < 10 ||
              newPassword !== confirmPassword ||
              isChangingPassword
            }
          >
            <KeyRound className="w-3.5 h-3.5 mr-1.5" />
            Update Password
          </Button>
        </form>
      </div>

      {/* Active Devices & Sessions */}
      <div className="bg-white rounded-lg border border-[#ebebeb] p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#171717]">Active Sessions & Devices</h2>
            <p className="text-xs text-[#666666] mt-0.5">
              Current browser and active authorized sessions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSignOutCurrent}
              isLoading={isSigningOutCurrent}
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5 text-[#dc2626]" />
              Sign Out of Current Session
            </Button>
            <Button
              variant="secondary"
              onClick={handleSignOutOthers}
              isLoading={isSigningOutOthers}
            >
              <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
              Sign Out Other Devices
            </Button>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {/* Current Device */}
          <div className="p-3.5 rounded border border-[#ebebeb] bg-[#fafafa] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Laptop className="w-4 h-4 text-[#171717]" />
              <div>
                <p className="text-xs font-medium text-[#171717]">
                  Windows PC · Chrome Browser
                </p>
                <p className="text-[10px] font-mono text-[#8f8f8f]">
                  Active right now · Current session
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#ebebeb] text-[#171717] font-medium">
                This Device
              </span>
              <button
                type="button"
                onClick={handleSignOutCurrent}
                aria-label="Sign out of this device"
                className="text-xs font-mono text-[#dc2626] hover:underline px-1.5 py-0.5"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Secondary Device */}
          <div className="p-3.5 rounded border border-[#ebebeb] bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-[#666666]" />
              <div>
                <p className="text-xs font-medium text-[#171717]">
                  Mobile Browser · iOS Safari
                </p>
                <p className="text-[10px] font-mono text-[#8f8f8f]">
                  Last active 3 hours ago
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#8f8f8f]">
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="bg-white rounded-lg border border-[#f87171]/40 p-6 sm:p-8 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-[#fef2f2] text-[#dc2626]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#dc2626]">Danger Zone</h2>
            <p className="text-xs text-[#666666] mt-0.5">
              Permanently delete your account and all associated repository sessions, messages, documents, and innovation blueprints.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-start">
          <Button
            variant="danger"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Permanently Delete Account"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded bg-[#fef2f2] border border-[#fecaca] text-xs text-[#991b1b] space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>This action cannot be undone.</span>
            </p>
            <p className="leading-relaxed">
              Deleting your account will permanently remove all your saved repository sessions, chat history, generated specifications (PRD, TRD, TDD), and blueprints via database cascade.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirm-email"
              className="block text-xs font-medium text-[#171717]"
            >
              To confirm, please type your email address:{" "}
              <span className="font-mono font-semibold">{userEmail}</span>
            </label>
            <Input
              id="confirm-email"
              value={typedConfirmEmail}
              onChange={(e) => setTypedConfirmEmail(e.target.value)}
              placeholder={userEmail}
              disabled={isDeletingAccount}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ebebeb]">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeletingAccount}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={!isDeleteConfirmed || isDeletingAccount}
              isLoading={isDeletingAccount}
            >
              Permanently Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AccountSettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-mono text-[#8f8f8f]">Loading account settings...</div>}>
      <AccountSettingsContent />
    </Suspense>
  );
}
