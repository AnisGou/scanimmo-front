'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Scanimmo] Erreur non gérée:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      background: '#FAF8F5',
      color: '#1B2A4A',
      padding: 24,
      textAlign: 'center',
    }}>
      <h1 style={{
        fontFamily: "var(--font-display), serif",
        fontSize: 28,
        marginBottom: 12,
      }}>
        Une erreur est survenue
      </h1>
      <p style={{ color: '#6B7280', fontSize: 15, marginBottom: 24, maxWidth: 400 }}>
        Nous nous excusons pour l'inconvénient. Veuillez réessayer.
      </p>
      <button
        onClick={reset}
        style={{
          background: '#1B2A4A',
          color: '#C8A96E',
          border: 'none',
          borderRadius: 10,
          padding: '12px 28px',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Réessayer
      </button>
    </div>
  );
}
