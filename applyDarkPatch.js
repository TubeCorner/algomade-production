import fs from "fs";
const file = "src/components/dashboard/KeywordList.tsx";

let text = fs.readFileSync(file, "utf8");

// Perform replacements
text = text
  .replace('<div className="overflow-x-auto">', '<div className="overflow-x-auto text-gray-100 dark:text-gray-100">')
  .replace('<table className="min-w-full border rounded text-sm">', '<table className="min-w-full text-sm rounded border border-white/10 dark:border-white/10 bg-[#0F172A]/60 dark:bg-[#0F172A]/60 backdrop-blur-sm">')
  .replace('<thead className="bg-gray-100 border-b">', '<thead className="border-b border-white/10 bg-[#1E293B]/70 dark:bg-[#1E293B]/70 text-gray-300">')
  .replace(/className={`\$\{idx % 2 === 0 \? "bg-white" : "bg-gray-50"\} hover:bg-gray-100 transition`}/g,
           'className={`${idx % 2 === 0 ? "bg-[#1E293B]/40" : "bg-[#0F172A]/40"} hover:bg-[#334155]/60 transition`}')
  .replace(/<td colSpan=\{bulkMode \? 7 : 6\} className="text-center py-6 text-gray-400">[\s\S]*?<\/td>/,
           `<td colSpan={bulkMode ? 7 : 6} className="py-12 text-center">
  <div className="flex flex-col items-center justify-center space-y-3 text-gray-300">
    <span className="text-2xl animate-pulse text-indigo-400">🔍</span>
    <p>No keywords to display.</p>
    <p className="text-xs text-gray-500"><strong>Keyword Tools</strong> above to add or generate new ones.</p>
  </div>
</td>`);

fs.writeFileSync(file, text, "utf8");
console.log("✅ Dark theme patch applied successfully!");
