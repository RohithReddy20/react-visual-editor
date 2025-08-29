import React, { useRef, useEffect, useCallback } from "react";
import * as ReactDOM from "react-dom/client";

interface PreviewProps {
  compiledCode: string;
  error?: string;
}

export default function Preview({ compiledCode, error }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<ReactDOM.Root | null>(null);

  const renderComponent = useCallback(() => {
    if (!containerRef.current) return;

    // Clean up previous root
    if (rootRef.current) {
      try {
        rootRef.current.unmount();
        rootRef.current = null;
      } catch (e) {
        console.warn("Failed to unmount previous root:", e);
      }
    }

    // Clear container
    containerRef.current.innerHTML = "";

    if (error) {
      containerRef.current.innerHTML = `
        <div style="color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 6px; font-family: monospace; white-space: pre-wrap;">
          Compilation Error:\n${error}
        </div>
      `;
      return;
    }

    if (!compiledCode) {
      containerRef.current.innerHTML = `
        <div style="color: #6b7280; font-style: italic; padding: 20px; text-align: center;">
          No component to preview
        </div>
      `;
      return;
    }

    try {
      // Create a function that executes the compiled code and returns the component
      const executeCode = new Function(
        "React",
        "useState",
        "useEffect",
        "Fragment",
        "createElement",
        `
        try {
          ${compiledCode}
          
          // Try common component names
          const possibleNames = ['MyComponent', 'Component', 'App', 'Default'];
          let ComponentToRender = null;
          
          for (const name of possibleNames) {
            try {
              if (typeof eval(name) === 'function') {
                ComponentToRender = eval(name);
                break;
              }
            } catch (e) {
              // Continue trying
            }
          }
          
          // If no standard name found, try to extract from the code
          if (!ComponentToRender) {
            const matches = \`${compiledCode.replace(
              /`/g,
              "\\`"
            )}\`.match(/function\\s+([A-Z][a-zA-Z0-9_]*)/);
            if (matches && matches[1]) {
              try {
                ComponentToRender = eval(matches[1]);
              } catch (e) {
                console.log('Failed to eval extracted component:', matches[1]);
              }
            }
          }
          
          return ComponentToRender;
        } catch (error) {
          throw error;
        }
        `
      );

      // Execute the code to get the component
      const ComponentToRender = executeCode(
        React,
        React.useState,
        React.useEffect,
        React.Fragment,
        React.createElement
      );

      if (!ComponentToRender || typeof ComponentToRender !== "function") {
        containerRef.current.innerHTML = `
          <div style="color: #ef4444; padding: 20px;">
            No valid React component found. Make sure your component is named MyComponent, Component, App, or starts with a capital letter.
          </div>
        `;
        return;
      }

      // Create React root and render the component
      rootRef.current = ReactDOM.createRoot(containerRef.current);
      rootRef.current.render(React.createElement(ComponentToRender));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Runtime error:", err);

      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div style="color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 6px; font-family: monospace; white-space: pre-wrap;">
            Runtime Error: ${errorMessage}
          </div>
        `;
      }
    }
  }, [compiledCode, error]);

  useEffect(() => {
    renderComponent();

    // Cleanup on unmount
    return () => {
      if (rootRef.current) {
        try {
          rootRef.current.unmount();
        } catch (e) {
          console.warn("Failed to unmount root on cleanup:", e);
        }
      }
    };
  }, [renderComponent]);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium">
        Live Preview
      </div>
      <div className="flex-1 bg-white p-4 overflow-auto">
        <div ref={containerRef} style={{ width: "100%", minHeight: "100%" }} />
      </div>
    </div>
  );
}
