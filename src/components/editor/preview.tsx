import React from "react";
import Frame from "react-frame-component";

interface PreviewProps {
  compiledCode: string;
  error?: string;
}

export default function Preview({ compiledCode, error }: PreviewProps) {
  const frameContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { 
            margin: 0; 
            padding: 20px; 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .error {
            color: #ef4444;
            background: #fef2f2;
            border: 1px solid #fecaca;
            padding: 12px;
            border-radius: 6px;
            font-family: monospace;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <div id="root">Loading...</div>
        <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script>
          console.log('=== IFRAME PREVIEW ===');
          const errorMessage = ${JSON.stringify(error)};
          const codeToExecute = ${
            compiledCode ? JSON.stringify(compiledCode) : "null"
          };
          
          console.log('Error message:', errorMessage);
          console.log('Code to execute:', codeToExecute);
          console.log('Type of codeToExecute:', typeof codeToExecute);
          
          function renderComponent() {
            try {
              if (errorMessage) {
                document.getElementById('root').innerHTML = 
                  '<div class="error">Compilation Error:\\n' + errorMessage + '</div>';
              } else if (codeToExecute && codeToExecute !== 'null') {
                console.log('About to eval code:', codeToExecute);
                const element = eval(codeToExecute);
                console.log('Eval result:', element);
                const rootElement = document.getElementById('root');
                const root = ReactDOM.createRoot(rootElement);
                root.render(element);
              } else {
                document.getElementById('root').innerHTML = 
                  '<div style="color: #6b7280; font-style: italic;">No component to preview</div>';
              }
            } catch (err) {
              console.error('Runtime error caught:', err);
              document.getElementById('root').innerHTML = 
                '<div class="error">Runtime Error:\\n' + err.message + '</div>';
            }
          }
          
          // Wait for React to load
          if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
            renderComponent();
          } else {
            window.addEventListener('load', renderComponent);
          }
        </script>
      </body>
    </html>
  `;

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium">
        Live Preview
      </div>
      <div className="flex-1 bg-white">
        <Frame
          style={{ width: "100%", height: "100%", border: "none" }}
          initialContent={frameContent}
        >
          <div></div>
        </Frame>
      </div>
    </div>
  );
}
