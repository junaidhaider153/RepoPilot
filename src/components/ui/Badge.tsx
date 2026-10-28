import React from "react";
import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "muted" | "success" | "warning";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono leading-none tracking-tight",
        {
          "bg-[#f0f0f0] text-[#171717] border border-[#ebebeb]": variant === "default",
          "bg-[#fafafa] text-[#8f8f8f] border border-[#ebebeb]": variant === "muted",
          "bg-[#eaf5ed] text-[#297a3a] border border-[#b7dfbf]": variant === "success",
          "bg-[#fff9e6] text-[#7d5700] border border-[#fae29c]": variant === "warning",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
