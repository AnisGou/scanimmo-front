# 📊 Formule de Calcul du Score Scanimmo

## Principe Général

**Score = Base (50) + Somme des facteurs pondérés**

- Score minimum: **0**
- Score maximum: **100**
- Seuils d'interprétation:
  - ≥ 70: 🟢 Potentiel élevé (vert)
  - 50-69: 🟡 Potentiel modéré (jaune)
  - < 50: 🔴 Potentiel limité (rouge)

---

## Version Actuelle (V1)

### Score de base: **50 points**

### Facteurs évalués

| Critère | Condition | Impact | Points |
|---------|-----------|--------|--------|
| **Zonage** | Commence par H ou C | Favorable | +15 |
| | Commence par I | Industriel | -10 |
| | Autre | Neutre | 0 |
| **Pente** | < 5% | Terrain plat | +10 |
| | 5-10% | Pente modérée | +5 |
| | > 10% | Pente forte | -15 |
| | null | Pas de donnée | 0 |
| **LiDAR** | OUTSIDE_COVERAGE | Données limitées | -3 |
| | WITHIN ou NEAREST_OK | OK | 0 |
| **Contamination** | true | Site répertorié | -20 |
| | false | Aucun site | +5 |
| | null | Inconnu | 0 |
| **Zone inondable** | true | Zone 0-20 ans | -15 |
| | false | Hors zone | +5 |
| | null | Inconnu | 0 |
| **Densité (COS)** | > 2 | Haute densité | +10 |
| | ≤ 2 ou null | Standard | 0 |

### Exemples de calcul

#### Exemple 1: Vos 3 propriétés (Score = 57)

```
Base:                           50
Zonage "66xxx" (ni H/C/I):      +0
Pente null (pas de données):    +0
LiDAR OUTSIDE_COVERAGE:         -3
Contamination = false:          +5
Zone inondable = false:         +5
Densité null ou ≤ 2:            +0
────────────────────────────────────
TOTAL:                          57
```

**Problème:** Beaucoup de propriétés ont des données null similaires → même score!

#### Exemple 2: Terrain favorable

```
Base:                           50
Zonage H1 (résidentiel):       +15
Pente 3.2% (plat):             +10
Contamination = false:          +5
Zone inondable = false:         +5
Densité 3.5:                   +10
────────────────────────────────────
TOTAL:                          95 (capped à 100)
```

#### Exemple 3: Terrain contraint

```
Base:                           50
Zonage I (industriel):         -10
Pente 18% (forte):             -15
Contamination = true:          -20
Zone inondable = false:         +5
────────────────────────────────────
TOTAL:                          10
```

---

## Version 2 (Améliorée)

### Ajouts pour plus de diversité

| Critère | Condition | Impact | Points |
|---------|-----------|--------|--------|
| **Zonage détaillé** | H ou R (résidentiel) | Très favorable | +15 |
| | C (commercial) | Favorable | +12 |
| | M (mixte) | Bon | +10 |
| | Autre (ex: 66xxx) | Spécifique | **+5** ⭐ |
| | I (industriel) | Défavorable | -10 |
| **Superficie** | ≥ 10000 m² | Grande | +15 |
| | ≥ 5000 m² | Bonne | +10 |
| | ≥ 2000 m² | Moyenne | +5 |
| | < 1000 m² | Petite | -5 |
| | null | Inconnu | 0 |
| **Prix au m²** | < 50 $/m² | Avantageux | +8 |
| | 50-200 $/m² | Normal | 0 |
| | > 200 $/m² | Élevé | -8 |
| **Densité (COS)** | ≥ 3 | Haute | +15 |
| | ≥ 2 | Bonne | +10 |
| | ≥ 1 | Moyenne | +5 |
| | < 1 | Faible | -5 |
| | null | Inconnu | 0 |
| **Hauteur max** | ≥ 15m | Élevée | +10 |
| | ≥ 10m | Moyenne | +5 |
| | < 8m | Limitée | -5 |
| | null | Inconnu | 0 |
| **LiDAR** | WITHIN | Données précises | +3 |
| | NEAREST_OK | OK | 0 |
| | OUTSIDE_COVERAGE | Limitées | -3 |

### Exemples avec V2

#### Propriété 1: 258894478510000000

```
Données:
- zone_code: 66007Fb
- valeur_totale: 44500
- superficie: 5500 m² (estimé)
- Prix/m²: 44500 / 5500 = 8.09 $/m²

Calcul V2:
Base:                           50
Zonage "66007Fb":               +5  ⭐ (au lieu de 0)
Superficie 5500 m²:            +10  ⭐
Prix 8$/m² (avantageux):        +8  ⭐
LiDAR OUTSIDE_COVERAGE:         -3
Contamination false:            +5
Zone inondable false:           +5
────────────────────────────────────
TOTAL:                          80  🟢
```

#### Propriété 2: 258895642910000000

