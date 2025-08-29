"use client";

import { useState, useEffect } from "react";
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
  const [code, setCode] = useState(defaultCode);
  const [compiledCode, setCompiledCode] = useState("");
  const [error, setError] = useState<string>();
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedElement, setSelectedElement] =
    useState<ElementProperties | null>(null);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);

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
        return;
      }

      // 2. Try custom AST traversal approach
      console.log("🔄 Trying custom AST traversal...");
      const ast = parseToAST(code);
      if (ast) {
        const result = updateElementInAST(ast, selectedElement, updatedElement);
        if (result.success && result.code) {
          const formattedCode = formatCode(result.code);
          setCode(formattedCode);
          console.log("✅ Custom AST update successful");
          return;
        } else {
          console.error("Custom AST failed:", result.error);
        }
      }

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
      } else {
        console.log("❌ All approaches failed");
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
        } else {
          console.log("❌ All approaches failed");
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
      }
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
        } border-r border-gray-300 transition-all duration-300`}
      >
        <CodeInput code={code} onChange={setCode} />
      </div>
      <div
        className={`${
          showPropertiesPanel ? "w-1/3" : "w-1/2"
        } relative transition-all duration-300`}
      >
        {/* Selector Button */}
        <div className="absolute top-2 right-2 z-10">
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
