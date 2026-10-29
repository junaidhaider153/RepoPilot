import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  inverted?: boolean;
  className?: string;
  badgeClassName?: string;
}

export function BrandLogo({
  size = "md",
  showWordmark = true,
  inverted = false,
  className,
  badgeClassName,
}: BrandLogoProps) {
  const sizeMap = {
    xs: { box: "w-5 h-5", img: 20, text: "text-xs" },
    sm: { box: "w-6 h-6", img: 24, text: "text-xs font-bold" },
    md: { box: "w-8 h-8", img: 32, text: "text-sm font-bold" },
    lg: { box: "w-10 h-10", img: 40, text: "text-base font-bold" },
    xl: { box: "w-14 h-14", img: 56, text: "text-xl font-extrabold" },
  };

  const current = sizeMap[size];

  return (
    <div className={cn("inline-flex items-center gap-2 select-none", className)}>
      <div
        className={cn(
          "rounded-xl bg-white p-0.5 flex items-center justify-center shadow-2xs overflow-hidden border border-neutral-200 shrink-0",
          current.box,
          badgeClassName
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/icon.jpg"
          alt="RepoPilot Robot Icon"
          className="w-full h-full object-contain rounded-lg"
        />
      </div>

      {showWordmark && (
        <span
          className={cn(
            "tracking-tight leading-none",
            current.text,
            inverted ? "text-white" : "text-neutral-900"
          )}
        >
          RepoPilot
        </span>
      )}
    </div>
  );
}

export function BrandFullLogo({
  className,
  width = 160,
  height = 50,
}: {
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <div className={cn("inline-flex items-center select-none", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo.jpg"
        alt="RepoPilot Logo"
        width={width}
        height={height}
        className="object-contain"
      />
    </div>
  );
}
