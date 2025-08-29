import * as Babel from "@babel/standalone";
import { ElementProperties } from "../components/editor/properties-panel";

export interface ASTUpdateResult {
  success: boolean;
  code?: string;
  error?: string;
}

// AST node types
interface ASTNode {
  type: string;
  [key: string]: unknown;
}

interface JSXElement extends ASTNode {
  type: "JSXElement";
  openingElement: JSXOpeningElement;
  children?: ASTNode[];
}

interface JSXOpeningElement extends ASTNode {
  type: "JSXOpeningElement";
  name: JSXIdentifier;
  attributes: JSXAttribute[];
}

interface JSXIdentifier extends ASTNode {
  type: "JSXIdentifier";
  name: string;
}

interface JSXAttribute extends ASTNode {
  type: "JSXAttribute";
  name: JSXIdentifier;
  value?: JSXExpressionContainer | null;
}

interface JSXExpressionContainer extends ASTNode {
  type: "JSXExpressionContainer";
  expression: ObjectExpression;
}

interface ObjectExpression extends ASTNode {
  type: "ObjectExpression";
  properties: ObjectProperty[];
}

interface ObjectProperty extends ASTNode {
  type: "ObjectProperty";
  key: Identifier;
  value: StringLiteral;
}

interface Identifier extends ASTNode {
  type: "Identifier";
  name: string;
}

interface StringLiteral extends ASTNode {
  type: "StringLiteral";
  value: string;
}

interface JSXText extends ASTNode {
  type: "JSXText";
  value: string;
}

interface StyleProperties {
  [key: string]: string;
}

// Parse JSX code to AST
export const parseToAST = (code: string): ASTNode | null => {
  try {
    // Use transform with proper presets for @babel/standalone
    const result = Babel.transform(code, {
      sourceType: "module",
      presets: ["react", "env"],
      plugins: [],
      ast: true,
    });

    if (!result.ast) {
      console.error("No AST returned from Babel transform");
      return null;
    }

    return result.ast as unknown as ASTNode;
  } catch (error) {
    console.error("Failed to parse code to AST:", error);
    return null;
  }
};

// Convert AST back to code
export const generateCodeFromAST = (ast: ASTNode): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = Babel.transformFromAst(ast as any, undefined, {
      presets: ["react", "env"],
      plugins: [],
      compact: false,
      retainLines: false,
    });

    const code = (result as unknown as { code?: string })?.code;
    if (!code) {
      console.error("No code returned from Babel transformFromAst");
      return "";
    }

    return code;
  } catch (error) {
    console.error("Failed to generate code from AST:", error);
    return "";
  }
};

// Helper to create a style object from properties
const createStyleObject = (properties: ElementProperties): StyleProperties => {
  const styleProps: StyleProperties = {};

  if (properties.color) styleProps.color = properties.color;
  if (properties.backgroundColor)
    styleProps.backgroundColor = properties.backgroundColor;
  if (properties.fontSize) styleProps.fontSize = properties.fontSize;
  if (properties.fontWeight) styleProps.fontWeight = properties.fontWeight;
  if (properties.padding) styleProps.padding = properties.padding;
  if (properties.margin) styleProps.margin = properties.margin;
  if (properties.border) styleProps.border = properties.border;
  if (properties.borderRadius)
    styleProps.borderRadius = properties.borderRadius;

  return styleProps;
};

// Helper to create style properties as AST nodes
const createStylePropertiesAST = (
  properties: ElementProperties
): ObjectProperty[] => {
  const styleObj = createStyleObject(properties);
  const styleProperties: ObjectProperty[] = [];

  Object.entries(styleObj).forEach(([key, value]) => {
    styleProperties.push({
      type: "ObjectProperty",
      key: {
        type: "Identifier",
        name: key,
      },
      value: {
        type: "StringLiteral",
        value: value,
      },
    });
  });

  return styleProperties;
};

