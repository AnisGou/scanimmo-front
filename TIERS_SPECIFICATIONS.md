# 📋 Spécifications des Tiers de Rapports Scanimmo

## Vue d'ensemble

| Tier | Prix | Public cible | Sections | Pages estimées |
|------|------|--------------|----------|----------------|
| **Essentiel** | 19$ | Propriétaires, curieux | 5 sections | 3-4 pages |
| **Complet** | 49$ | Acheteurs, investisseurs | 8 sections | 8-12 pages |
| **Promoteur** | 149$ | Promoteurs, banques | 12 sections | 15-25 pages |

---

## 🔵 Rapport Essentiel (19$)

### Objectif
Vue d'ensemble rapide du potentiel constructible.

### Sections incluses

#### 1. En-tête du rapport
- Logo Scanimmo
- Adresse de la propriété
- Matricule
- Date de génération
- Numéro de rapport

#### 2. Score de potentiel
- **Score global** (0-100) avec code couleur
- **Top 3 facteurs** influençant le score
- Jauge visuelle
- Interprétation (Favorable / Modéré / Contraint)

#### 3. Informations de base
- **Zonage actuel**: Code + description générale
- **Superficie du terrain**: En m² et pi²
- **Évaluation municipale**: Terrain + Bâtiment + Total
- **Année de construction**: Si bâtiment existant

#### 4. Analyse topographique (si disponible)
- **Pente moyenne**: En %
- **Dénivellation**: Min/Max/Moyenne en mètres
- **Qualité des données**: Source LiDAR (WITHIN/NEAREST/OUTSIDE)
- Icône: ✅ Données précises / ⚠️ Approximatives / ❌ Indisponibles

#### 5. Contraintes identifiées
- **Zone inondable**: ✅ Non / ⚠️ 0-20 ans / ⚠️ 20-100 ans
- **Contamination**: Statut si connu (OUI/NON/Inconnu)
- **Zone agricole**: Si applicable

#### 6. Disclaimer
> "Ce rapport constitue un indicateur d'aide à la décision basé sur les données publiques disponibles au [date]. Il ne constitue ni une garantie, ni un avis professionnel ou réglementaire. Une validation par un arpenteur, architecte ou urbaniste est recommandée avant toute transaction."

### Exemple pour 469256840110000000

```markdown
# RAPPORT ESSENTIEL
8475 Avenue des Flandres, Québec
Matricule: 469256840110000000

## Score de Potentiel: 80/100 🟢
Projet favorable

Top 3 facteurs:
• Zonage résidentiel favorable
• Terrain plat (pente 1.72%)
• Hors zone inondable

## Informations de Base
- Zonage: 44014Ha (Résidentiel haute densité)
- Superficie: 603.9 m² (6,500 pi²)
- Évaluation: 338,000$ (terrain: 181,000$ + bâtiment: 157,000$)
- Année construction: 1966

## Topographie
- Pente moyenne: 1.72% ✅ (terrain plat)
- Dénivellation: 30.1m (élévation 96-126m)
- Données LiDAR: Haute précision ✅

## Contraintes
- Zone inondable: ✅ Non
- Contamination: Données non disponibles
- Zone agricole: Non
```

---

## 🟢 Rapport Complet (49$)

### Objectif
Analyse détaillée pour décision d'achat éclairée.

### Sections incluses = Essentiel + 3 sections avancées

#### 7. Potentiel constructible détaillé
- **Coefficient d'occupation du sol (COS)**: Si disponible
- **Hauteur maximale permise**: En mètres et étages
- **Densité constructible**: Nombre de logements estimé
- **Marges de recul**: Si disponibles dans règlement
- **Calcul de la superficie constructible**:
  ```
  Superficie terrain: 603.9 m²
  COS max: [si disponible]
  Superficie constructible: terrain × COS = [résultat] m²

  Exemple avec COS 2.0:
  603.9 × 2.0 = 1,207.8 m² constructibles
  ```

#### 8. Analyse de rentabilité (3 scénarios)

**Scénario 1: Conservation actuelle**
- Valeur actuelle: 338,000$
- Revenu locatif potentiel: [estimé]

**Scénario 2: Rénovation**
- Coût estimé: [selon année]
- Valeur après rénovation: [estimé]
- ROI: [%]

