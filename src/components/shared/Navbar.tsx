"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import ToolsDropdown from "@/components/shared/ToolsDropdown";


export default function Navbar() {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // ?? Add shadow and blur when scrolling
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = () => setMenuOpen(false);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0F172A]/90 backdrop-blur-md border-b border-white/10 shadow-lg shadow-blue-500/5"
          : "bg-[#0F172A]/80 border-b border-white/10"
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* ?? Logo */}
        <Link
  href="/"
  className="flex items-center gap-3"
  onClick={handleLinkClick}
>
  <div className="relative w-8 h-8">
    <Image
      src="/algomade-logo.png"
      alt="AlgoMade Logo"
      fill
      className="object-contain"
      priority
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  </div>
  <span className="text-xl font-bold text-white tracking-wide select-none">
    AlgoMade
  </span>
</Link>

        {/* ?? Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            onClick={handleLinkClick}
            className="text-gray-300 hover:text-white text-sm transition"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            onClick={handleLinkClick}
            className="text-gray-300 hover:text-white text-sm transition"
          >
            Dashboard
          </Link>
          <Link
            href="/pricing"
            onClick={handleLinkClick}
            className="text-gray-300 hover:text-white text-sm transition"
          >
            Pricing
          </Link>
<ToolsDropdown />
          {/* ?? Auth Buttons */}
          {status === "authenticated" && session?.user ? (
            <button
              onClick={() => signOut()}
              className="px-4 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
            >
              Sign In
            </button>
          )}
        </div>

        {/* ?? Mobile Hamburger */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* ?? Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-[#0F172A]/95 border-t border-white/10 px-6 py-4 space-y-4 text-center">
          {["Home", "Dashboard", "Pricing"].map((page) => (
            <Link
              key={page}
              href={`/${page.toLowerCase() === "home" ? "" : page.toLowerCase()}`}
              onClick={handleLinkClick}
              className="block text-gray-300 hover:text-white text-base transition"
            >
              {page}
            </Link>
          ))}

          {status === "authenticated" ? (
            <button
              onClick={() => {
                signOut();
                handleLinkClick();
              }}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => {
                signIn("google");
                handleLinkClick();
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Sign In with Google
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
