"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit" | "reset";
}

export function Button({
  children,
  onClick,
  disabled,
  className = "",
  variant = "primary",
  size = "md",
  type = "button",
}: ButtonProps) {
  const baseStyles =
    "font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105";

  const variants = {
    primary:
      "bg-[#2dc653] hover:bg-[#27a647] text-white disabled:bg-gray-400 active:scale-95",
    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:bg-gray-300",
    outline:
      "border-2 border-[#2dc653] text-[#2dc653] hover:bg-[#2dc653] hover:text-white disabled:border-gray-400 active:scale-95",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
