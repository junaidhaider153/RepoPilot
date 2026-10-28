"use client";

import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id: customId,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-mono uppercase tracking-wider text-[#666666]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-[#8f8f8f] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              "w-full text-sm font-mono px-3 py-2 bg-white border rounded text-[#171717] placeholder-[#a8a8a8] transition-colors focus:outline-none disabled:bg-[#fafafa] disabled:text-[#8f8f8f] disabled:cursor-not-allowed",
              error
                ? "border-[#dc2626] focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626]"
                : "border-[#ebebeb] focus:border-[#171717] focus:ring-1 focus:ring-[#171717]",
              leftIcon ? "pl-9" : "",
              rightIcon ? "pr-9" : "",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-[#8f8f8f] flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-[#dc2626] font-mono">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-[#8f8f8f] font-mono">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
