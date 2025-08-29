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

  // Just return the compiled code - the iframe will handle the component discovery
  return compiledCode;
};
