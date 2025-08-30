import { Suspense } from 'react';
import WebsiteEditor from '../components/website-editor';

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WebsiteEditor />
    </Suspense>
  );
}
