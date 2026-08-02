"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
}

export function AuthInput({
  label,
  icon: Icon,
  type = "text",
  className = "",
  ...props
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.1em] text-[#263c32]">
        {label}
      </span>
      <span className="relative block">
        <Icon
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          {...props}
          type={isPassword ? (showPassword ? "text" : "password") : type}
          className={`h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-semibold text-gray-900 outline-none transition placeholder:font-medium placeholder:text-gray-400 hover:border-gray-300 focus:border-[#2b8053] focus:ring-4 focus:ring-[#2b8053]/10 ${isPassword ? "pr-12" : ""} ${className}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#246b48]"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </span>
    </label>
  );
}
