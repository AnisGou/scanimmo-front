/**
 * Generateur de PDF V4 — Noir, blanc, nuances de gris
 * @description Rapport professionnel — texte et tableaux uniquement, aucun diagramme, aucune icone
 */

import type { Tier } from "./types";

// ============================================================
// FORMATTERS NULL-SAFE
// Regle absolue : TOUJOURS tester avec != null, JAMAIS truthiness
// Raison : 0, false, '' sont des valeurs valides (BUG-001)
// ============================================================

const ND = 'Non disponible';

const show = (v: unknown): string =>
  v != null ? String(v) : ND;

const showInt = (v: number | null | undefined): string =>
  v != null ? Math.floor(Number(v)).toLocaleString('fr-CA') : ND;

const showYear = (v: number | null | undefined): string => {
  if (v == null) return ND;
  const n = Number(v);
  if (!Number.isInteger(n)) {
    console.warn(`[PDF] annee_construction non-entier: ${v}`);
  }
  return String(Math.floor(n));
};

const showNum = (v: number | null | undefined, decimals = 2): string =>
  v != null ? Number(v).toFixed(decimals) : ND;

const showM2 = (v: number | null | undefined): string =>
  v != null
    ? `${Number(v).toLocaleString('fr-CA', { maximumFractionDigits: 1 })} m&sup2;`
    : ND;

const showM = (v: number | null | undefined): string =>
  v != null ? `${Number(v).toLocaleString('fr-CA', { maximumFractionDigits: 1 })} m` : ND;

const showCAD = (v: number | null | undefined): string =>
  v != null
    ? `${Number(v).toLocaleString('fr-CA', { maximumFractionDigits: 0 })} $`
    : ND;

const showPct = (v: number | null | undefined): string =>
  v != null ? `${Number(v).toFixed(2)} %` : ND;

const showElev = (v: number | null | undefined): string =>
  v != null ? `${Number(v).toFixed(2)} m` : ND;

// ============================================================
// REPORT DATA INTERFACE
// ============================================================

export interface ReportData {
  matricule: string;
  adresse: string;
  municipalite: string;
  tier: Tier;
  // === FICHE PROPRIETE ===
  zone_code: string;
  superficie_m2: number;
  valeur_totale: number;
  valeur_terrain: number;
  valeur_batiment: number;
  annee_construction?: number | null;
  nb_etages?: number | null;
  nb_logements?: number | null;
  superficie_batiment_m2?: number | null;
  // === REGLEMENTATION & ZONAGE ===
  cos_max?: number | null;
  hauteur_max_etages?: number | null;
  aire_verte_min_pct?: number | null;
  qc_hauteur_max_m?: number | null;
  qc_dominante_label?: string | null;
  qc_type_milieu?: string | null;
  // === TOPOGRAPHIE ===
  pente_moyenne_pct?: number | null;
  denivele_moyen_m?: number | null;
  elevation_min_m?: number | null;
  elevation_max_m?: number | null;
  lidar_match_method?: string | null;
  lidar_source?: string | null;
  // === CONTRAINTES ===
  zone_inondable_0_20: boolean;
  zone_inondable_20_100?: boolean | null;
  contamination_statut?: string | null;
  mh_intersecte?: boolean | null;
  // === SCORE ===
  score: number;
  score_color: string;
  score_label: string;
  score_factors: string[];
  // === PROXIMITE (properties_access) ===
  idx_transit?: number | null;
  idx_epicerie?: number | null;
  idx_sante?: number | null;
  idx_parcs?: number | null;
  idx_educpri?: number | null;
  idx_garderie?: number | null;
  idx_pharma?: number | null;
  idx_emp?: number | null;
  idx_educsec?: number | null;
  idx_bibl?: number | null;
  access_score_0_100?: number | null;
  // === DEFAVORISATION INSPQ ===
  defavorisation?: {
    adidu: string;
    adpop2021: number | null;
    centMat: number;
    centSoc: number;
    quintMat: number;
    quintSoc: number;
    com: string;
    com3: string;
    noteMat: string | null;
    noteSoc: string | null;
    zone: number;
    rss: number;
    rts: number;
    rls: number;
    clsc: number;
    regional: { quintMatRSS: number | null; quintSocRSS: number | null; comRSS: string | null };
    rts_detail: Record<string, unknown>;
    rls_detail: Record<string, unknown>;
    clsc_detail: Record<string, unknown>;
    source: { dataset: string; url: string; year: number; importedAt: string };
  } | null;
  // === PERMIS DE CONSTRUCTION ===
  permits?: Array<{
    no_demande: string | null;
    date_emission: string | null;
    adresse_brute: string | null;
    description_type: string | null;
    categorie: string | null;
    nature_travaux: string | null;
    nb_logements: number | null;
    source_ville: string | null;
    distance_m: number | null;
  }>;
}

// ============================================================
// SCORE TEXT (no gauge, no SVG)
// ============================================================

