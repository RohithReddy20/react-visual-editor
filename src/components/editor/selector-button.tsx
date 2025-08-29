import React from "react";

interface SelectorButtonProps {
  isSelecting: boolean;
  onToggle: () => void;
}

export default function SelectorButton({
  isSelecting,
  onToggle,
}: SelectorButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        px-4 py-2 text-sm font-medium rounded-md border transition-all duration-200
        ${
          isSelecting
            ? "bg-blue-600 text-white border-blue-600 shadow-md"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
        }
      `}
      title={isSelecting ? "Exit selector mode" : "Enter selector mode"}
    >
      <div className="flex items-center space-x-2">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 7l5-5 5 5" />
          <path d="M8 2v10" />
          <path d="M21 17l-5 5-5-5" />
          <path d="M16 22V12" />
        </svg>
        <span>{isSelecting ? "Exit Selector" : "Select Element"}</span>
      </div>
    </button>
  );
}
