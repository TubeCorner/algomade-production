'use client';

import React, { useState, useCallback } from 'react';
import { Loader2, Zap, CheckCircle2, AlertTriangle, List } from 'lucide-react';

// Define the shape of the data that the API returns upon successful saving
interface KeywordProject {
    id: string;
    search_keyword: string;
    // The keywords are nested inside an object, as returned by the LLM
    generated_keywords: { keywords: string[] }; 
    created_at: string;
    user_id: string;
}

const KeywordGenerator: React.FC = () => {
    const [inputTopic, setInputTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // We now store the entire saved project object in state
    const [generatedProject, setGeneratedProject] = useState<KeywordProject | null>(null); 
    const [error, setError] = useState<string | null>(null);

    // Utility to get the array of keywords from the nested structure
    const getKeywordsArray = useCallback((project: KeywordProject): string[] => {
        // NOTE: The structure expected here should ideally be an array of objects
        // but the current API returns a potentially nested structure like { keywords: [...] } 
        // We'll rely on the API to return the generated data directly for display, 
        // but the save process relies on the API file logic.
        
        // This logic is slightly adjusted to handle the array of keyword objects coming from the API route's structure.
        // The API output is expected to be an array of objects: 
        // [{"keyword": "...", "volume": 4000, "competition": "Low"}, ...]
        
        // This component expects the 'generated_keywords' to be the saved JSONB data (the array of objects).
        
        if (project.generated_keywords && Array.isArray(project.generated_keywords)) {
            // Map the array of objects to an array of just the keyword strings for display
            return project.generated_keywords.map((item: any) => item.keyword || item.search_keyword).filter(Boolean);
        }
        
        // Fallback or handling for old/mock data structure
        if (project.generated_keywords && Array.isArray((project.generated_keywords as any).keywords)) {
             return (project.generated_keywords as any).keywords;
        }

        return [];
    }, []);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setGeneratedProject(null); // Reset the project state

        if (!inputTopic.trim()) {
            setError('Please enter a topic before generating keywords.');
            return;
        }

        setIsLoading(true);

        try {
            // FIX: Changed URL from '/api/save-keywords' to the correct API file: '/api/generate-keywords'
            const response = await fetch('/api/generate-keywords', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // CRITICAL: This sends the required payload
                body: JSON.stringify({ searchKeyword: inputTopic.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                // API Error Handling
                const apiError = data.message || `API Error: Status ${response.status}`;
                setError(apiError);
                console.error("API call failed:", apiError, data);
                
                // Specific RLS error check remains helpful
                if (response.status === 500 && apiError.includes('row-level security')) {
                     setError("Save failed: Security policy error. Please check Supabase RLS.");
                }
                return;
            }
            
            // Success! The API returns the keywords array directly, not the saved project object.
            // Update: The API handler 'pages/api/generate-keywords.js' returns:
            // return res.status(200).json({ keywords: generatedKeywords, saved: true });
            
            // We need to match the type expected by the KeywordProject interface, 
            // but for now, we'll ensure we get the display data.
            
            // Reconstruct a mock project object for display purposes
            const mockProject: KeywordProject = {
    id: 'mock-id',
    search_keyword: inputTopic.trim(),
    generated_keywords: { keywords: data.keywords },   // FIXED
    created_at: new Date().toISOString(),
    user_id: 'mock-user-id',
};

            
            setGeneratedProject(mockProject);
            // Clear the input field after success
            setInputTopic(''); 

        } catch (err) {
            console.error('Network or parsing error:', err);
            setError('A network or internal error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const keywords = generatedProject ? getKeywordsArray(generatedProject) : [];

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-2xl rounded-xl border border-gray-200">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-6 flex items-center">
                <Zap className="w-6 h-6 mr-3 text-indigo-500" />
                AI Keyword Generator
            </h2>

            {/* Keyword Input Form */}
            <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-4 mb-8">
                <input
                    type="text"
                    value={inputTopic}
                    onChange={(e) => setInputTopic(e.target.value)}
                    placeholder="Enter your video topic (e.g., 'Best solar panel kits 2024')"
                    className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base shadow-sm"
                    disabled={isLoading}
                    required
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <List className="w-5 h-5 mr-2" />
                            Generate & Save
                        </>
                    )}
                </button>
            </form>

            {/* Loading/Error/Success Status */}
            {(error || generatedProject) && (
                <div className="mb-8 p-4 rounded-lg">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {generatedProject && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                            <div className="flex items-center mb-2">
                                <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
                                <p className="font-semibold text-lg">Project Saved Successfully!</p>
                            </div>
                            <p className="text-sm text-green-800">
                                **Topic:** {generatedProject.search_keyword}
                            </p>
                        </div>
                    )}
                </div>
            )}
            
            {/* Display Generated Keywords */}
            {keywords.length > 0 && (
                 <div className="mt-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Generated Keywords</h3>
                    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                        <p className="font-medium text-gray-700 mb-2">
                            Keywords for: **{generatedProject?.search_keyword}**
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {keywords.map((keyword, index) => (
                                <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full shadow-sm">
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>
                 </div>
            )}

            {/* Note about Saved Projects component */}
            <div className="mt-8 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                    *The full list of saved projects will appear below once you implement the **`SavedProjects`** component.*
                </p>
            </div>
        </div>
    );
};

export default KeywordGenerator;



