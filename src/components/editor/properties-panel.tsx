import React from "react";

// Utility function to convert RGB/RGBA to hex
const rgbToHex = (rgb: string): string => {
  if (!rgb || rgb === 'transparent') return '#000000';
  
  // Handle hex values that are already in the right format
  if (rgb.startsWith('#')) return rgb;
  
  // Extract RGB values from rgb() or rgba() format
  const rgbMatch = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (!rgbMatch) return '#000000';
  
  const [, r, g, b] = rgbMatch;
  const toHex = (n: string) => {
    const hex = parseInt(n, 10).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export interface ElementProperties {
  tag: string;
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  fontWeight?: string;
  textContent?: string;
  padding?: string;
  margin?: string;
  border?: string;
  borderRadius?: string;
  hasChildElements?: boolean;
}

interface PropertiesPanelProps {
  selectedElement: ElementProperties | null;
  onPropertyChange: (property: string, value: string) => void;
  onClose: () => void;
}

export default function PropertiesPanel({
  selectedElement,
  onPropertyChange,
  onClose,
}: PropertiesPanelProps) {
  if (!selectedElement) {
    return null;
  }

  const handleInputChange = (property: string, value: string) => {
    onPropertyChange(property, value);
  };

  return (
    <div className="w-80 bg-white border-l border-gray-300 h-full flex flex-col">
      <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium flex justify-between items-center">
        <span>Element Properties</span>
        <button
          onClick={onClose}
          className="text-gray-300 hover:text-white"
          title="Close properties panel"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="flex-1 p-4 overflow-auto space-y-4">
        {/* Element Tag */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Element Type
          </label>
          <input
            type="text"
            value={selectedElement.tag}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
          />
        </div>

        {/* Text Content - Only show for leaf elements (no child elements) */}
        {selectedElement.textContent !== undefined && !selectedElement.hasChildElements && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text Content
            </label>
            <textarea
              value={selectedElement.textContent}
              onChange={(e) => handleInputChange("textContent", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
        )}

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Text Color
          </label>
          <div className="flex space-x-2">
            <input
              type="color"
              value={rgbToHex(selectedElement.color || "#000000")}
              onChange={(e) => handleInputChange("color", e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              value={selectedElement.color || ""}
              onChange={(e) => handleInputChange("color", e.target.value)}
              placeholder="#000000 or rgb(0,0,0)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Background Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Background Color
          </label>
          <div className="flex space-x-2">
            <input
              type="color"
              value={rgbToHex(selectedElement.backgroundColor || "#ffffff")}
              onChange={(e) =>
                handleInputChange("backgroundColor", e.target.value)
              }
              className="w-12 h-10 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              value={selectedElement.backgroundColor || ""}
              onChange={(e) =>
                handleInputChange("backgroundColor", e.target.value)
              }
              placeholder="#ffffff or rgb(255,255,255)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Size
          </label>
          <input
            type="text"
            value={selectedElement.fontSize || ""}
            onChange={(e) => handleInputChange("fontSize", e.target.value)}
            placeholder="16px, 1rem, large"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Font Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Weight
          </label>
          <select
            value={selectedElement.fontWeight || "normal"}
            onChange={(e) => handleInputChange("fontWeight", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="lighter">Lighter</option>
            <option value="bolder">Bolder</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="300">300</option>
            <option value="400">400</option>
            <option value="500">500</option>
            <option value="600">600</option>
            <option value="700">700</option>
            <option value="800">800</option>
            <option value="900">900</option>
          </select>
        </div>

        {/* Padding */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Padding
          </label>
          <input
            type="text"
            value={selectedElement.padding || ""}
            onChange={(e) => handleInputChange("padding", e.target.value)}
            placeholder="10px, 1rem, 10px 20px"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Margin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Margin
          </label>
          <input
            type="text"
            value={selectedElement.margin || ""}
            onChange={(e) => handleInputChange("margin", e.target.value)}
            placeholder="10px, 1rem, 10px 20px"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Border */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Border
          </label>
          <input
            type="text"
            value={selectedElement.border || ""}
            onChange={(e) => handleInputChange("border", e.target.value)}
            placeholder="1px solid #000, 2px dashed red"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Border Radius */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Border Radius
          </label>
          <input
            type="text"
            value={selectedElement.borderRadius || ""}
            onChange={(e) => handleInputChange("borderRadius", e.target.value)}
            placeholder="5px, 50%, 10px 20px"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
