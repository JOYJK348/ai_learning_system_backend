'use client';

import React from 'react';

export default function PaymentDetailPage({ params }: { params: { id: string } }) {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Payment Detail: {params.id}</h1>
    </main>
  );
}
