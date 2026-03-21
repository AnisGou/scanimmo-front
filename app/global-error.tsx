'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Scanimmo] Erreur critique:', error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{
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
        margin: 0,
      }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>
          Erreur critique
        </h1>
        <p style={{ color: '#6B7280', fontSize: 15, marginBottom: 24 }}>
          L{"'"}application a rencontré un problème inattendu.
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
          Recharger
        </button>
      </body>
    </html>
  );
}
