// src/providers/SupabaseProvider.tsx
"use client";

import { createContext, useContext } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

const SupabaseContext = createContext<any>(null);

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = supabaseBrowser();

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }
  return context;
};