// Find and update JSX element by tag and text content
export const updateElementInAST = (
  ast: ASTNode,
  targetElement: ElementProperties,
  newProperties: ElementProperties
): ASTUpdateResult => {
  let elementFound = false;
  let matchCount = 0;
  const foundElements: Array<{ tag: string; textContent: string }> = [];

  const traverse = (node: ASTNode | null) => {
    if (!node || typeof node !== "object") return;

    // Handle JSX Elements
    if (node.type === "JSXElement") {
      const jsxElement = node as JSXElement;
      const openingElement = jsxElement.openingElement;

      if (openingElement && openingElement.name && openingElement.name.name) {
        const tagName = openingElement.name.name;
        const elementTextContent = extractTextContent(jsxElement);

        // Debug: Track all found elements
        foundElements.push({ tag: tagName, textContent: elementTextContent });

        console.log(
          `Found element: <${tagName}> with text: "${elementTextContent}"`
        );
        console.log(
          `Looking for: <${targetElement.tag}> with text: "${
            targetElement.textContent || "(any)"
          }"`
        );

        if (tagName === targetElement.tag) {
          console.log(`Tag match found for: ${tagName}`);

          // More flexible matching logic
          const isTextMatch =
            !targetElement.textContent ||
            !elementTextContent ||
            elementTextContent
              .trim()
              .includes(targetElement.textContent.trim()) ||
            targetElement.textContent
              .trim()
              .includes(elementTextContent.trim());

          if (isTextMatch) {
            matchCount++;
            console.log(`Text match found! Match count: ${matchCount}`);

            // Update the first match
            if (matchCount === 1) {
              console.log(`Updating element: <${tagName}>`);
              updateJSXElementStyle(jsxElement, newProperties);

              // Update text content if changed
              if (
                newProperties.textContent !== undefined &&
                newProperties.textContent !== targetElement.textContent
              ) {
                updateElementTextContent(jsxElement, newProperties.textContent);
              }

              elementFound = true;
              return;
            }
          } else {
            console.log(
              `Text content mismatch. Expected: "${targetElement.textContent}", Found: "${elementTextContent}"`
            );
          }
        }
      }
    }

    // Recursively traverse children
    for (const [, child] of Object.entries(node)) {
      if (Array.isArray(child)) {
        child.forEach((item) => traverse(item as ASTNode));
      } else if (child && typeof child === "object") {
        traverse(child as ASTNode);
      }
    }
  };

  traverse(ast);

  if (!elementFound) {
    console.log("All found elements:", foundElements);
    const availableTags = [...new Set(foundElements.map((el) => el.tag))];
    return {
      success: false,
      error: `Element with tag "${
        targetElement.tag
      }" not found. Available tags: [${availableTags.join(
        ", "
      )}]. Target text: "${targetElement.textContent || "none"}"`,
    };
  }

  const updatedCode = generateCodeFromAST(ast);
  return {
    success: true,
    code: updatedCode,
  };
};

// Extract text content from JSX element
const extractTextContent = (jsxElement: JSXElement): string => {
  let textContent = "";

  const extractFromChildren = (children: ASTNode[]) => {
    children.forEach((child) => {
      if (child.type === "JSXText") {
        const jsxText = child as JSXText;
        const text = jsxText.value.trim();
        if (text) {
          textContent += text + " ";
        }
      } else if (child.type === "JSXElement") {
        const jsxElement = child as JSXElement;
        extractFromChildren(jsxElement.children || []);
      } else if (
        child.type === "JSXExpressionContainer" &&
        (child as { expression?: { type: string; value: string } }).expression
          ?.type === "StringLiteral"
      ) {
        textContent +=
          (child as unknown as { expression: { value: string } }).expression
            .value + " ";
      }
    });
  };

  if (jsxElement.children) {
    extractFromChildren(jsxElement.children);
  }

  return textContent.trim();
};

// Update text content of JSX element
const updateElementTextContent = (
  jsxElement: JSXElement,
  newTextContent: string
) => {
  if (jsxElement.children && jsxElement.children.length > 0) {
    // Find the first text node and update it
    for (let i = 0; i < jsxElement.children.length; i++) {
      const child = jsxElement.children[i];
      if (child.type === "JSXText") {
        (child as JSXText).value = newTextContent;
        return;
      }
    }

    // If no text node found, add one
    jsxElement.children.unshift({
      type: "JSXText",
      value: newTextContent,
    });
  } else {
    // If no children, create text node
    jsxElement.children = [
      {
        type: "JSXText",
        value: newTextContent,
      },
    ];
  }
};

// Update or add style attribute to JSX element
const updateJSXElementStyle = (
  jsxElement: JSXElement,
  properties: ElementProperties
) => {
  const openingElement = jsxElement.openingElement;
  if (!openingElement) return;

  const styleProperties = createStylePropertiesAST(properties);

  if (styleProperties.length === 0) return;

  // Find existing style attribute
  const styleAttribute = openingElement.attributes.find(
    (attr) => attr.type === "JSXAttribute" && attr.name.name === "style"
  ) as JSXAttribute | undefined;

  if (styleAttribute) {
    // Update existing style attribute
    if (
      styleAttribute.value &&
      styleAttribute.value.type === "JSXExpressionContainer"
    ) {
      const expression = (
        styleAttribute.value as {
          expression: { type: string; properties: ObjectProperty[] };
        }
      ).expression;

      if (expression.type === "ObjectExpression") {
        // Merge with existing properties
        const existingProps = expression.properties;

        styleProperties.forEach((newProp) => {
          const existingPropIndex = existingProps.findIndex(
            (prop: { key?: { name: string } }) =>
              prop.key && prop.key.name === newProp.key.name
          );

          if (existingPropIndex !== -1) {
            // Update existing property
            existingProps[existingPropIndex] = newProp;
          } else {
            // Add new property
            existingProps.push(newProp);
          }
        });
      } else {
        // Replace with new object expression
        (styleAttribute.value as { expression: ObjectExpression }).expression =
          {
            type: "ObjectExpression",
            properties: styleProperties,
          };
      }
    }
  } else {
    // Add new style attribute
    const newStyleAttribute = {
      type: "JSXAttribute",
      name: {
        type: "JSXIdentifier",
        name: "style",
      },
      value: {
        type: "JSXExpressionContainer",
        expression: {
          type: "ObjectExpression",
          properties: styleProperties,
        },
      },
    };

    openingElement.attributes.push(newStyleAttribute as JSXAttribute);
  }
};

