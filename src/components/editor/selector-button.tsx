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
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
        isSelecting
          ? "shadow-lg hover:shadow-xl active:scale-95"
          : "shadow-md hover:shadow-lg active:scale-95"
      }`}
      style={{
        backgroundColor: isSelecting ? 'var(--accent)' : 'var(--panel-bg)',
        border: `1px solid ${isSelecting ? 'var(--accent)' : 'var(--border)'}`,
        color: isSelecting ? 'white' : 'var(--text-primary)'
      }}
      title={isSelecting ? "Exit selector mode" : "Enter selector mode"}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        {isSelecting ? (
          <path d="M18 6 6 18M6 6l12 12"/>
        ) : (
          <path d="M9 12 7 10l-2 2 2 2 2-2Zm0 0 6-6"/>
        )}
      </svg>
      <span>{isSelecting ? "Exit Selector" : "Select Element"}</span>
    </button>
  );
}
