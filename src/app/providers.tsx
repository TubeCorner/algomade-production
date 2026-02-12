// src/app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';

// Define a type for children prop for TypeScript compatibility
interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}



