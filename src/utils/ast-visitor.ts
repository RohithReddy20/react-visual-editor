import { ElementProperties } from "../components/editor/properties-panel";

// Improved AST manipulation inspired by successful open-source projects
export const updateElementWithVisitor = (
  code: string,
  targetElement: ElementProperties,
  newProperties: ElementProperties
): { success: boolean; code?: string; error?: string } => {
  try {
    console.log("🔄 Using improved AST approach...");

    // Use regex approach for now - more reliable with @babel/standalone
    const styleObject: Record<string, string> = {};
    if (newProperties.color) styleObject.color = newProperties.color;
    if (newProperties.backgroundColor)
      styleObject.backgroundColor = newProperties.backgroundColor;
    if (newProperties.fontSize) styleObject.fontSize = newProperties.fontSize;
    if (newProperties.fontWeight)
      styleObject.fontWeight = newProperties.fontWeight;
    if (newProperties.padding) styleObject.padding = newProperties.padding;
    if (newProperties.margin) styleObject.margin = newProperties.margin;
    if (newProperties.border) styleObject.border = newProperties.border;
    if (newProperties.borderRadius)
      styleObject.borderRadius = newProperties.borderRadius;

    if (Object.keys(styleObject).length === 0) {
      return { success: false, error: "No style properties to update" };
    }

    // Create style string in JSX format
    const styleString = Object.entries(styleObject)
      .map(([key, value]) => `${key}: '${value}'`)
      .join(", ");

    // Find and update the specific element
    let updatedCode = code;
    let elementFound = false;

    // Strategy: Find the element by tag and text content
    const tagPattern = new RegExp(
      `(<${targetElement.tag}[^>]*>)([\\s\\S]*?)(</${targetElement.tag}>)`,
      "g"
    );

    updatedCode = updatedCode.replace(
      tagPattern,
      (fullMatch, openTag, content, closeTag) => {
        // Check if this element contains the target text
        if (
          targetElement.textContent &&
          !content.includes(targetElement.textContent)
        ) {
          return fullMatch; // Not the right element
        }

        elementFound = true;
        console.log(`✅ Found target element: ${targetElement.tag}`);

        // Update text content if changed
        let newContent = content;
        if (
          newProperties.textContent !== undefined &&
          newProperties.textContent !== targetElement.textContent
        ) {
          newContent = newProperties.textContent;
        }

        // Update or add style attribute
        const styleRegex = /style\s*=\s*\{\{([^}]*)\}\}/;
        const styleMatch = openTag.match(styleRegex);

        let newOpenTag = openTag;
        if (styleMatch) {
          // Merge with existing styles
          const existingStyles = styleMatch[1];
          const mergedStyles = existingStyles + ", " + styleString;
          newOpenTag = openTag.replace(styleRegex, `style={{${mergedStyles}}}`);
        } else {
          // Add new style attribute
          newOpenTag = openTag.replace(">", ` style={{${styleString}}}>`);
        }

        return newOpenTag + newContent + closeTag;
      }
    );

    if (elementFound) {
      return {
        success: true,
        code: updatedCode,
      };
    } else {
      return {
        success: false,
        error: `Element ${targetElement.tag} with content "${
          targetElement.textContent || "any"
        }" not found`,
      };
    }
  } catch (error) {
    console.error("Improved AST approach failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
