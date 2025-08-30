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
        <div style="
          color: var(--error); 
          background: #fef2f2; 
          border: 1px solid #fecaca; 
          padding: 16px; 
          border-radius: var(--radius); 
          font-family: var(--font-mono); 
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
          box-shadow: var(--shadow-sm);
        ">
          <div style="font-weight: 600; margin-bottom: 8px; color: #dc2626;">⚠ Compilation Error</div>${error}
        </div>
      `;
      return;
    }

    if (!compiledCode) {
      containerRef.current.innerHTML = `
        <div style="
          color: var(--text-muted); 
          font-style: italic; 
          padding: 32px; 
          text-align: center;
          font-size: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        ">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity: 0.5;">
            <polyline points="16,18 22,12 16,6"/>
            <polyline points="8,6 2,12 8,18"/>
          </svg>
          <div>No component to preview</div>
          <div style="font-size: 12px; opacity: 0.7;">Paste your React component code to get started</div>
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
          <div style="
            color: var(--warning); 
            background: #fffbeb; 
            border: 1px solid #fed7aa; 
            padding: 16px; 
            border-radius: var(--radius);
            font-size: 13px;
            line-height: 1.5;
            box-shadow: var(--shadow-sm);
          ">
            <div style="font-weight: 600; margin-bottom: 8px; color: #d97706;">⚠ Component Not Found</div>
            Make sure your component is named MyComponent, Component, App, or starts with a capital letter.
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
          <div style="
            color: var(--error); 
            background: #fef2f2; 
            border: 1px solid #fecaca; 
            padding: 16px; 
            border-radius: var(--radius); 
            font-family: var(--font-mono); 
            font-size: 13px;
            line-height: 1.5;
            white-space: pre-wrap;
            box-shadow: var(--shadow-sm);
          ">
            <div style="font-weight: 600; margin-bottom: 8px; color: #dc2626;">⚠ Runtime Error</div>${errorMessage}
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
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--panel-bg)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ 
        backgroundColor: 'var(--panel-header)', 
        borderColor: 'var(--border)' 
      }}>
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Live Preview
          </span>
        </div>
        {isSelecting && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full" style={{ 
            backgroundColor: 'var(--accent)', 
            color: 'white' 
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7l5-5 5 5"/>
              <path d="M8 2v10"/>
            </svg>
            Selecting
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto relative" style={{ backgroundColor: '#ffffff' }}>
        <div className="p-4 relative">
          <div
            ref={containerRef}
            style={{
              width: "100%",
              minHeight: "calc(100vh - 180px)",
              cursor: isSelecting ? "crosshair" : "default",
            }}
          />
          {/* Highlight Overlay */}
          <div
            ref={overlayRef}
            style={{
              position: "absolute",
              pointerEvents: "none",
              border: "2px solid var(--accent)",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderRadius: "4px",
              display: "none",
              zIndex: 1000,
              top: "16px",
              left: "16px",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)"
            }}
          />
        </div>
      </div>
    </div>
  );
}
