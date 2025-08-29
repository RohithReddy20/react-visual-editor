interface CodeInputProps {
  code: string;
  onChange: (code: string) => void;
}

export default function CodeInput({ code, onChange }: CodeInputProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium">
        React Component Code
      </div>
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 p-4 font-mono text-sm bg-gray-900 text-green-400 border-none outline-none resize-none"
        placeholder="Paste your React component code here..."
        spellCheck={false}
      />
    </div>
  );
}