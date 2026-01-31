"use client";
import React from 'react';
import { useSearchParams } from 'next/navigation';

export default function ClientAdminPanel() {
  const params = useSearchParams();
  const q = params.get('q');
  return <div>Admin root query: {q ?? 'none'}</div>;
}
