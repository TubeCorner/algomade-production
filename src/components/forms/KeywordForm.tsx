"use client";

import { useState } from "react";

interface KeywordFormProps {
  onSubmit: (keywords: string[]) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export default function KeywordForm({
  onSubmit,
  isLoading = false,
  placeholder = "Enter keywords separated by commas",
}: KeywordFormProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keywords = inputValue
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keywords.length > 0) {
      onSubmit(keywords);
      setInputValue("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full max-w-lg">
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="border rounded-md p-2 w-full min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="bg-blue-600 text-white rounded-md px-4 py-2 disabled:opacity-50"
      >
        {isLoading ? "Saving..." : "Save Keywords"}
      </button>
    </form>
  );
}
