/**
 * Composant TrustBlock
 * @description Affiche les indicateurs de confiance près du CTA
 *
 * Affiche:
 * ✅ Paiement sécurisé Stripe
 * ✅ PDF disponible 30 jours
 * ✅ Remboursé 24h si problème technique
 */

export function TrustBlock() {
  const trustItems = [
    {
      icon: "🔒",
      text: "Paiement sécurisé Stripe",
    },
    {
      icon: "📄",
      text: "PDF disponible 30 jours",
    },
    {
      icon: "✅",
      text: "Remboursé 24h si problème technique",
    },
  ];

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="space-y-2">
        {trustItems.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm text-gray-700 font-medium">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
