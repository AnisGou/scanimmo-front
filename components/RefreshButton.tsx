"use client";

/**
 * RefreshButton Component
 * @description Bouton pour rafraîchir la page (Client Component)
 */

interface RefreshButtonProps {
  className?: string;
  children: React.ReactNode;
}

export function RefreshButton({ className, children }: RefreshButtonProps) {
  return (
    <button
      onClick={() => window.location.reload()}
      className={className}
    >
      {children}
    </button>
  );
}
