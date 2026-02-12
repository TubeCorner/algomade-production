"use client";

import { ReactNode } from "react";

interface AvatarProps {
  children?: ReactNode;
}

export function Avatar({ children }: AvatarProps) {
  return (
    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
      {children}
    </div>
  );
}

export function AvatarFallback({ children }: AvatarProps) {
  return <>{children}</>;
}



