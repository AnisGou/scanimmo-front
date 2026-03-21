/**
 * Composant SourcesDisclaimer
 * @description Affiche les sources de données et disclaimers
 *
 * Props: hasLidar: boolean, municipality: string
 *
 * Texte: "Sources : [municipality] · Données ouvertes Québec · LiDAR (si dispo) · Certaines limites s'appliquent"
 */

interface SourcesDisclaimerProps {
  hasLidar: boolean;
  municipality: string;
}

export function SourcesDisclaimer({ hasLidar, municipality }: SourcesDisclaimerProps) {
  return (
    <div className="bg-gray-50 border-t border-gray-200 rounded-b-lg p-4 text-xs text-gray-600">
      <p>
        <span className="font-semibold">Sources : </span>
        {municipality}
        {" · "}
        Données ouvertes Québec
        {hasLidar && " · LiDAR"}
        {" · "}
        <span className="italic">Certaines limites s'appliquent</span>
      </p>
      <p className="mt-2 text-gray-500">
        Les données présentées sont basées sur les informations publiques disponibles
        et ne constituent pas un avis professionnel. Consultez un expert pour toute
        décision d'achat ou de développement.
      </p>
    </div>
  );
}
