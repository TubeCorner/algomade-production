"use client";

import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "default",
  size = "md",
  className = "",
  ...props
}) => {
  const base =
    "px-4 py-2 rounded font-medium transition focus:outline-none";

  const variantClass =
    variant === "outline"
      ? "border border-gray-300 text-gray-700 hover:bg-gray-100"
      : variant === "secondary"
      ? "bg-gray-700 text-white hover:bg-gray-600"
      : "bg-blue-600 text-white hover:bg-blue-700";

  const sizeClass =
    size === "sm"
      ? "text-sm"
      : size === "lg"
      ? "text-lg"
      : "text-base";

  return (
    <button
      className={`${base} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