**Scénario 3: Démolition-Reconstruction**
- Coût démolition: [estimé selon m²]
- Coût construction neuve: [selon densité]
- Nombre de logements: [calculé]
- Revenus bruts estimés: [selon marché]
- ROI: [%]

#### 9. Alertes et recommandations
- ⚠️ **Points d'attention**:
  - Bâtiment âgé (1966) → inspection recommandée
  - Petit terrain (604 m²) → densité limitée
  - COS non disponible → vérifier règlement municipal

- ✅ **Points forts**:
  - Terrain plat (1.72%)
  - Hors zone inondable
  - Zonage résidentiel favorable

- 📋 **Prochaines étapes**:
  1. Consulter service d'urbanisme pour COS exact
  2. Vérifier règlement 44014Ha pour marges
  3. Évaluation structurelle bâtiment existant
  4. Étude de marché quartier Des Flandres

#### 10. Contexte de quartier (si disponible)
- Nom du quartier
- Prix médian au m²
- Tendances du marché

### Différence clé avec Essentiel
| Aspect | Essentiel | Complet |
|--------|-----------|---------|
| Score | ✅ | ✅ |
| Contraintes | ✅ | ✅ Détaillé |
| COS/Densité | ❌ | ✅ |
| Scénarios rentabilité | ❌ | ✅ 3 scénarios |
| Recommandations | ❌ | ✅ Personnalisées |
| Alertes prioritaires | ❌ | ✅ |

---

## 🔴 Rapport Promoteur (149$)

### Objectif
Dossier professionnel pour banques, investisseurs, partenaires.

### Sections incluses = Complet + 4 sections professionnelles

#### 11. Analyse réglementaire approfondie
- **Règlement de zonage complet**: Extraction des articles pertinents
- **Usages permis**: Liste exhaustive
- **Usages conditionnels**: Avec conditions
- **Grilles de spécifications**: Tableau complet

  | Paramètre | Valeur | Source |
  |-----------|--------|--------|
  | COS maximum | [X] | Règlement art. XX |
  | Hauteur max | [X]m / [X] étages | Règlement art. XX |
  | Marge avant | [X]m | Règlement art. XX |
  | Marge latérale | [X]m | Règlement art. XX |
  | Marge arrière | [X]m | Règlement art. XX |
  | Aire verte min | [X]% | Règlement art. XX |
  | Stationnement | [X] places / logement | Règlement art. XX |

#### 12. Calculs de faisabilité détaillés

**Configuration optimale recommandée:**

Pour 603.9 m² avec COS 2.0 (hypothèse):

```
ÉTAPE 1: Superficie constructible brute
603.9 m² × 2.0 = 1,207.8 m²

ÉTAPE 2: Déductions
- Stationnements intérieurs: -150 m² (5 places × 30 m²)
- Circulations/cage escalier: -120 m² (10% du brut)
- Espaces techniques: -60 m² (5% du brut)
= Superficie nette habitable: 877.8 m²

ÉTAPE 3: Nombre de logements
Si 3½ de 65 m² chacun:
877.8 / 65 = 13.5 → 13 logements max

ÉTAPE 4: Configuration proposée
- 8 × 3½ (65 m²) = 520 m²
- 4 × 4½ (85 m²) = 340 m²
- Total: 860 m² (respect limite)

ÉTAPE 5: Revenus projetés
3½ à 1,400$/mois × 8 = 11,200$/mois
4½ à 1,800$/mois × 4 = 7,200$/mois
Total brut: 18,400$/mois = 220,800$/an

ÉTAPE 6: Coûts estimés
- Démolition: 30,000$
- Construction: 1,200,000$ (1,400$/m² × 860 m²)
- Terrain: 338,000$ (prix d'achat)
- Contingence 10%: 156,800$
= TOTAL: 1,724,800$

ÉTAPE 7: ROI
Revenus annuels: 220,800$
Rendement brut: 12.8%
Rendement net (après 35% frais): 8.3%
```

#### 13. Comparables et analyse de marché
- **3 propriétés similaires** vendues dans le secteur
- Prix au m², prix au logement
- Tendances sur 12/24/36 mois
- Position par rapport au marché

