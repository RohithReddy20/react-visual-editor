"use client";

import { useState, useEffect } from "react";
import CodeInput from "./editor/code-input";
import Preview from "./editor/preview";
import {
  parseReactComponent,
  createExecutableComponent,
} from "../utils/babel-parser";

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

    const timeoutId = setTimeout(parseCode, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [code]);

  return (
    <div className="h-screen flex">
      <div className="w-1/2 border-r border-gray-300">
        <CodeInput code={code} onChange={setCode} />
      </div>
      <div className="w-1/2">
        <Preview compiledCode={compiledCode} error={error} />
      </div>
    </div>
  );
}