function generateScoreBlock(score: number, label: string): string {
  return `
  <div style="text-align: center; padding: 28px; background: #FFFFFF; border: 2px solid #000000; border-radius: 8px; margin-bottom: 24px; page-break-inside: avoid;">
    <div style="font-family: 'DM Serif Display', Georgia, serif; font-size: 54px; font-weight: 400; color: #000000;">${score}<span style="font-size: 20px; color: #888888;">/100</span></div>
    <div style="font-family: 'IBM Plex Sans', sans-serif; font-size: 14px; font-weight: 600; color: #444444; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">${label}</div>
  </div>`;
}

// ============================================================
// MAIN HTML GENERATOR
// ============================================================

export function generateReportHTML(data: ReportData): string {
  const date = new Date().toLocaleDateString("fr-CA");

  let html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 15mm 12mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'IBM Plex Sans', system-ui, sans-serif;
      line-height: 1.6;
      color: #000000;
      background: #FFFFFF;
    }

    /* === COVER HEADER === */
    .cover-header {
      background: #E0E0E0;
      padding: 32px 40px 28px;
      position: relative;
    }
    .cover-brand {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 18px; font-weight: 400;
      color: #000000;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .cover-title {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 30px; font-weight: 400;
      color: #000000;
      margin: 16px 0 6px;
      letter-spacing: -0.5px;
    }
    .cover-meta {
      font-family: 'DM Mono', monospace;
      font-size: 11px; color: #555555;
      letter-spacing: 0.5px;
    }
    .cover-date {
      position: absolute; right: 40px; top: 32px;
      font-family: 'DM Mono', monospace;
      font-size: 10px; color: #666666;
      text-align: right;
    }
    .cover-date strong {
      display: block; font-size: 11px; color: #000000;
      font-weight: 500;
    }

    /* === PAGE CONTENT === */
    .page-content { padding: 24px 16px; }
    .page-break { page-break-after: always; }
    .section-group { page-break-inside: avoid; }

    /* === SECTION HEADERS === */
    .sec-header {
      display: flex; align-items: center; gap: 10px;
      margin: 40px 0 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #000000;
      page-break-after: avoid;
    }
    .sec-header:first-child { margin-top: 0; }
    .sec-num {
      font-family: 'DM Mono', monospace;
      font-size: 10px; color: #666666;
      letter-spacing: 1.5px;
    }
    .sec-title {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 20px; font-weight: 400;
      color: #000000;
    }

    /* === CARDS === */
    .card {
      background: #FFFFFF;
      border: 1px solid #D0D0D0;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .card-header {
      background: #E8E8E8;
      padding: 12px 24px;
    }
    .card-header-label {
      font-family: 'DM Mono', monospace;
      font-size: 10px; letter-spacing: 1.5px;
      text-transform: uppercase; color: #333333;
    }
    .card-body { padding: 24px; }

    /* === DATA GRID === */
    .data-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      page-break-inside: avoid;
    }
    .data-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      page-break-inside: avoid;
    }
    .data-label {
      font-family: 'DM Mono', monospace;
      font-size: 9px; letter-spacing: 1.2px;
      text-transform: uppercase;
      color: #888888;
      margin-bottom: 4px;
    }
    .data-value {
      font-size: 16px; font-weight: 600;
      color: #000000;
    }
    .data-value-lg {
      font-size: 20px; font-weight: 700;
      color: #000000;
    }
    .nd { color: #999999; font-style: italic; font-weight: 400; font-size: 13px; }

    /* === KV TABLE === */
    table { width: 100%; border-collapse: collapse; }
    .kv-table tr { border-bottom: 1px solid #E0E0E0; }
    .kv-table tr:last-child { border-bottom: none; }
    .kv-table td { padding: 12px 16px; font-size: 13.5px; }
    .kv-table td:first-child {
      font-weight: 600; color: #333333;
      width: 45%;
    }
    .kv-table td:last-child { color: #000000; }

    /* === CONSTRAINT ROWS === */
    .constraint-row {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid #F0F0F0;
    }
    .constraint-row:last-child { border-bottom: none; }
    .constraint-status {
      font-family: 'DM Mono', monospace;
      font-size: 11px; font-weight: 700;
      min-width: 50px;
      text-transform: uppercase;
    }
    .constraint-text { flex: 1; }
    .constraint-name { font-weight: 600; font-size: 13.5px; color: #000000; }
    .constraint-detail { font-size: 12px; color: #666666; margin-top: 2px; }

    /* === ALERT BOXES === */
    .alert-box {
      background: #F5F5F5;
      border-left: 3px solid #888888;
      border-radius: 0 8px 8px 0;
      padding: 14px 20px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .alert-box-title { font-weight: 600; color: #333333; font-size: 13px; margin-bottom: 4px; }
    .alert-box-text { font-size: 12.5px; color: #555555; line-height: 1.6; }

    /* === SUB-HEADER === */
    .sub-h3 {
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 14px; font-weight: 600;
      color: #000000;
      margin: 24px 0 12px;
      page-break-after: avoid;
    }

    /* === FOOTER === */
    .page-footer {
      background: #E0E0E0;
      padding: 16px 40px;
      display: flex; justify-content: space-between;
      align-items: center;
      margin-top: 40px;
    }
    .footer-left {
      font-family: 'DM Mono', monospace;
      font-size: 9.5px; color: #666666;
    }
    .footer-right {
      font-family: 'DM Mono', monospace;
      font-size: 9px; color: #888888;
    }

    /* === DISCLAIMER === */
    .disclaimer {
      background: #F5F5F5;
      border-top: 1px solid #D0D0D0;
      padding: 24px 40px;
      font-size: 10.5px; color: #666666;
      line-height: 1.7;
    }
    .disclaimer strong { color: #333333; }
  </style>
</head>
<body>

  <!-- ═══════════════════════════════════════════════════════════
       COVER HEADER
       ═══════════════════════════════════════════════════════════ -->
  <div class="cover-header">
    <div>
      <span class="cover-brand">SCANIMMO</span>
    </div>
    <div class="cover-title">${data.adresse}</div>
    <div class="cover-meta">Matricule ${data.matricule} &middot; ${data.municipalite}, Qu&eacute;bec</div>
    <div class="cover-date">
      <strong>Rapport Scanimmo</strong>
      G&eacute;n&eacute;r&eacute; le ${date}
    </div>
  </div>

  <div class="page-content">

  <!-- ═══════════════════════════════════════════════════════════
       SECTION 1 — SCORE & VERDICT
       ═══════════════════════════════════════════════════════════ -->
  ${generateScoreBlock(data.score, data.score_label)}

  ${data.score_factors.length > 0 ? `
  <div class="card">
    <div class="card-header">
      <span class="card-header-label">Facteurs d&eacute;terminants</span>
    </div>
    <div class="card-body">
      <ul style="margin-left: 18px;">
        ${data.score_factors.map(f => `<li style="font-size: 13px; color: #333333; padding: 3px 0; line-height: 1.6;">${f}</li>`).join('\n        ')}
      </ul>
    </div>
  </div>
  ` : ''}

  <!-- ═══════════════════════════════════════════════════════════
       SECTION 2 — FICHE PROPRIETE
       ═══════════════════════════════════════════════════════════ -->
  <div class="sec-header">
    <span class="sec-num">01</span>
    <span class="sec-title">Fiche propri&eacute;t&eacute;</span>
  </div>

  <div class="card">
    <div class="card-header">
      <span class="card-header-label">Caract&eacute;ristiques</span>
    </div>
    <div class="card-body">
      <div class="data-grid">
        <div>
          <div class="data-label">Zonage</div>
          <div class="data-value">${data.zone_code !== 'N/D' ? data.zone_code : `<span class="nd">${ND}</span>`}</div>
        </div>
        <div>
          <div class="data-label">Ann&eacute;e de construction</div>
          <div class="data-value">${showYear(data.annee_construction)}</div>
        </div>
        <div>
          <div class="data-label">Superficie terrain</div>
          <div class="data-value-lg">${showM2(data.superficie_m2)}</div>
        </div>
        <div>
          <div class="data-label">Superficie b&acirc;timent</div>
          <div class="data-value-lg">${showM2(data.superficie_batiment_m2)}</div>
        </div>
        <div>
          <div class="data-label">&Eacute;tages</div>
          <div class="data-value">${showInt(data.nb_etages)}</div>
        </div>
        <div>
          <div class="data-label">Logements</div>
          <div class="data-value">${showInt(data.nb_logements)}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Evaluation fonciere -->
  <div class="card">
    <div class="card-header">
      <span class="card-header-label">&Eacute;valuation fonci&egrave;re</span>
    </div>
    <div class="card-body">
      <div class="data-grid-3">
        <div>
          <div class="data-label">Totale</div>
          <div class="data-value-lg">${showCAD(data.valeur_totale)}</div>
        </div>
        <div>
          <div class="data-label">Terrain</div>
          <div class="data-value">${showCAD(data.valeur_terrain)}</div>
        </div>
        <div>
          <div class="data-label">B&acirc;timent</div>
          <div class="data-value">${showCAD(data.valeur_batiment)}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════
       SECTION 3 — REGLEMENTATION & ZONAGE
       ═══════════════════════════════════════════════════════════ -->
  <div class="section-group">
  <div class="sec-header">
    <span class="sec-num">02</span>
    <span class="sec-title">R&eacute;glementation &amp; Zonage</span>
  </div>
  ${generateZonageSection(data)}
  </div>

  <!-- ═══════════════════════════════════════════════════════════
       SECTION 4 — TOPOGRAPHIE
       ═══════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="sec-header" style="margin-top: 0;">
    <span class="sec-num">03</span>
    <span class="sec-title">Analyse topographique</span>
  </div>

  ${data.pente_moyenne_pct != null ? `
  <div class="card">
    <div class="card-body">
      <div class="data-grid-3">
        <div>
          <div class="data-label">Pente moyenne</div>
          <div class="data-value-lg">${showPct(data.pente_moyenne_pct)}</div>
        </div>
        <div>
          <div class="data-label">D&eacute;nivel&eacute;</div>
          <div class="data-value">${showM(data.denivele_moyen_m)}</div>
        </div>
        <div>
          <div class="data-label">&Eacute;l&eacute;vation</div>
          <div class="data-value">${showElev(data.elevation_min_m)} &rarr; ${showElev(data.elevation_max_m)}</div>
        </div>
      </div>
      <div style="margin-top: 16px; display: flex; gap: 24px;">
        <div>
          <div class="data-label">Source LiDAR</div>
          <div style="font-size: 13px; color: #333333;">${show(data.lidar_source)}</div>
        </div>
        <div>
          <div class="data-label">Qualit&eacute;</div>
          <div style="font-size: 13px; color: #333333;">
            ${data.lidar_match_method === 'WITHIN' ? 'Haute pr&eacute;cision (WITHIN)' :
              data.lidar_match_method === 'NEAREST_OK' ? 'Approximative' :
              data.lidar_match_method != null ? show(data.lidar_match_method) : ND}
          </div>
        </div>
      </div>
    </div>
  </div>
  ` : `
  <div class="alert-box">
    <div class="alert-box-title">Donn&eacute;es topographiques non disponibles</div>
    <div class="alert-box-text">Les donn&eacute;es LiDAR ne sont pas encore disponibles pour ce secteur.</div>
  </div>
  `}

  <!-- ═══════════════════════════════════════════════════════════
       SECTION 5 — CONTRAINTES ENVIRONNEMENTALES
       ═══════════════════════════════════════════════════════════ -->
  <div class="section-group">
  <div class="sec-header">
    <span class="sec-num">04</span>
    <span class="sec-title">Contraintes environnementales</span>
  </div>

  <div class="card">
    <div class="card-body" style="padding: 0;">
      ${generateConstraintRow(
        data.zone_inondable_0_20,
        'Zone inondable 0-20 ans',
        data.zone_inondable_0_20 ? 'Contraintes r&eacute;glementaires applicables' : 'Hors zone inondable'
      )}
      ${data.zone_inondable_20_100 != null ? generateConstraintRow(
        data.zone_inondable_20_100,
        'Zone inondable 20-100 ans',
        data.zone_inondable_20_100 ? 'Assurances sp&eacute;cifiques requises' : 'Non concern&eacute;'
      ) : ''}
      ${generateConstraintRow(
        data.contamination_statut === 'OUI',
        'Contamination',
        data.contamination_statut === 'OUI' ? 'Site r&eacute;pertori&eacute; (MELCCFP)' :
        data.contamination_statut === 'NON' ? 'Aucun site r&eacute;pertori&eacute;' : ND
      )}
      ${generateConstraintRow(
        data.mh_intersecte === true,
        'Milieux humides',
        data.mh_intersecte === true ? 'Intersection identifi&eacute;e' :
        data.mh_intersecte === false ? 'Aucune intersection' : ND
      )}
    </div>
  </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════
       SECTION 6 — ACCESSIBILITE & PROXIMITE
       ═══════════════════════════════════════════════════════════ -->
  ${generateProximitySection(data)}

  <!-- ═══════════════════════════════════════════════════════════
       SECTION 7 — DEFAVORISATION INSPQ
       ═══════════════════════════════════════════════════════════ -->
  ${generateDefavorisationSection(data)}

  <!-- ═══════════════════════════════════════════════════════════
       SECTION 8 — PERMIS DE CONSTRUCTION
       ═══════════════════════════════════════════════════════════ -->
  ${generatePermitsSection(data)}

  </div><!-- end .page-content -->
`;

  // === DISCLAIMER + FOOTER ===
  html += `
  <div class="disclaimer">
    <strong>Avertissement :</strong> Ce rapport constitue un indicateur d'aide &agrave; la d&eacute;cision bas&eacute; sur les donn&eacute;es publiques disponibles au ${date}.
    Il ne constitue ni une garantie, ni un avis professionnel ou r&eacute;glementaire. Validation par un professionnel recommand&eacute;e.
    <br><br>
    <strong>Sources :</strong> Cadastre municipal &middot; R&egrave;glements de zonage &middot; LiDAR gouvernemental &middot; MELCCFP (contamination) &middot; MSP (inondations) &middot; Statistique Canada (proximit&eacute;) &middot; INSPQ (d&eacute;favorisation) &middot; Donn&eacute;es Qu&eacute;bec (permis de construction)
  </div>

  <div class="page-footer">
    <span class="footer-left">Scanimmo - ${new Date().getFullYear()}</span>
    <span class="footer-right">v4.1 &middot; Qu&eacute;bec, Canada</span>
  </div>

</body>
</html>
`;

  return html;
}

// ============================================================
// HELPERS
// ============================================================

function generateConstraintRow(isPresent: boolean | null | undefined, name: string, detail: string): string {
  const statusText = isPresent === true ? 'OUI' : isPresent === false ? 'NON' : '—';
  const statusColor = isPresent === true ? '#000000' : '#888888';
  return `
      <div class="constraint-row">
        <div class="constraint-status" style="color: ${statusColor};">${statusText}</div>
        <div class="constraint-text">
          <div class="constraint-name">${name}</div>
          <div class="constraint-detail">${detail}</div>
        </div>
      </div>`;
}

function generateZonageSection(data: ReportData): string {
  const hasZonage = data.zone_code !== 'N/D';
  const hasAnyZonageData = hasZonage || data.cos_max != null || data.hauteur_max_etages != null
    || data.qc_hauteur_max_m != null || data.aire_verte_min_pct != null;

  if (!hasAnyZonageData) {
    return `
    <div class="alert-box">
      <div class="alert-box-title">Donn&eacute;es non disponibles</div>
      <div class="alert-box-text">Les donn&eacute;es de r&eacute;glementation et zonage ne sont pas encore int&eacute;gr&eacute;es pour cette municipalit&eacute;.</div>
    </div>`;
  }

  const rows: string[] = [];
  const addRow = (label: string, value: string) => {
    const isNd = value === ND;
    rows.push(`<tr><td>${label}</td><td${isNd ? ' class="nd"' : ''}>${value}</td></tr>`);
  };

  addRow('Zone', show(data.zone_code !== 'N/D' ? data.zone_code : null));
  if (data.qc_dominante_label != null) addRow('Type de zone', show(data.qc_dominante_label));
  if (data.qc_type_milieu != null) addRow('Type de milieu', show(data.qc_type_milieu));
  if (data.hauteur_max_etages != null) addRow('Hauteur max (&eacute;tages)', showInt(data.hauteur_max_etages));
  if (data.qc_hauteur_max_m != null) addRow('Hauteur max (m&egrave;tres)', showM(data.qc_hauteur_max_m));
  if (data.hauteur_max_etages == null && data.qc_hauteur_max_m == null) addRow('Hauteur max', ND);
  addRow('COS (FAR)', data.cos_max != null ? showNum(data.cos_max, 2) : ND);
  addRow('Aire verte min.', data.aire_verte_min_pct != null ? showPct(data.aire_verte_min_pct) : ND);

  return `
  <div class="card">
    <div class="card-body" style="padding: 0;">
      <table class="kv-table">
        <tbody>${rows.join('\n')}</tbody>
      </table>
    </div>
  </div>`;
}

// ============================================================
// ACCESSIBILITE & PROXIMITE
// ============================================================

function generateProximitySection(data: ReportData): string {
  const hasData = data.access_score_0_100 != null || data.idx_transit != null;

  if (!hasData) {
    return `
  <div class="section-group">
  <div class="sec-header">
    <span class="sec-num">05</span>
    <span class="sec-title">Accessibilit&eacute; &amp; Proximit&eacute;</span>
  </div>
  <div class="alert-box">
    <div class="alert-box-title">Donn&eacute;es non disponibles</div>
    <div class="alert-box-text">Les indices de proximit&eacute; StatCan ne sont pas encore disponibles pour ce secteur.</div>
  </div>
  </div>`;
  }

  const indices: Array<{ key: keyof ReportData; label: string }> = [
    { key: 'idx_transit',  label: 'Transport en commun' },
    { key: 'idx_epicerie', label: '&Eacute;picerie' },
    { key: 'idx_sante',    label: 'Sant&eacute;' },
    { key: 'idx_parcs',    label: 'Parcs' },
    { key: 'idx_educpri',  label: '&Eacute;cole primaire' },
    { key: 'idx_garderie', label: 'Garderie' },
    { key: 'idx_pharma',   label: 'Pharmacie' },
    { key: 'idx_emp',      label: 'Emploi' },
    { key: 'idx_educsec',  label: '&Eacute;cole secondaire' },
    { key: 'idx_bibl',     label: 'Biblioth&egrave;que' },
  ];

  const accessScore = data.access_score_0_100 != null ? Number(data.access_score_0_100) : null;

  return `
  <div class="page-break"></div>
  <div class="page-content">
  <div class="sec-header" style="margin-top: 0;">
    <span class="sec-num">05</span>
    <span class="sec-title">Accessibilit&eacute; &amp; Proximit&eacute;</span>
  </div>

  ${accessScore != null ? `
  <div style="text-align: center; margin-bottom: 24px; page-break-inside: avoid;">
    <div style="display: inline-block; background: #FFFFFF; border: 2px solid #000000; border-radius: 8px; padding: 20px 40px;">
      <div class="data-label" style="margin-bottom: 8px;">SCORE D'ACCESSIBILIT&Eacute; GLOBAL</div>
      <div style="font-family: 'DM Serif Display', Georgia, serif; font-size: 42px; font-weight: 400; color: #000000;">
        ${accessScore.toFixed(0)}<span style="font-size: 18px; color: #888888;">/100</span>
      </div>
    </div>
  </div>
  ` : ''}

  <div class="card">
    <div class="card-header">
      <span class="card-header-label">Indices de proximit&eacute; (StatCan)</span>
    </div>
    <div class="card-body" style="padding: 0;">
      <table class="kv-table">
        <tbody>
          ${indices.map(({ key, label }) => {
            const val = data[key] as number | null | undefined;
            const numVal = val != null ? Number(val) : null;
            const display = numVal != null ? `<strong>${numVal.toFixed(1)}</strong> / 100` : `<span class="nd">${ND}</span>`;
            return `<tr><td>${label}</td><td>${display}</td></tr>`;
          }).join('\n          ')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="alert-box">
    <div class="alert-box-title">M&eacute;thodologie</div>
    <div class="alert-box-text">Indices calcul&eacute;s par Statistique Canada (proximit&eacute; aux services). Chaque indice varie de 0 (faible accessibilit&eacute;) &agrave; 100 (excellente accessibilit&eacute;), normalis&eacute; &agrave; l'&eacute;chelle provinciale.</div>
  </div>

  </div><!-- end .page-content proximity -->
  `;
}

// ============================================================
// DEFAVORISATION INSPQ
// ============================================================

const LEGENDES_INDICE_PDF = [
  { code: "C1", label: "Aire de diffusion mat&eacute;riellement et socialement tr&egrave;s favoris&eacute;es" },
  { code: "C2", label: "Aire de diffusion moyennes" },
  { code: "C3", label: "Aire de diffusion mat&eacute;riellement favoris&eacute;e et socialement tr&egrave;s d&eacute;favoris&eacute;es" },
  { code: "C4", label: "Aire de diffusion socialement favoris&eacute;e et mat&eacute;riellement tr&egrave;s d&eacute;favoris&eacute;es" },
  { code: "C5", label: "Aire de diffusion mat&eacute;riellement et socialement tr&egrave;s d&eacute;favoris&eacute;es" },
] as const;

const ZONE_LABELS_PDF: Record<number, string> = {
  1: "Urbaine (grande)", 2: "Urbaine (petite)",
  3: "Rurale (forte)", 4: "Rurale (faible)",
};

function generateDefavorisationSection(data: ReportData): string {
  const d = data.defavorisation;
  if (d == null) return '';

  const indiceCom: string | null = (typeof d.com === "string" && d.com.length > 0) ? d.com : null;

  const legendeRows = LEGENDES_INDICE_PDF.map(item => {
    const isActive = indiceCom === item.code;
    return `
      <tr style="${isActive ? 'background: #E8E8E8; font-weight: 700;' : ''}">
        <td style="padding: 8px 12px; font-family: 'DM Mono', monospace; font-size: 12px; width: 40px; color: ${isActive ? '#000000' : '#666666'};">${item.code}</td>
        <td style="padding: 8px 12px; font-size: 12.5px; color: ${isActive ? '#000000' : '#444444'}; border-bottom: 1px solid #E0E0E0;">${item.label}</td>
      </tr>`;
  }).join('\n');

  const kvRow = (label: string, value: string) =>
    `<tr><td style="padding: 10px 16px; font-weight: 600; color: #333333; font-size: 13px; width: 50%; border-bottom: 1px solid #E0E0E0;">${label}</td><td style="padding: 10px 16px; font-family: 'DM Mono', monospace; font-size: 13px; color: #000000; border-bottom: 1px solid #E0E0E0;">${value}</td></tr>`;

  const indicesRows = [
    kvRow('Centile mat&eacute;riel', `${d.centMat} / 100`),
    kvRow('Centile social', `${d.centSoc} / 100`),
    kvRow('Quintile mat&eacute;riel', `${d.quintMat} / 5`),
    kvRow('Quintile social', `${d.quintSoc} / 5`),
    kvRow('Indice combin&eacute;', d.com),
    kvRow('Indice combin&eacute; 3c', d.com3),
    kvRow('Zone de r&eacute;sidence', ZONE_LABELS_PDF[d.zone] ?? String(d.zone)),
    kvRow('Score factoriel mat.', d.noteMat !== null ? d.noteMat : ND),
    kvRow('Score factoriel soc.', d.noteSoc !== null ? d.noteSoc : ND),
  ].join('\n');

  const niveauRow = (label: string, qm: number | string | null | undefined, qs: number | string | null | undefined, com: string | null | undefined, highlight: boolean) => {
    const style = highlight ? 'background: #F0F0F0; font-weight: 600;' : '';
    const qmStr = qm != null ? String(qm) : ND;
    const qsStr = qs != null ? String(qs) : ND;
    const comStr = com != null ? String(com) : ND;
    return `<tr style="${style}">
      <td style="padding: 8px 12px; font-size: 12.5px; color: #000000; border-bottom: 1px solid #E0E0E0;">${label}</td>
      <td style="padding: 8px 12px; text-align: center; font-family: 'DM Mono', monospace; font-size: 12.5px; color: #000000; border-bottom: 1px solid #E0E0E0;">${qmStr}</td>
      <td style="padding: 8px 12px; text-align: center; font-family: 'DM Mono', monospace; font-size: 12.5px; color: #000000; border-bottom: 1px solid #E0E0E0;">${qsStr}</td>
      <td style="padding: 8px 12px; text-align: center; font-family: 'DM Mono', monospace; font-size: 12.5px; color: #000000; border-bottom: 1px solid #E0E0E0;">${comStr}</td>
    </tr>`;
  };

  const niveauxRows = [
    niveauRow('Provincial', d.quintMat, d.quintSoc, d.com, true),
    niveauRow('R&eacute;gional (RSS)', d.regional?.quintMatRSS, d.regional?.quintSocRSS, d.regional?.comRSS, false),
    niveauRow('Territorial (RTS)', (d.rts_detail as Record<string, unknown>)?.quintMatRTS as number | null, (d.rts_detail as Record<string, unknown>)?.quintSocRTS as number | null, (d.rts_detail as Record<string, unknown>)?.comRTS as string | null, false),
    niveauRow('Local (RLS)', (d.rls_detail as Record<string, unknown>)?.quintMatRLS as number | null, (d.rls_detail as Record<string, unknown>)?.quintSocRLS as number | null, (d.rls_detail as Record<string, unknown>)?.comRLS as string | null, false),
    niveauRow('CLSC', (d.clsc_detail as Record<string, unknown>)?.quintMatCLSC as number | null, (d.clsc_detail as Record<string, unknown>)?.quintSocCLSC as number | null, (d.clsc_detail as Record<string, unknown>)?.comCLSC as string | null, false),
  ].join('\n');

  return `
  <div class="page-break"></div>
  <div class="page-content">
  <div class="sec-header" style="margin-top: 0;">
    <span class="sec-num">06</span>
    <span class="sec-title">D&eacute;favorisation mat&eacute;rielle et sociale</span>
  </div>

  <div style="background: #FFFFFF; border: 1px solid #D0D0D0; border-radius: 8px; margin-bottom: 20px; page-break-inside: avoid;">
    <div style="padding: 12px 16px; border-bottom: 2px solid #D0D0D0; font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: #666666;">
      Indice combin&eacute; mat&eacute;riel et social
    </div>
    <table style="width: 100%; border-collapse: collapse;">
      <tbody>
        ${legendeRows}
      </tbody>
    </table>
  </div>

  <div style="background: #FFFFFF; border: 1px solid #D0D0D0; border-radius: 8px; margin-bottom: 20px; page-break-inside: avoid;">
    <div style="padding: 12px 16px; border-bottom: 2px solid #D0D0D0; font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: #666666;">
      Indices d&eacute;taill&eacute;s
    </div>
    <table style="width: 100%; border-collapse: collapse;">
      <tbody>
        ${indicesRows}
      </tbody>
    </table>
  </div>

  <div style="background: #FFFFFF; border: 1px solid #D0D0D0; border-radius: 8px; margin-bottom: 20px; page-break-inside: avoid;">
    <div style="padding: 12px 16px; border-bottom: 2px solid #D0D0D0; font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: #666666;">
      Comparaison multi-niveaux g&eacute;ographiques
    </div>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid #C0C0C0;">
          <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #666666; font-weight: 500;">Niveau</th>
          <th style="padding: 8px 12px; text-align: center; font-size: 11px; color: #666666; font-weight: 500;">Quint. Mat.</th>
          <th style="padding: 8px 12px; text-align: center; font-size: 11px; color: #666666; font-weight: 500;">Quint. Soc.</th>
          <th style="padding: 8px 12px; text-align: center; font-size: 11px; color: #666666; font-weight: 500;">Combin&eacute;</th>
        </tr>
      </thead>
      <tbody>
        ${niveauxRows}
      </tbody>
    </table>
  </div>

  <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; page-break-inside: avoid;">
    <div style="font-size: 10.5px; color: #888888;">
      AD : ${d.adidu}${d.adpop2021 !== null ? ` | Pop. ${d.adpop2021.toLocaleString('fr-CA')}` : ''}
    </div>
  </div>
  </div><!-- end .page-content defavorisation -->
  `;
}

// ============================================================
// PERMIS DE CONSTRUCTION
// ============================================================

function generatePermitsSection(data: ReportData): string {
  const permits = data.permits;
  if (!permits || permits.length === 0) {
    return `
  <div class="page-break"></div>
  <div class="page-content">
  <div class="sec-header" style="margin-top: 0;">
    <span class="sec-num">07</span>
    <span class="sec-title">Permis de construction (rayon 200 m)</span>
  </div>
  <div class="alert-box">
    <div class="alert-box-title">Aucun permis</div>
    <div class="alert-box-text">Aucun permis de construction r&eacute;pertori&eacute; dans un rayon de 200 m.</div>
  </div>
  </div>`;
  }

  const formatDate = (d: string | null): string => {
    if (d == null) return ND;
    try {
      return new Date(d).toLocaleDateString('fr-CA');
    } catch {
      return String(d);
    }
  };

  // Compact table with fixed layout and word-wrap — all data visible, no truncation
  const tableRows = permits.map((p, i) => {
    const dist = p.distance_m != null ? `${Math.round(Number(p.distance_m))} m` : ND;
    const logements = p.nb_logements != null && p.nb_logements > 0 ? `${p.nb_logements}` : '';
    const bg = i % 2 === 0 ? '#FFFFFF' : '#F8F8F8';
    return `<tr style="background: ${bg}; border-bottom: 1px solid #E8E8E8;">
      <td style="padding: 6px 8px; font-family: 'DM Mono', monospace; font-size: 9px; color: #555555; word-wrap: break-word; overflow-wrap: break-word;">${show(p.no_demande)}</td>
      <td style="padding: 6px 8px; font-size: 9px; color: #333333; word-wrap: break-word; overflow-wrap: break-word;">${formatDate(p.date_emission)}</td>
      <td style="padding: 6px 8px; font-size: 9px; color: #000000; font-weight: 500; word-wrap: break-word; overflow-wrap: break-word;">${show(p.description_type)}</td>
      <td style="padding: 6px 8px; font-size: 9px; color: #555555; word-wrap: break-word; overflow-wrap: break-word;">${show(p.nature_travaux)}</td>
      <td style="padding: 6px 8px; font-size: 9px; color: #555555; word-wrap: break-word; overflow-wrap: break-word;">${show(p.categorie)}</td>
      <td style="padding: 6px 8px; font-family: 'DM Mono', monospace; font-size: 9px; color: #888888; text-align: center;">${logements}</td>
      <td style="padding: 6px 8px; font-family: 'DM Mono', monospace; font-size: 9px; color: #888888; text-align: right; white-space: nowrap;">${dist}</td>
    </tr>`;
  }).join('\n');

  const permitsTable = `
  <table style="width: 100%; border-collapse: collapse; table-layout: fixed; word-wrap: break-word; overflow-wrap: break-word;">
    <colgroup>
      <col style="width: 12%;">
      <col style="width: 10%;">
      <col style="width: 22%;">
      <col style="width: 24%;">
      <col style="width: 16%;">
      <col style="width: 6%;">
      <col style="width: 10%;">
    </colgroup>
    <thead>
      <tr style="border-bottom: 2px solid #C0C0C0;">
        <th style="padding: 8px 8px; text-align: left; font-size: 8px; color: #666666; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">No demande</th>
        <th style="padding: 8px 8px; text-align: left; font-size: 8px; color: #666666; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Date</th>
        <th style="padding: 8px 8px; text-align: left; font-size: 8px; color: #666666; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Type</th>
        <th style="padding: 8px 8px; text-align: left; font-size: 8px; color: #666666; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Travaux</th>
        <th style="padding: 8px 8px; text-align: left; font-size: 8px; color: #666666; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Cat&eacute;gorie</th>
        <th style="padding: 8px 8px; text-align: center; font-size: 8px; color: #666666; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Log.</th>
        <th style="padding: 8px 8px; text-align: right; font-size: 8px; color: #666666; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Dist.</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>`;

  return `
  <div class="page-break"></div>
  <div class="page-content">
  <div class="sec-header" style="margin-top: 0;">
    <span class="sec-num">07</span>
    <span class="sec-title">Permis de construction (rayon 200 m)</span>
  </div>

  <div style="font-size: 12.5px; color: #666666; margin-bottom: 16px;">
    ${permits.length} permis r&eacute;pertori&eacute;${permits.length > 1 ? 's' : ''} dans un rayon de 200 m.
  </div>

  ${permitsTable}

  <div style="font-size: 9.5px; color: #888888; line-height: 1.6; padding: 8px 0;">
    Source : Donn&eacute;es Qu&eacute;bec &mdash; Permis de construction (Montr&eacute;al, Qu&eacute;bec, Laval).
  </div>

  </div><!-- end .page-content permis -->
  `;
}

export function generatePDFFilename(matricule: string, tier: Tier): string {
  const date = new Date().toISOString().split('T')[0];
  return `scanimmo-${tier}-${matricule}-${date}.pdf`;
}
