// src/components/SignOutButton.tsx
'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: '/' })} 
      className="px-8 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition duration-200"
    >
      Sign Out
    </button>
  );
}



