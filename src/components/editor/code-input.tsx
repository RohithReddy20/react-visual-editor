interface CodeInputProps {
  code: string;
  onChange: (code: string) => void;
}

export default function CodeInput({ code, onChange }: CodeInputProps) {
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--panel-bg)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ 
        backgroundColor: 'var(--panel-header)', 
        borderColor: 'var(--border)'
      }}>
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
            <line x1="12" y1="22" x2="12" y2="15.5"/>
            <polyline points="22,8.5 12,15.5 2,8.5"/>
          </svg>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Component Code
          </span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 text-xs font-mono rounded" style={{ 
          backgroundColor: 'var(--background)', 
          color: 'var(--text-muted)',
          border: '1px solid var(--border)'
        }}>
          JSX
        </div>
      </div>
      <div className="flex-1 relative">
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full p-4 text-sm border-none outline-none resize-none"
          style={{ 
            backgroundColor: '#0d1117',
            color: '#c9d1d9',
            fontFamily: 'var(--font-mono)',
            lineHeight: '1.5',
            tabSize: '2'
          }}
          placeholder="function MyComponent() {
  return <div>Hello World</div>;
}"
          spellCheck={false}
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 text-xs rounded" style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          color: '#8b949e',
          backdropFilter: 'blur(8px)'
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.69a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Auto-save
        </div>
      </div>
    </div>
  );
}