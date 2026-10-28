"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none";

    const variantStyles = {
      primary:
        "bg-[#171717] text-white hover:bg-[#000000] active:bg-[#262626] border border-transparent shadow-sm",
      secondary:
        "bg-white text-[#171717] border border-[#ebebeb] hover:bg-[#fafafa] active:bg-[#f2f2f2]",
      ghost:
        "bg-transparent text-[#666666] hover:text-[#171717] hover:bg-[#fafafa] active:bg-[#f2f2f2]",
      danger:
        "bg-white text-[#dc2626] border border-[#fecaca] hover:bg-[#fef2f2] active:bg-[#fee2e2]",
      outline:
        "bg-transparent text-[#171717] border border-[#171717] hover:bg-[#fafafa]",
    };

    const sizeStyles = {
      sm: "text-xs h-7 px-2.5 gap-1.5",
      md: "text-xs sm:text-sm h-9 px-3.5 gap-2",
      lg: "text-sm h-10 px-5 gap-2.5",
      icon: "h-8 w-8 p-0 gap-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

