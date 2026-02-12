"use client";

import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "default",
  size = "md",
  className,
  ...props
}) => {
  let base = "px-4 py-2 rounded font-medium transition";
  let variantClass = variant === "outline" ? "border border-gray-300" : "bg-blue-600 text-white";
  let sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";

  return (
    <button className={`${base} ${variantClass} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  );
};