// Helper function to merge style strings intelligently (for fallback approach)
const mergeStyleStringsInAST = (
  existingStylesString: string,
  newStyleObject: StyleProperties
): string => {
  // Parse existing styles from string format "prop1: 'value1', prop2: 'value2'"
  const existingStyles: StyleProperties = {};

  // Clean up the string and split by commas
  const styleEntries = existingStylesString
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  // Parse each style entry
  styleEntries.forEach((entry) => {
    const colonIndex = entry.indexOf(":");
    if (colonIndex > 0) {
      const key = entry.substring(0, colonIndex).trim();
      let value = entry.substring(colonIndex + 1).trim();

      // Remove quotes if present
      if (
        (value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))
      ) {
        value = value.slice(1, -1);
      }

      existingStyles[key] = value;
    }
  });

  // Merge with new styles (new styles take precedence)
  const mergedStyles = { ...existingStyles, ...newStyleObject };

  // Convert back to string format
  return Object.entries(mergedStyles)
    .map(([key, value]) => `${key}: '${value}'`)
    .join(", ");
};

// Fallback: Simple string-based style injection for when AST fails
export const injectStyleFallback = (
  code: string,
  targetElement: ElementProperties,
  newProperties: ElementProperties
): string => {
  try {
    console.log("Using fallback string-based style injection");

    const styleObject = createStyleObject(newProperties);
    if (Object.keys(styleObject).length === 0) return code;

    // Create the style string
    const styleString = Object.entries(styleObject)
      .map(([key, value]) => `${key}: '${value}'`)
      .join(", ");

    // Find the target element and inject/update styles
    const tagRegex = new RegExp(`<${targetElement.tag}([^>]*)>`, "g");

    return code.replace(tagRegex, (match, attributes) => {
      // Check if this element has the target text content (if specified)
      if (targetElement.textContent) {
        const fullElementRegex = new RegExp(
          `<${targetElement.tag}[^>]*>([\\s\\S]*?)</${targetElement.tag}>`,
          "g"
        );
        let foundMatch = false;

        code.replace(fullElementRegex, (fullMatch, content) => {
          if (content.includes(targetElement.textContent)) {
            foundMatch = true;
          }
          return fullMatch;
        });

        if (!foundMatch) return match;
      }

      // Check if element already has style attribute
      const styleAttrRegex = /style\s*=\s*\{?\{([^}]*)\}\}?/;
      const styleMatch = attributes.match(styleAttrRegex);

      if (styleMatch) {
        // Update existing style - merge intelligently
        const existingStyles = styleMatch[1];
        const mergedStyles = mergeStyleStringsInAST(
          existingStyles,
          styleObject
        );
        const newAttributes = attributes.replace(
          styleAttrRegex,
          `style={{${mergedStyles}}}`
        );
        return `<${targetElement.tag}${newAttributes}>`;
      } else {
        // Add new style attribute
        return `<${targetElement.tag}${attributes} style={{${styleString}}}>`;
      }
    });
  } catch (error) {
    console.error("Fallback style injection failed:", error);
    return code;
  }
};

// Format code using Prettier-like formatting
export const formatCode = (code: string): string => {
  try {
    // Use Babel to parse and reformat
    const ast = parseToAST(code);
    if (!ast) return code;

    const formatted = generateCodeFromAST(ast);

    // Basic formatting improvements
    return formatted
      .replace(/;(\s*})/g, "$1") // Remove semicolons before closing braces
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/{\s+/g, "{\n  ") // Add newlines after opening braces
      .replace(/\s+}/g, "\n}") // Add newlines before closing braces
      .replace(/,\s+/g, ",\n  ") // Add newlines after commas in objects
      .trim();
  } catch (error) {
    console.error("Failed to format code:", error);
    return code;
  }
};
