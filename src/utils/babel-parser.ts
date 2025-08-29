import * as Babel from "@babel/standalone";

export interface ParseResult {
  success: boolean;
  compiledCode?: string;
  error?: string;
}

export const parseReactComponent = (code: string): ParseResult => {
  console.log("=== BABEL PARSER ===");
  console.log("Input code:", code);

  try {
    const result = Babel.transform(code, {
      presets: ["react", "env"],
      plugins: [],
    });

    console.log("Babel transform result:", result);
    console.log("Babel compiled code:", result.code);

    return {
      success: true,
      compiledCode: result.code || "",
    };
  } catch (error: unknown) {
    console.error("Babel transform error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const createExecutableComponent = (compiledCode: string): string => {
  console.log("=== CREATE EXECUTABLE COMPONENT ===");
  console.log("Input compiled code:", compiledCode);

  const result = `
    (function() {
      console.log('=== INSIDE EXECUTABLE FUNCTION ===');
      const { createElement, useState, useEffect, Fragment } = React;
      
      try {
        // Execute the compiled code which should define the component
        ${compiledCode}
        
        // Try common component names
        const possibleNames = ['MyComponent', 'Component', 'App', 'Default'];
        let ComponentToRender = null;
        
        for (const name of possibleNames) {
          try {
            if (typeof window[name] === 'function') {
              ComponentToRender = window[name];
              break;
            }
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
        
        if (!ComponentToRender || typeof ComponentToRender !== 'function') {
          return createElement('div', { 
            style: { color: '#ef4444', padding: '20px' } 
          }, 'No valid React component found. Make sure your component is named MyComponent, Component, App, or starts with a capital letter.');
        }
        
        return createElement(ComponentToRender);
      } catch (error) {
        return createElement('div', { 
          style: { color: '#ef4444', padding: '20px' } 
        }, 'Error: ' + error.message);
      }
    })();
  `;

  console.log("Generated executable result:", result);
  return result;
};
