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
    <div className="h-full max-h-screen flex flex-col" style={{ 
      backgroundColor: 'var(--panel-bg)'
    }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ 
        backgroundColor: 'var(--panel-header)', 
        borderColor: 'var(--border)' 
      }}>
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Properties
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-md transition-colors duration-200"
          style={{ 
            color: 'var(--text-secondary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="Close properties panel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div style={{ 
        height: 'calc(100vh - 112px)',
        overflowY: 'scroll'
      }}>
        <div className="p-4 pb-8 space-y-5">
          {/* Element Tag */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Element Type
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedElement.tag}
                readOnly
                className="w-full px-4 py-3 text-sm font-mono rounded-lg transition-all"
                style={{ 
                  backgroundColor: 'var(--panel-header)', 
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)'
                }}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Text Content - Only show for leaf elements (no child elements) */}
          {selectedElement.textContent !== undefined && !selectedElement.hasChildElements && (
            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Text Content
              </label>
              <textarea
                value={selectedElement.textContent}
                onChange={(e) => handleInputChange("textContent", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md transition-all resize-none"
                style={{ 
                  backgroundColor: 'var(--panel-bg)', 
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)'
                }}
                rows={3}
                placeholder="Enter text content..."
              />
            </div>
          )}

          {/* Only show styling properties for leaf elements (no child elements) */}
          {!selectedElement.hasChildElements && (
            <>
              {/* Color */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Text Color
                </label>
                <div className="flex gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={rgbToHex(selectedElement.color || "#000000")}
                      onChange={(e) => handleInputChange("color", e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2"
                      style={{ border: '2px solid var(--border)' }}
                    />
                  </div>
                  <input
                    type="text"
                    value={selectedElement.color || ""}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-4 py-3 text-sm font-mono rounded-lg transition-all hover:shadow-sm"
                    style={{ 
                      backgroundColor: 'var(--panel-bg)', 
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Background Color
                </label>
                <div className="flex gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={rgbToHex(selectedElement.backgroundColor || "#ffffff")}
                      onChange={(e) => handleInputChange("backgroundColor", e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2"
                      style={{ border: '2px solid var(--border)' }}
                    />
                  </div>
                  <input
                    type="text"
                    value={selectedElement.backgroundColor || ""}
                    onChange={(e) => handleInputChange("backgroundColor", e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1 px-4 py-3 text-sm font-mono rounded-lg transition-all"
                    style={{ 
                      backgroundColor: 'var(--panel-bg)', 
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Font Size
                </label>
                <input
                  type="text"
                  value={selectedElement.fontSize || ""}
                  onChange={(e) => handleInputChange("fontSize", e.target.value)}
                  placeholder="16px"
                  className="w-full px-4 py-3 text-sm font-mono rounded-lg transition-all hover:shadow-sm"
                  style={{ 
                    backgroundColor: 'var(--panel-bg)', 
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Font Weight */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Font Weight
                </label>
                <select
                  value={selectedElement.fontWeight || "normal"}
                  onChange={(e) => handleInputChange("fontWeight", e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-lg transition-all appearance-none cursor-pointer"
                  style={{ 
                    backgroundColor: 'var(--panel-bg)', 
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 12px center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '16px'
                  }}
                >
                  <option value="normal">Normal (400)</option>
                  <option value="100">Thin (100)</option>
                  <option value="200">Extra Light (200)</option>
                  <option value="300">Light (300)</option>
                  <option value="400">Normal (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">Semi Bold (600)</option>
                  <option value="700">Bold (700)</option>
                  <option value="800">Extra Bold (800)</option>
                  <option value="900">Black (900)</option>
                </select>
              </div>

              {/* Padding */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Padding
                </label>
                <input
                  type="text"
                  value={selectedElement.padding || ""}
                  onChange={(e) => handleInputChange("padding", e.target.value)}
                  placeholder="16px"
                  className="w-full px-4 py-3 text-sm font-mono rounded-lg transition-all hover:shadow-sm"
                  style={{ 
                    backgroundColor: 'var(--panel-bg)', 
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Margin */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Margin
                </label>
                <input
                  type="text"
                  value={selectedElement.margin || ""}
                  onChange={(e) => handleInputChange("margin", e.target.value)}
                  placeholder="16px"
                  className="w-full px-4 py-3 text-sm font-mono rounded-lg transition-all hover:shadow-sm"
                  style={{ 
                    backgroundColor: 'var(--panel-bg)', 
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Border */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Border
                </label>
                <input
                  type="text"
                  value={selectedElement.border || ""}
                  onChange={(e) => handleInputChange("border", e.target.value)}
                  placeholder="1px solid #e5e7eb"
                  className="w-full px-4 py-3 text-sm font-mono rounded-lg transition-all hover:shadow-sm"
                  style={{ 
                    backgroundColor: 'var(--panel-bg)', 
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Border Radius */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Border Radius
                </label>
                <input
                  type="text"
                  value={selectedElement.borderRadius || ""}
                  onChange={(e) => handleInputChange("borderRadius", e.target.value)}
                  placeholder="8px"
                  className="w-full px-4 py-3 text-sm font-mono rounded-lg transition-all hover:shadow-sm"
                  style={{ 
                    backgroundColor: 'var(--panel-bg)', 
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
