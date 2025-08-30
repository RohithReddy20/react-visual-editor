"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CodeInput from "./editor/code-input";
import EnhancedPreview from "./editor/enhanced-preview";
import SelectorButton from "./editor/selector-button";
import PropertiesPanel, { ElementProperties } from "./editor/properties-panel";
import {
  parseReactComponent,
  createExecutableComponent,
} from "../utils/babel-parser";
import {
  updateElementInAST,
  parseToAST,
  formatCode,
  injectStyleFallback,
} from "../utils/ast-manipulator";
import { updateElementWithVisitor } from "../utils/ast-visitor";
import { ComponentAPI } from "../utils/api";

const defaultCode = `function MyComponent() {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f0f9ff',
      borderRadius: '8px',
      border: '2px solid #0ea5e9'
    }}>
      <h1 style={{ color: '#0369a1', margin: '0 0 10px 0' }}>
        Hello React!
      </h1>
      <p style={{ color: '#075985', margin: 0 }}>
        This is a live preview of your React component.
      </p>
    </div>
  );
}`;

export default function WebsiteEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [code, setCode] = useState(defaultCode);
  const [compiledCode, setCompiledCode] = useState("");
  const [error, setError] = useState<string>();
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedElement, setSelectedElement] =
    useState<ElementProperties | null>(null);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [currentComponentId, setCurrentComponentId] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  
  // Debounce refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const codeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update URL with component ID
  const updateURL = useCallback((componentId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('id', componentId);
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  // Load component from backend
  const loadComponent = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const component = await ComponentAPI.getComponent(id);
      setCode(component.code);
      setCurrentComponentId(component.id);
      console.log('Component loaded:', component.id);
    } catch (error) {
      console.error('Failed to load component:', error);
      // Reset to default if loading fails
      setCode(defaultCode);
      setCurrentComponentId(null);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('id');
      router.push(`?${params.toString()}`);
    } finally {
      setIsLoading(false);
    }
  }, [router, searchParams]);

  // Auto-save when component is first created (on paste)
  const createComponent = useCallback(async (code: string) => {
    if (!code.trim() || code === defaultCode) return;
    
    try {
      setIsAutoSaving(true);
      const component = await ComponentAPI.createComponent(code);
      setCurrentComponentId(component.id);
      updateURL(component.id);
      console.log('Component created with ID:', component.id);
    } catch (error) {
      console.error('Failed to create component:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [updateURL]);

  // Save changes to existing component
  const saveComponent = useCallback(async () => {
    if (!currentComponentId || !code.trim()) return;
    
    try {
      setIsAutoSaving(true);
      const component = await ComponentAPI.updateComponent(currentComponentId, code);
      console.log('Component updated:', component.id);
    } catch (error) {
      console.error('Failed to update component:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [currentComponentId, code]);

  // Debounced auto-save function
  const debouncedAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    setHasPendingChanges(true);
    
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (currentComponentId) {
        await saveComponent();
        setHasPendingChanges(false);
      }
    }, 1000); // 1 second debounce
  }, [currentComponentId, saveComponent]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (codeChangeTimeoutRef.current) {
        clearTimeout(codeChangeTimeoutRef.current);
      }
    };
  }, []);

  // Load component from URL on initial page load
  useEffect(() => {
    const componentId = searchParams.get('id');
    if (componentId && !currentComponentId) {
      loadComponent(componentId);
    }
  }, [searchParams, currentComponentId, loadComponent]);

  // Debounced code change handler for auto-save
  useEffect(() => {
    // Clear existing timeout
    if (codeChangeTimeoutRef.current) {
      clearTimeout(codeChangeTimeoutRef.current);
    }

    // If code is default or empty, don't process
    if (code === defaultCode || !code.trim()) {
      return;
    }

    setHasPendingChanges(true);

    // If no component exists, create one
    if (!currentComponentId) {
      codeChangeTimeoutRef.current = setTimeout(async () => {
        await createComponent(code);
        setHasPendingChanges(false);
      }, 2000); // 2 second debounce for creation
    } else {
      // If component exists, auto-save changes
      codeChangeTimeoutRef.current = setTimeout(async () => {
        await saveComponent();
        setHasPendingChanges(false);
      }, 2000); // 2 second debounce for updates
    }
  }, [code, currentComponentId, createComponent, saveComponent]);

  // Handle Ctrl+S / Cmd+S save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Clear pending timeouts and save immediately
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        if (codeChangeTimeoutRef.current) {
          clearTimeout(codeChangeTimeoutRef.current);
        }
        setHasPendingChanges(false);
        saveComponent();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saveComponent]);

  useEffect(() => {
    const parseCode = () => {
      if (!code.trim()) {
        setCompiledCode("");
        setError(undefined);
        return;
      }

      console.log("=== PARSING CODE ===");
      console.log("Input code:", code);

      const result = parseReactComponent(code);
      console.log("Babel parse result:", result);

      if (result.success && result.compiledCode) {
        console.log("Babel compiled code:", result.compiledCode);
        const executableCode = createExecutableComponent(result.compiledCode);
        console.log("Final executable code:", executableCode);
        setCompiledCode(executableCode);
        setError(undefined);
      } else {
        console.log("Parse failed with error:", result.error);
        setCompiledCode("");
        setError(result.error);
      }
    };

    const timeoutId = setTimeout(parseCode, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [code]);

  const handleElementSelect = (element: ElementProperties) => {
    setSelectedElement(element);
    setShowPropertiesPanel(true);
    setIsSelecting(false); // Exit selection mode after selecting
  };

  const handlePropertyChange = (property: string, value: string) => {
    if (!selectedElement) return;

    const updatedElement = { ...selectedElement, [property]: value };
    setSelectedElement(updatedElement);

    let codeUpdated = false;

    // Update the code using multiple approaches (inspired by open-source projects)
    try {
      // 1. Try visitor-based approach first (used by React Docgen, Storybook)
      console.log("🚀 Attempting visitor-based AST update...");
      const visitorResult = updateElementWithVisitor(
        code,
        selectedElement,
        updatedElement
      );

      if (visitorResult.success && visitorResult.code) {
        setCode(visitorResult.code);
        console.log("✅ Visitor-based update successful");
        codeUpdated = true;
      } else {
        // 2. Try custom AST traversal approach
        console.log("🔄 Trying custom AST traversal...");
        const ast = parseToAST(code);
        if (ast) {
          const result = updateElementInAST(ast, selectedElement, updatedElement);
          if (result.success && result.code) {
            const formattedCode = formatCode(result.code);
            setCode(formattedCode);
            console.log("✅ Custom AST update successful");
            codeUpdated = true;
          } else {
            console.error("Custom AST failed:", result.error);
          }
        }

        if (!codeUpdated) {
          // 3. Fallback to string-based approach
          console.log("🔄 Trying string-based fallback...");
          const fallbackCode = injectStyleFallback(
            code,
            selectedElement,
            updatedElement
          );
          if (fallbackCode !== code) {
            setCode(fallbackCode);
            console.log("✅ String-based fallback successful");
            codeUpdated = true;
          } else {
            console.log("❌ All approaches failed");
          }
        }
      }
    } catch (error) {
      console.error("Error in handlePropertyChange:", error);
      console.log("🔄 Trying fallback string-based approach...");

      // Try fallback approach
      try {
        const fallbackCode = injectStyleFallback(
          code,
          selectedElement,
          updatedElement
        );
        if (fallbackCode !== code) {
          setCode(fallbackCode);
          console.log("✅ Fallback update successful");
          codeUpdated = true;
        } else {
          console.log("❌ All approaches failed");
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
      }
    }

    // Auto-save if code was successfully updated and we have a component ID
    if (codeUpdated && currentComponentId) {
      debouncedAutoSave();
    }
  };

  const handleClosePropertiesPanel = () => {
    setShowPropertiesPanel(false);
    setSelectedElement(null);
  };

  const toggleSelector = () => {
    setIsSelecting(!isSelecting);
    if (isSelecting) {
      // If turning off selector, also close properties panel
      setShowPropertiesPanel(false);
      setSelectedElement(null);
    }
  };

  return (
    <div className="h-screen flex">
      <div
        className={`${
          showPropertiesPanel ? "w-1/3" : "w-1/2"
        } border-r border-gray-300 transition-all duration-300 relative`}
      >
        {/* Component Status */}
        {isLoading ? (
          <div className="absolute top-2 left-2 z-10 bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded">
            Loading...
          </div>
        ) : currentComponentId && (
          <div className={`absolute top-2 left-2 z-10 px-2 py-1 text-xs rounded flex items-center gap-1 ${
            hasPendingChanges 
              ? 'bg-orange-100 text-orange-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {hasPendingChanges && <span className="animate-pulse">●</span>}
            ID: {currentComponentId.slice(0, 8)}...
            {hasPendingChanges && <span className="text-[10px]">(unsaved)</span>}
          </div>
        )}
        <CodeInput code={code} onChange={isLoading ? () => {} : setCode} />
      </div>
      <div
        className={`${
          showPropertiesPanel ? "w-1/3" : "w-1/2"
        } relative transition-all duration-300`}
      >
        {/* Action Buttons */}
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          {currentComponentId && (
            <button
              onClick={async () => {
                // Clear pending timeouts and save immediately
                if (autoSaveTimeoutRef.current) {
                  clearTimeout(autoSaveTimeoutRef.current);
                }
                if (codeChangeTimeoutRef.current) {
                  clearTimeout(codeChangeTimeoutRef.current);
                }
                setHasPendingChanges(false);
                await saveComponent();
              }}
              disabled={isAutoSaving}
              className={`px-3 py-1 text-sm rounded ${
                isAutoSaving 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : hasPendingChanges
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
              } transition-colors`}
            >
              {isAutoSaving 
                ? 'Saving...' 
                : hasPendingChanges 
                  ? 'Save Changes (⌘S)' 
                  : 'Saved (⌘S)'}
            </button>
          )}
          <SelectorButton isSelecting={isSelecting} onToggle={toggleSelector} />
        </div>
        <EnhancedPreview
          compiledCode={compiledCode}
          error={error}
          isSelecting={isSelecting}
          onElementSelect={handleElementSelect}
        />
      </div>
      {showPropertiesPanel && (
        <PropertiesPanel
          selectedElement={selectedElement}
          onPropertyChange={handlePropertyChange}
          onClose={handleClosePropertiesPanel}
        />
      )}
    </div>
  );
}
