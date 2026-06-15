'use client';

import React from 'react';

export default function SchoolDetailPage({ params }: { params: { id: string } }) {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>School Detail: {params.id}</h1>
      {/* School Detail (full page) */}
    </main>
  );
}
