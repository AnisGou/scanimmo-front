import Link from 'next/link';

export default function NotFound() {
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
        fontSize: 48,
        marginBottom: 8,
        color: '#C8A96E',
      }}>
        404
      </h1>
      <p style={{ fontSize: 18, marginBottom: 8 }}>
        Page introuvable
      </p>
      <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>
        {"L'adresse demandée n'existe pas ou a été déplacée."}
      </p>
      <Link
        href="/"
        style={{
          background: '#1B2A4A',
          color: '#C8A96E',
          borderRadius: 10,
          padding: '12px 28px',
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Retour {"à"} {"l'accueil"}
      </Link>
    </div>
  );
}