```
Données:
- zone_code: 66007Fb
- valeur_totale: 97000
- superficie: 8000 m² (estimé)
- Prix/m²: 97000 / 8000 = 12.13 $/m²

Calcul V2:
Base:                           50
Zonage "66007Fb":               +5
Superficie 8000 m²:            +10
Prix 12$/m² (avantageux):       +8
LiDAR OUTSIDE_COVERAGE:         -3
Contamination false:            +5
Zone inondable false:           +5
────────────────────────────────────
TOTAL:                          80  🟢
```

#### Propriété 3: 258968770010000000

```
Données:
- zone_code: 66002Fa
- valeur_totale: 271000
- superficie: 6500 m² (estimé)
- Prix/m²: 271000 / 6500 = 41.69 $/m²

Calcul V2:
Base:                           50
Zonage "66002Fa":               +5
Superficie 6500 m²:            +10
Prix 42$/m² (avantageux):       +8
LiDAR OUTSIDE_COVERAGE:         -3
Contamination false:            +5
Zone inondable false:           +5
────────────────────────────────────
TOTAL:                          80  🟢
```

**Note:** Si les superficies réelles diffèrent, les scores changeront!

---

## Comparaison V1 vs V2

| Aspect | V1 | V2 |
|--------|----|----|
| **Critères évalués** | 6 | 9 |
| **Poids max d'un critère** | 20 pts | 20 pts |
| **Gestion données null** | Neutre (0 pt) | Partiellement compensé |
| **Diversité des scores** | ⚠️ Faible (beaucoup de 57) | ✅ Élevée |
| **Importance superficie** | ❌ Ignorée | ✅ Prise en compte |
| **Importance prix** | ❌ Ignorée | ✅ Prix/m² évalué |
| **Zonages non-standard** | 0 pt | +5 pts |

---

## Recommandations

### Pour des scores plus différenciés

1. **Enrichir vos données:**
   - Ajouter la superficie réelle (pas estimée)
   - Compléter cos_max (densité)
   - Compléter hauteur_max_etages
   - Obtenir plus de couverture LiDAR

2. **Passer à la V2:**
   ```bash
   # Activer la nouvelle formule
   mv lib/calculate-score.ts lib/calculate-score-v1-backup.ts
   mv lib/calculate-score-v2.ts lib/calculate-score.ts
   ```

3. **Ajuster les pondérations:**
   - Si superficie est critique pour vous: augmenter à +20/+15/+10
   - Si contamination est rédhibitoire: augmenter à -30
   - Si densité est prioritaire: augmenter à +20

### Exemple: Ajustement personnalisé

```typescript
// Si vous voulez privilégier la densité constructible
if (data.densite_max !== null) {
  if (data.densite_max >= 3) {
    score += 20; // Au lieu de +15
    factors.push({ text: "Haute densité (COS ≥ 3)", impact: 20 });
  }
  // ...
}
```

---

## Questions Fréquentes

### Pourquoi 50 comme base?

Score neutre permettant d'évaluer positivement ET négativement. Un terrain "moyen" sans données exceptionnelles reste à ~50.

### Pourquoi la contamination vaut -20?

Impact majeur sur la faisabilité et les coûts. C'est souvent rédhibitoire pour un projet.

### Peut-on avoir un score > 100?

Non, le score est "clamped" entre 0 et 100 (ligne: `score = Math.max(0, Math.min(100, score))`)

### Comment interpréter un score de 57?

57 = Potentiel modéré (🟡)
- Pas de gros problèmes identifiés
- Pas de gros avantages non plus
- Manque de données pour affiner

### Les 3 propriétés auront-elles le même score avec V2?

**Non!** Avec la V2, elles auront des scores différents basés sur:
- Leur superficie réelle
- Leur prix au m² (valeur_totale / superficie)
- Leur densité et hauteur max si disponibles

---

## Formule Mathématique Complète

```
Score_final = CLAMP(0, 100, Score_base + Σ(facteurs_pondérés))

Où:
- Score_base = 50
- facteurs_pondérés = {zonage, superficie, pente, contamination, ...}
- CLAMP(min, max, value) = min(max, max(min, value))
```

### Pseudo-code

```python
score = 50

# Zonage
if zonage.startsWith("H") or zonage.startsWith("C"):
    score += 15
elif zonage.startsWith("I"):
    score -= 10

# Pente
if pente is not None:
    if pente < 5:
        score += 10
    elif pente < 10:
        score += 5
    else:
        score -= 15

# ... autres facteurs

# Clamp
score = max(0, min(100, score))
```

---

## Pour aller plus loin

### Machine Learning?

Pour des scores vraiment personnalisés, vous pourriez entraîner un modèle ML sur vos propres données:
- Variables: tous les champs disponibles
- Target: vos décisions passées (achat/rejet)
- Modèle: Random Forest ou Gradient Boosting

### Scores par usage

Créer des formules différentes selon l'objectif:
- **score_residential**: Privilégie zonage H, densité moyenne
- **score_commercial**: Privilégie zonage C, accès, visibilité
- **score_promoteur**: Privilégie densité max, hauteur, superficie

```typescript
export function calculateScoreForPromotor(data: PropertyPreview): ScoreResult {
  // Pondérations différentes pour promoteurs
  // Densité compte pour 2x plus
  // Superficie compte pour 2x plus
  // ...
}
```
