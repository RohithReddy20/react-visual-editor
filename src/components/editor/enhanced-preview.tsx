import React, { useRef, useEffect, useCallback, useState } from "react";
import * as ReactDOM from "react-dom/client";
import { ElementProperties } from "./properties-panel";

interface EnhancedPreviewProps {
  compiledCode: string;
  error?: string;
  isSelecting: boolean;
  onElementSelect: (element: ElementProperties) => void;
}

export default function EnhancedPreview({
  compiledCode,
  error,
  isSelecting,
  onElementSelect,
}: EnhancedPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<ReactDOM.Root | null>(null);
  const [isUnmounting, setIsUnmounting] = useState(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(
    null
  );

  const cleanupRoot = useCallback(async () => {
    if (rootRef.current && !isUnmounting) {
      setIsUnmounting(true);
      try {
        await new Promise((resolve) => {
          setTimeout(() => {
            try {
              if (rootRef.current) {
                rootRef.current.unmount();
                rootRef.current = null;
              }
            } catch (e) {
              console.warn("Failed to unmount previous root:", e);
            }
            resolve(void 0);
          }, 0);
        });
      } finally {
        setIsUnmounting(false);
      }
    }
  }, [isUnmounting]);

  const extractElementProperties = (
    element: HTMLElement
  ): ElementProperties => {
    const computedStyle = window.getComputedStyle(element);
    const textContent = element.textContent?.trim() || "";
    
    // Check if element has child elements (not just text nodes)
    const hasChildElements = Array.from(element.childNodes).some(
      node => node.nodeType === Node.ELEMENT_NODE
    );

    return {
      tag: element.tagName.toLowerCase(),
      color: computedStyle.color || undefined,
      backgroundColor: 
        computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)" && 
        computedStyle.backgroundColor !== "transparent"
          ? computedStyle.backgroundColor
          : undefined,
      fontSize: computedStyle.fontSize,
      fontWeight: computedStyle.fontWeight,
      textContent: textContent || undefined,
      hasChildElements,
      padding:
        computedStyle.padding !== "0px" ? computedStyle.padding : undefined,
      margin: computedStyle.margin !== "0px" ? computedStyle.margin : undefined,
      border:
        computedStyle.border !== "0px none rgba(0, 0, 0, 0)"
          ? computedStyle.border
          : undefined,
      borderRadius:
        computedStyle.borderRadius !== "0px"
          ? computedStyle.borderRadius
          : undefined,
    };
  };

  const updateHighlight = useCallback(
    (element: HTMLElement | null) => {
      if (!overlayRef.current || !containerRef.current) return;

      if (!element || !isSelecting) {
        overlayRef.current.style.display = "none";
        return;
      }

      // Get the position relative to the container
      const containerRect = containerRef.current.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      // Calculate position relative to the container's content area
      const left = elementRect.left - containerRect.left;
      const top = elementRect.top - containerRect.top;

      overlayRef.current.style.display = "block";
      overlayRef.current.style.left = `${left + 16}px`; // Add padding offset
      overlayRef.current.style.top = `${top + 16}px`; // Add padding offset
      overlayRef.current.style.width = `${elementRect.width}px`;
      overlayRef.current.style.height = `${elementRect.height}px`;
    },
    [isSelecting]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isSelecting || !containerRef.current) return;

      const element = document.elementFromPoint(
        event.clientX,
        event.clientY
      ) as HTMLElement;

      if (
        element &&
        containerRef.current.contains(element) &&
        element !== containerRef.current
      ) {
        if (hoveredElement !== element) {
          setHoveredElement(element);
          updateHighlight(element);
        }
      } else {
        if (hoveredElement) {
          setHoveredElement(null);
          updateHighlight(null);
        }
      }
    },
    [isSelecting, hoveredElement, updateHighlight]
  );

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!isSelecting || !hoveredElement) return;

      event.preventDefault();
      event.stopPropagation();

      const properties = extractElementProperties(hoveredElement);
      onElementSelect(properties);
    },
    [isSelecting, hoveredElement, onElementSelect]
  );

  useEffect(() => {
    if (isSelecting) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("click", handleClick, true);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleClick, true);
      setHoveredElement(null);
      updateHighlight(null);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleClick, true);
    };
  }, [isSelecting, handleMouseMove, handleClick, updateHighlight]);

  const renderComponent = useCallback(async () => {
    if (!containerRef.current) return;

    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
      renderTimeoutRef.current = null;
    }

    await cleanupRoot();
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
      const executeCode = new Function(
        "React",
        "useState",
        "useEffect",
        "Fragment",
        "createElement",
        `
        try {
          ${compiledCode}
          
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
  }, [compiledCode, error, cleanupRoot]);

  useEffect(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = setTimeout(() => {
      renderComponent();
    }, 150);

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }

      if (rootRef.current) {
        const currentRoot = rootRef.current;
        rootRef.current = null;
        setTimeout(() => {
          try {
            currentRoot.unmount();
          } catch (e) {
            console.warn("Failed to unmount root on cleanup:", e);
          }
        }, 0);
      }
    };
  }, [renderComponent]);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium">
        Live Preview{" "}
        {isSelecting && <span className="text-blue-300">(Selector Mode)</span>}
      </div>
      <div className="flex-1 bg-white overflow-auto relative">
        <div className="p-4 relative">
          <div
            ref={containerRef}
            style={{
              width: "100%",
              minHeight: "100%",
              cursor: isSelecting ? "crosshair" : "default",
            }}
          />
          {/* Highlight Overlay */}
          <div
            ref={overlayRef}
            style={{
              position: "absolute",
              pointerEvents: "none",
              border: "2px solid #3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderRadius: "2px",
              display: "none",
              zIndex: 1000,
              top: "16px", // Account for padding
              left: "16px", // Account for padding
            }}
          />
        </div>
      </div>
    </div>
  );
}
