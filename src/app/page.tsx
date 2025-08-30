import { Suspense } from 'react';
import WebsiteEditor from '../components/website-editor';

export default function Home() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            Loading React Visual Editor...
          </div>
        </div>
      </div>
    }>
      <WebsiteEditor />
    </Suspense>
  );
}
