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
  ShieldCheck,
  CheckCircle2,
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
  const [passcode, setPasscode] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verifiedEmailOverride, setVerifiedEmailOverride] = useState<string | null>(null);
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
    if (!newEmail.trim()) return;

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
          message: data?.error?.message || "Could not process email change request.",
          type: "error",
        });
        return;
      }

      setPendingVerificationEmail(newEmail.trim());
      setEmailCooldown(0);
      toast({
        title: "Verification email sent",
        message: `We sent a confirmation link & 6-digit passcode to ${newEmail.trim()}. Please verify your address.`,
        type: "info",
      });
    } catch (err: unknown) {
      toast({
        title: "Email update failed",
        message: err instanceof Error ? err.message : "Error contacting server.",
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
          message: data?.error?.message || "Could not resend verification email.",
          type: "error",
        });
        return;
      }

      setEmailCooldown(60);
      toast({
        title: "Verification email resent",
        message: `New verification link and passcode sent to ${pendingVerificationEmail}. Please check your inbox and Spam folder.`,
        type: "info",
      });
    } catch (err: unknown) {
      toast({
        title: "Resend failed",
        message: err instanceof Error ? err.message : "Error contacting server.",
        type: "error",
      });
    } finally {
      setIsResendingEmail(false);
    }
  }

  async function handleVerifyPasscode() {
    if (!passcode.trim()) return;

    setIsVerifyingCode(true);
    try {
      const res = await fetch("/api/account/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: passcode.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast({
          title: "Passcode verification failed",
          message: data?.error?.message || "Invalid or expired 6-digit passcode.",
          type: "error",
        });
        return;
      }

      const verified = data.newEmail || pendingVerificationEmail;
      setVerifiedEmailOverride(verified);
      setPendingVerificationEmail(null);
      setPasscode("");
      setNewEmail("");

      toast({
        title: "Email verified & updated",
        message: `Your primary email address is now ${verified}.`,
        type: "success",
      });
    } catch (err: unknown) {
      toast({
        title: "Verification failed",
        message: err instanceof Error ? err.message : "Error contacting server.",
        type: "error",
      });
    } finally {
      setIsVerifyingCode(false);
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

  const userEmail = verifiedEmailOverride || confirmedEmailParam || user?.email || "developer@repopilot.local";
  const isDeleteConfirmed = typedConfirmEmail.trim().toLowerCase() === userEmail.toLowerCase();

  return (
    <div className="space-y-6">
      {/* Email Section */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-6 sm:p-8 space-y-5 transition-all">
        <div>
          <h2 className="text-base font-bold text-neutral-900">Account Email</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Your primary email address is used for authentication and security alerts.
          </p>
        </div>

        <form onSubmit={handleEmailChange} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-900">
              Current Email
            </label>
            <div className="flex items-center gap-2">
              <Input value={userEmail} disabled className="bg-neutral-50/70 border-neutral-200 text-neutral-800" />
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 font-semibold shadow-2xs">
                <Check className="w-3 h-3" />
                <span>Verified</span>
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="newEmail" className="block text-xs font-medium text-neutral-900">
              New Email Address
            </label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="name@company.com"
              disabled={isRequestingEmail}
              className="rounded-xl border-neutral-300 focus:border-neutral-900"
            />
          </div>

          <Button
            type="submit"
            variant="secondary"
            disabled={!newEmail.trim() || isRequestingEmail}
            isLoading={isRequestingEmail}
            className="rounded-xl border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-900 font-semibold"
          >
            Update Email Address
          </Button>

          {pendingVerificationEmail && (
            <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/70 space-y-4 shadow-xs animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-neutral-900">
                    Verification email dispatched to {pendingVerificationEmail}
                  </p>
                  <p className="text-[11px] text-neutral-600 leading-relaxed">
                    Click the link in the email, or enter the <strong>6-digit verification passcode</strong> from the email below to complete verification.
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    💡 Check your <strong>Spam / Junk</strong> folder. If you sent the verification to your own sender Gmail, also check <strong>All Mail</strong> or <strong>Sent</strong>.
                  </p>
                </div>
              </div>

              {/* 6-Digit Passcode Input Box (styled after code.html passcode box) */}
              <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center space-y-2.5 shadow-2xs">
                <label htmlFor="email-passcode" className="block text-[11px] font-mono uppercase tracking-widest text-neutral-500 font-semibold">
                  Verification Passcode:
                </label>
                <div className="flex items-center justify-center gap-2">
                  <input
                    id="email-passcode"
                    type="text"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="e.g. 849-216"
                    className="font-mono text-base font-bold tracking-widest text-neutral-900 bg-neutral-50/50 px-4 py-2 border border-neutral-300 rounded-xl shadow-2xs text-center max-w-[180px] focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
                    disabled={isVerifyingCode}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyPasscode}
                    disabled={!passcode.trim() || isVerifyingCode}
                    className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md transition-all disabled:opacity-50"
                  >
                    {isVerifyingCode ? "Verifying..." : "Verify Code"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-neutral-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Resend verification email"
                  onClick={handleResendVerificationEmail}
                  disabled={isResendingEmail || emailCooldown > 0}
                  isLoading={isResendingEmail}
                  className="bg-white text-xs font-mono rounded-xl border-neutral-300 hover:bg-neutral-50"
                >
                  {emailCooldown > 0
                    ? `Resend available in ${emailCooldown}s`
                    : "Resend verification email"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingVerificationEmail(null);
                    setPasscode("");
                  }}
                  className="text-xs font-mono text-neutral-500 hover:text-neutral-900 px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Password Change Section */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-6 sm:p-8 space-y-5 transition-all">
        <div>
          <h2 className="text-base font-bold text-neutral-900">Change Password</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Update your account password. Must be at least 10 characters.
          </p>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label htmlFor="currentPassword" className="block text-xs font-medium text-neutral-900">
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
              className="rounded-xl border-neutral-300 focus:border-neutral-900"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="block text-xs font-medium text-neutral-900">
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
              className="rounded-xl border-neutral-300 focus:border-neutral-900"
            />
            <div className="text-[11px] font-mono space-y-1 pt-1">
              <div
                className={`flex items-center gap-1.5 ${
                  newPassword.length >= 10 ? "text-emerald-600 font-medium" : "text-neutral-400"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>At least 10 characters long ({newPassword.length}/10)</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-neutral-900">
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
              className="rounded-xl border-neutral-300 focus:border-neutral-900"
            />
          </div>

          <button
            type="submit"
            disabled={
              !currentPassword ||
              newPassword.length < 10 ||
              newPassword !== confirmPassword ||
              isChangingPassword
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isChangingPassword ? "Updating..." : "Update Password"}</span>
          </button>
        </form>
      </div>

      {/* Active Devices & Sessions */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-6 sm:p-8 space-y-5 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Active Sessions &amp; Devices</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Current browser and active authorized sessions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSignOutCurrent}
              isLoading={isSigningOutCurrent}
              className="rounded-xl border-neutral-300 hover:border-red-300 hover:bg-red-50 text-neutral-800"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5 text-red-600" />
              Sign Out of Current Session
            </Button>
            <Button
              variant="secondary"
              onClick={handleSignOutOthers}
              isLoading={isSigningOutOthers}
              className="rounded-xl border-neutral-300 hover:bg-neutral-50 text-neutral-800"
            >
              <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-neutral-600" />
              Sign Out Other Devices
            </Button>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {/* Current Device */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-900">
                  Windows PC · Chrome Browser
                </p>
                <p className="text-[10px] font-mono text-neutral-500">
                  Active right now · Current session
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-900 font-semibold shadow-2xs">
                This Device
              </span>
              <button
                type="button"
                onClick={handleSignOutCurrent}
                aria-label="Sign out of this device"
                className="text-xs font-mono text-red-600 hover:underline px-2 py-0.5"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Secondary Device */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center border border-neutral-200">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-900">
                  Mobile Browser · iOS Safari
                </p>
                <p className="text-[10px] font-mono text-neutral-500">
                  Last active 3 hours ago
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="bg-white rounded-2xl border border-red-200 p-6 sm:p-8 space-y-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-red-700">Danger Zone</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Permanently delete your account and all associated repository sessions, messages, documents, and innovation blueprints.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-start">
          <Button
            variant="danger"
            onClick={() => setIsDeleteModalOpen(true)}
            className="rounded-xl shadow-xs"
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
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
              <span>This action cannot be undone.</span>
            </p>
            <p className="leading-relaxed text-red-800">
              Deleting your account will permanently remove all your saved repository sessions, chat history, generated specifications (PRD, TRD, TDD), and blueprints via database cascade.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirm-email"
              className="block text-xs font-medium text-neutral-900"
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
              className="rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeletingAccount}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={!isDeleteConfirmed || isDeletingAccount}
              isLoading={isDeletingAccount}
              className="rounded-xl"
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
    <Suspense fallback={<div className="p-8 text-xs font-mono text-neutral-400">Loading account settings...</div>}>
      <AccountSettingsContent />
    </Suspense>
  );
}
