/**
 * Composant CheckoutButton
 * @description Bouton CTA épuré style DeepBlocks
 */

"use client";

import { useState } from "react";
import type { Tier } from "@/lib/types";

interface CheckoutButtonProps {
  matricule: string;
  tier: Tier;
  email?: string;
}

const TIER_PRICES = {
  essentiel: "19$",
  complet: "49$",
  promoteur: "149$",
};

export function CheckoutButton({ matricule, tier, email }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule, tier, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erreur lors de la création de la session");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      alert("Erreur de connexion");
      setLoading(false);
    }
  };

  // Style variants
  const isComplet = tier === "complet";
  const baseClasses = "w-full py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses = isComplet
    ? "bg-white text-gray-900 hover:bg-gray-100"
    : "border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white";

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`${baseClasses} ${variantClasses}`}
    >
      {loading ? "REDIRECTION..." : `OBTENIR — ${TIER_PRICES[tier]}`}
    </button>
  );
}