| Adresse | Superficie | Prix | Prix/m² | Date vente |
|---------|------------|------|---------|------------|
| Comparable 1 | 650 m² | 360,000$ | 554$/m² | 2025-11 |
| Comparable 2 | 580 m² | 310,000$ | 534$/m² | 2025-09 |
| **Sujet** | **604 m²** | **338,000$** | **560$/m²** | - |
| Médiane secteur | 620 m² | 340,000$ | 548$/m² | - |

**Analyse:** Prix légèrement au-dessus de la médiane (+2%).

#### 14. Visualisations et annexes
- **Plan de masse schématique**: Implantation proposée avec marges
- **Graphiques**:
  - Évolution valeur foncière (5 ans)
  - Répartition revenus par type logement
  - Timeline du projet (permis → livraison)
- **Cartes détaillées**:
  - Localisation
  - Zone inondable (carte officielle)
  - Contamination (rayon 500m)
  - Équipements publics (écoles, parcs, transports)

#### 15. Sommaire exécutif (1 page)
Résumé pour décideurs pressés:
- Enjeu: [1 phrase]
- Opportunité: [1 phrase]
- Risques: [3 bullets]
- Recommandation: [GO / NO-GO / CONDITIONNEL]
- ROI estimé: [%]

### Différence clé avec Complet
| Aspect | Complet | Promoteur |
|--------|---------|-----------|
| Scénarios | 3 génériques | 1 optimisé détaillé |
| Calculs | Estimés | Précis avec formules |
| Réglementaire | Résumé | Articles complets |
| Comparables | ❌ | ✅ 3+ propriétés |
| Visuels | Basique | Plans + Graphiques |
| Format | PDF standard | Dossier pro multi-pages |
| Sommaire exécutif | ❌ | ✅ 1 page décideurs |

---

## Résumé visuel

```
ESSENTIEL (19$)          COMPLET (49$)              PROMOTEUR (149$)
─────────────            ──────────────             ─────────────────
1. En-tête               1-6. [Essentiel]           1-10. [Complet]
2. Score                 +
3. Infos de base         7. Potentiel détaillé      11. Réglementaire complet
4. Topographie           8. Rentabilité 3 scénarios 12. Faisabilité détaillée
5. Contraintes           9. Alertes & recommandations 13. Comparables marché
6. Disclaimer            10. Contexte quartier      14. Visualisations
                                                    15. Sommaire exécutif

3-4 pages                8-12 pages                 15-25 pages
PDF simple               PDF détaillé               Dossier professionnel
```

---

## Pour 469256840110000000 spécifiquement

### Données manquantes à enrichir

Pour améliorer les rapports, il faudrait:

1. **COS max (cos_max: null)** → Aller chercher dans règlement 44014Ha
2. **Hauteur max (hauteur_max_etages: null)** → Idem
3. **Contamination (contamination_statut: null)** → Vérifier registre
4. **Comparables marché** → Scraping MLS ou Centris
5. **Aires vertes min** → Règlement
6. **Stationnement requis** → Règlement

### Ordre de priorité

1. **Essentiel**: Fonctionnel dès maintenant (toutes données présentes)
2. **Complet**: Nécessite COS + hauteur pour calculs précis
3. **Promoteur**: Nécessite tout le règlement + comparables

---

## Implémentation technique

### Structure de fichiers

```
lib/
  generate-pdf/
    common.ts         # Sections communes (1-6)
    essentiel.ts      # Génération tier Essentiel
    complet.ts        # Sections 7-10
    promoteur.ts      # Sections 11-15

    templates/
      header.html
      score-card.html
      regulatory-table.html
      roi-calculation.html
```

### Logique de génération

```typescript
export async function generateReport(
  property: PropertyFull,
  tier: Tier
): Promise<Buffer> {

  const sections = [];

  // Sections communes (toujours)
  sections.push(
    generateHeader(property),
    generateScore(property),
    generateBasicInfo(property),
    generateTopography(property),
    generateConstraints(property),
    generateDisclaimer()
  );

  // Sections Complet+
  if (tier === "complet" || tier === "promoteur") {
    sections.push(
      generatePotential(property),
      generateROI(property),
      generateRecommendations(property),
      generateNeighborhood(property)
    );
  }

  // Sections Promoteur uniquement
  if (tier === "promoteur") {
    sections.push(
      generateRegulatory(property),
      generateDetailedFeasibility(property),
      generateComparables(property),
      generateVisualizations(property),
      generateExecutiveSummary(property)
    );
  }

  return await renderPDF(sections);
}
```
