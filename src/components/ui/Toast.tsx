"use client";

import React, { createContext, useContext, useState, useCallback, useId } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title?: string;
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  action?: ToastAction;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: () => {},
      dismiss: () => {},
    };
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, message, type = "info", duration = 4000, action }: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, title, message, type, duration, action };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast container fixed bottom-right */}
      <div
        role="region"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className="pointer-events-auto bg-white border border-[#ebebeb] rounded p-3 shadow-sm flex items-start gap-3 transition-all animate-fadeIn"
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && (
                <CheckCircle2 className="w-4 h-4 text-[#297a3a]" aria-hidden="true" />
              )}
              {t.type === "error" && (
                <AlertCircle className="w-4 h-4 text-[#dc2626]" aria-hidden="true" />
              )}
              {t.type === "info" && (
                <Info className="w-4 h-4 text-[#171717]" aria-hidden="true" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {t.title && (
                <h5 className="text-xs font-semibold text-[#171717]">{t.title}</h5>
              )}
              <p className="text-xs text-[#4d4d4d] leading-relaxed break-words">
                {t.message}
              </p>
              {t.action && (
                <button
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className="mt-1.5 text-xs font-mono font-medium text-[#171717] underline hover:text-black transition-colors"
                >
                  {t.action.label}
                </button>
              )}
            </div>

            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="p-1 text-[#8f8f8f] hover:text-[#171717] rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

