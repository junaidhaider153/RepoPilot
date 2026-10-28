"use client";

import React from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: string;
  label: string;
  status: "pending" | "active" | "completed";
}

export interface ProgressStepperProps {
  steps: StepItem[];
  className?: string;
}

export function ProgressStepper({ steps, className }: ProgressStepperProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "p-4 rounded border border-[#ebebeb] bg-white space-y-3 font-mono text-xs",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-[#ebebeb] pb-2">
        <span className="text-[11px] uppercase tracking-wider text-[#8f8f8f] font-semibold">
          Pipeline Execution
        </span>
        <span className="text-[11px] text-[#666666]">
          Gemma 2 Architecture Grounding
        </span>
      </div>

      <div className="space-y-2">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center gap-2.5">
            {step.status === "completed" && (
              <div className="w-4 h-4 rounded-full bg-[#16a34a] text-white flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            )}
            {step.status === "active" && (
              <div className="w-4 h-4 rounded-full bg-white border border-[#171717] flex items-center justify-center shrink-0">
                <Loader2 className="w-2.5 h-2.5 animate-spin text-[#171717]" />
              </div>
            )}
            {step.status === "pending" && (
              <div className="w-4 h-4 rounded-full border border-[#d4d4d4] bg-[#fafafa] flex items-center justify-center shrink-0 text-[9px] text-[#8f8f8f]">
                {idx + 1}
              </div>
            )}

            <span
              className={cn(
                "transition-colors",
                step.status === "completed" && "text-[#171717] font-medium",
                step.status === "active" && "text-[#171717] font-semibold",
                step.status === "pending" && "text-[#8f8f8f]"
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

