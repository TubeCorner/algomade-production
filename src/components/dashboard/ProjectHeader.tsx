"use client";

interface ProjectHeaderProps {
  selectedProject?: string;
  onDeleteProject?: () => void;
  loadingDelete?: boolean;
}

export default function ProjectHeader({
  selectedProject,
  onDeleteProject,
  loadingDelete = false,
}: ProjectHeaderProps) {
  return (
    <div className="bg-white border rounded-lg shadow-sm p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Left Section — Project Info */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          📁 Project Dashboard
        </h2>
        <p className="text-sm text-gray-500">
          {selectedProject
            ? `Project ID: ${selectedProject}`
            : "No project selected"}
        </p>
      </div>

      {/* Right Section — Delete Project */}
      <div className="flex justify-end w-full sm:w-auto">
        <button
          onClick={onDeleteProject}
          disabled={loadingDelete}
          className={`bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 transition flex items-center gap-2 ${
            loadingDelete ? "cursor-not-allowed opacity-70" : ""
          }`}
        >
          {loadingDelete ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-red-700"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                ></path>
              </svg>
              Deleting…
            </>
          ) : (
            "Delete Project"
          )}
        </button>
      </div>
    </div>
  );
}
