"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';

export default function QualityClient() {
  const params = useSearchParams();
  const q = params.get('q');

  return <div>Quality: {q ?? 'none'}</div>;
}
