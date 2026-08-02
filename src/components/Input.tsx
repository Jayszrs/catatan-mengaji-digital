"use client";

import { InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  placeholder?: string;
}

export function Input({
  label,
  error,
  placeholder,
  className = "",
  type = "text",
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-gray-800 mb-3">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          type={isPassword ? (showPassword ? "text" : "password") : type}
          placeholder={placeholder}
          className={`w-full px-5 py-3 border-2 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2dc653] focus:border-transparent transition-all shadow-sm font-medium ${
            error 
              ? "border-red-500 focus:ring-red-500 placeholder-red-300" 
              : "border-gray-200 hover:border-gray-300 placeholder-gray-400 focus:border-[#2dc653]"
          } ${isPassword ? "pr-12" : ""} ${className}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
