import React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModelBadgeProps {
  modelName?: string;
  className?: string;
}

export function ModelBadge({
  modelName = "gemini-flash-lite-latest",
  className,
}: ModelBadgeProps) {
  return (
    <div
      title={`AI Provider Active Model: ${modelName}`}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#ebebeb] bg-[#fafafa] text-[11px] font-mono text-[#666666] select-none",
        className
      )}
    >
      <Sparkles className="w-3 h-3 text-[#171717]" aria-hidden="true" />
      <span className="hidden sm:inline text-[#8f8f8f]">model:</span>
      <span className="text-[#171717] font-medium truncate max-w-[150px]">{modelName}</span>
    </div>
  );
}

