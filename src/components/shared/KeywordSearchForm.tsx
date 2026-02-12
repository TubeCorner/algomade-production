// src/components/KeywordSearchForm.tsx
'use client';

import { useState, FormEvent } from 'react';

// Define a type for the data structure you expect
interface KeywordResult {
    keyword: string;
    searchVolume: number;
    competition: string;
}

export default function KeywordSearchForm() {
  const [keyword, setKeyword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<KeywordResult[]>([]); // State to store results

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setIsLoading(true);
    setResults([]); // Clear old results

    try {
        const response = await fetch(`/api/keyword?keyword=${encodeURIComponent(keyword)}`);
        
        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        setResults(data.data || []); // Save the data from the API route

    } catch (error) {
        console.error("Failed to fetch keyword data:", error);
        alert("Search failed. Check console for error details.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div>
        <form onSubmit={handleSubmit} className="flex gap-4 bg-gray-800 p-6 rounded-xl shadow-lg">
        <input
            type="text"
            placeholder="Enter your YouTube keyword (e.g., 'how to grow channel')"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            disabled={isLoading}
            className="flex-grow p-4 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <button
            type="submit"
            disabled={isLoading}
            className={`px-8 py-4 font-bold rounded-lg transition duration-200 ${
            isLoading
                ? 'bg-red-800 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 shadow-md'
            }`}
        >
            {isLoading ? 'Searching...' : 'Search Keyword'}
        </button>
        </form>

        {/* Display Results Here (Move this logic to a separate component later) */}
        {results.length > 0 && (
            <div className="mt-8 p-6 bg-gray-800 rounded-xl">
                <h4 className="text-xl font-semibold mb-4 text-red-400">Related Keywords Found ({results.length})</h4>
                <ul className="space-y-3">
                    {results.map((item, index) => (
                        <li key={index} className="flex justify-between p-3 bg-gray-700 rounded-lg">
                            <span className="font-medium">{item.keyword}</span>
                            <div className="text-sm text-gray-400">
                                Volume: <span className="text-red-300 font-bold">{item.searchVolume.toLocaleString()}</span> | 
                                Competition: <span className="text-red-300 font-bold">{item.competition}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
  );
}



