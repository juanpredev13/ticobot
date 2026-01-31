import React, { Suspense } from 'react';
import ClientAdminPanel from './ClientAdminPanel';

// Server component: uses a client component with Suspense boundary
export default function AdminPage() {
  return (
    <Suspense fallback={<div>Loading admin...</div>}>
      <ClientAdminPanel />
    </Suspense>
  );
}
