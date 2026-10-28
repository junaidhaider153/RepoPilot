import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangular" | "circular" | "text";
}

export function Skeleton({
  className,
  variant = "rectangular",
  ...props
}: SkeletonProps) {
  const variantStyles = {
    rectangular: "rounded",
    circular: "rounded-full",
    text: "rounded h-4 w-full",
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-[#ebebeb]/70",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

