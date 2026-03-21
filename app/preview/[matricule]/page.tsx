/**
 * Preview Page (/preview/[matricule])
 * @description Rapport interactif complet — 6 onglets, données 100% Supabase.
 *              Design system navy/or/creme (Rapport v12).
 */

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { resolveScore } from "@/lib/resolve-score";
import { formatNumber, formatCurrency } from "@/lib/utils";
import type { PropertyPreview, ScoreResult } from "@/lib/types";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ReferenceLine,
  BarChart, Bar, Tooltip, Legend, Cell,
} from "recharts";

/* ═══════════════════════════════════════════════════════════════════
   DESIGN SYSTEM
═══════════════════════════════════════════════════════════════════ */
const T = {
  cream:    "#F8F6F1",
  white:    "#FFFFFF",
  ink:      "#18140F",
  inkSoft:  "#3D3530",
  gold:     "#C49A28",
  goldLt:   "#EDD68A",
  goldDim:  "#8A6B1A",
  green:    "#16A34A",
  amber:    "#B45309",
  red:      "#B91C1C",
  blue:     "#1D4ED8",
  muted:    "#7C7268",
  border:   "#E4E0D8",
  subtle:   "#F2EFE8",
  navy:     "#0F2B4B",
  navyMid:  "#152C46",
  navyLt:   "#1A3855",
  navyDeep: "#091E34",
  display:  "var(--font-display), 'Playfair Display', Georgia, serif",
  mono:     "var(--font-mono), 'IBM Plex Mono', monospace",
  sans:     "var(--font-sans), system-ui, sans-serif",
};

type TabId = "synthese" | "carte" | "lidar" | "env" | "proximite" | "defavorisation" | "finances" | "permis";
const ALL_TABS: { id: TabId; label: string }[] = [
  { id: "synthese", label: "Synthèse" },
  { id: "carte", label: "Carte" },
  { id: "lidar", label: "LiDAR & Topo" },
  { id: "env", label: "Environnement" },
  { id: "proximite", label: "Proximité" },
  { id: "defavorisation", label: "Défavorisation" },
  { id: "finances", label: "Finances" },
  { id: "permis", label: "Permis (rayon 200m)" },
];

/* ── Helpers ────────────────────────────────────────────────────── */
function scoreColors(score: number) {
  if (score >= 70) return { bg: T.green + "12", border: T.green, text: T.green, label: "Opportunit\u00e9" };
  if (score >= 40) return { bg: T.amber + "12", border: T.amber, text: T.amber, label: "Acceptable" };
  return { bg: T.red + "12", border: T.red, text: T.red, label: "Risque" };
}

function nd(v: any): string {
  if (v === null || v === undefined || v === "") return "N/D";
  return String(v);
}

function normalizeLidarMethod(method: string | null): string | null {
  if (!method) return null;
  if (method.startsWith("WITHIN")) return "WITHIN";
  if (method.startsWith("NEAREST")) return "NEAREST_OK";
  if (method.startsWith("OUTSIDE")) return "OUTSIDE_COVERAGE";
  return method;
}

function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return "N/D";
  return v.toFixed(1) + " %";
}

function fmtM(v: number | null | undefined): string {
  if (v === null || v === undefined) return "N/D";
  return v.toFixed(1) + " m";
}

function riskColor(level: "ok" | "warn" | "danger" | "unknown"): string {
  switch (level) {
    case "ok": return T.green;
    case "warn": return T.amber;
    case "danger": return T.red;
    default: return T.muted;
  }
}

/* ── Types for API response ─────────────────────────────────────── */
interface PropertyData {
  id: string;
  matricule: string;
  adresse: string | null;
  code_municipalite: string | null;
  latitude: number | null;
  longitude: number | null;
  zone_code: string | null;
  annee_construction: number | null;
  nb_etages: number | null;
  nb_logements: number | null;
  nb_batiments: number | null;
  superficie_m2: number | null;
  superficie_batiment_m2: number | null;
  front_m: number | null;
  ces_reel: number | null;
  valeur_totale: number | null;
  valeur_terrain: number | null;
  valeur_batiment: number | null;
  valeur_anterieure: number | null;
  cos_max: number | null;
  hauteur_max_etages: number | null;
  aire_verte_min_pct: number | null;
  surface_constructible_pct: number | null;
  qc_code_zone: string | null;
  qc_dominante: string | null;
  qc_dominante_label: string | null;
  qc_type_milieu: string | null;
  qc_hauteur_max_m: number | null;
  qc_densite_min_logha: number | null;
  zone_municipal_code: string | null;
  zone_source: string | null;
  pente_moyenne_pct: number | null;
  denivele_moyen_m: number | null;
  elevation_min_m: number | null;
  elevation_max_m: number | null;
  lidar_match_method: string | null;
  lidar_match_distance_m: number | null;
  lidar_source: string | null;
  lidar_year: number | null;
  lidar_obsolete: boolean | null;
  contamination_statut: string | null;
  gtc_id: string | null;
  distance_gtc_m: number | null;
  zone_inondable_0_20: string | boolean | null;
  zone_inondable_20_100: string | boolean | null;
  mh_intersecte: string | boolean | null;
  mh_distance_m: number | null;
  est_agricole: boolean | null;
  score_scanimmo: number | null;
  numero_lot: string | null;
}

interface ProximityData {
  idx_transit: number | null;
  idx_epicerie: number | null;
  idx_sante: number | null;
  idx_parcs: number | null;
  idx_educpri: number | null;
  idx_garderie: number | null;
  idx_pharma: number | null;
  idx_emp: number | null;
  idx_educsec: number | null;
  idx_bibl: number | null;
  access_score_0_100: number | null;
}

interface AnalysisData {
  type_terrain: string | null;
  prix_terrain_pi2: number | null;
  est_exploitable: boolean | null;
  exclusion_reason: string | null;
}

interface PermitData {
  no_demande: string | null;
  date_emission: string | null;
  adresse_brute: string | null;
  description_type: string | null;
  categorie: string | null;
  nature_travaux: string | null;
  nb_logements: number | null;
  source_ville: string | null;
  distance_m: number | null;
}

interface ContaminationSiteData {
  no_mef_lieu: string;
  adresse: string | null;
  statut: string | null;
  milieu_recepteur: string | null;
  nb_fiches: number | null;
  mrc_region: string | null;
  distance_m: number | null;
}

interface DefavorisationRegional {
  quintMatRSS: number | null; quintSocRSS: number | null;
  quartMatRSS: number | null; quartSocRSS: number | null;
  comRSS: string | null; com3RSS: string | null;
}

interface DefavorisationSubLevel {
  [key: string]: number | string | null;
}

interface DefavorisationData {
  adidu: string;
  ad: number;
  adpop2021: number | null;
  centMat: number;
  centSoc: number;
  quintMat: number;
  quintSoc: number;
  com: string;
  com3: string;
  noteMat: string | null;
  noteSoc: string | null;
  noteMatNum: number | null;
  noteSocNum: number | null;
  zone: number;
  rss: number;
  rts: number;
  rls: number;
  clsc: number;
  regional: DefavorisationRegional;
  rts_detail: DefavorisationSubLevel;
  rls_detail: DefavorisationSubLevel;
  clsc_detail: DefavorisationSubLevel;
  source: {
    dataset: string;
    url: string;
    year: number;
    importedAt: string;
  };
}

interface FullData {
  property: PropertyData;
  proximity: ProximityData | null;
  analysis: AnalysisData | null;
  permits: PermitData[];
  contamination_site: ContaminationSiteData | null;
  defavorisation: DefavorisationData | null;
}

/* ═══════════════════════════════════════════════════════════════════
   SUBCOMPONENTS
═══════════════════════════════════════════════════════════════════ */

/* ── Score Arc (SVG) ────────────────────────────────────────────── */
function ScoreArc({ score, size = 140 }: { score: number; size?: number }) {
  const sc = scoreColors(score);
  const r = (size - 16) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashLen = (score / 100) * circumference;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, transform: "rotate(-90deg)" }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="8" />
        <circle cx={c} cy={c} r={r} fill="none" stroke={sc.border} strokeWidth="8"
          strokeDasharray={`${dashLen} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontFamily: T.display, fontSize: size * 0.28, color: T.white, lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontFamily: T.mono, fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 1, marginTop: 2 }}>
          / 100
        </span>
      </div>
    </div>
  );
}

/* ── KV Row ─────────────────────────────────────────────────────── */
function KV({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: `1px solid ${T.border}`,
    }}>
      <span style={{ fontFamily: T.sans, fontSize: 13.5, color: T.inkSoft }}>{label}</span>
      <span style={{
        fontFamily: mono ? T.mono : T.sans, fontSize: 13.5,
        fontWeight: 600, color: color || T.ink,
      }}>{value}</span>
    </div>
  );
}

/* ── Status Badge ───────────────────────────────────────────────── */
function StatusBadge({ level, text }: { level: "ok" | "warn" | "danger" | "unknown"; text: string }) {
  const c = riskColor(level);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "6px 14px", borderRadius: 8,
      background: c + "10", border: `1px solid ${c}30`,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
      <span style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: c }}>{text}</span>
    </div>
  );
}

/* ── Section Card ───────────────────────────────────────────────── */
function SCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: T.white, borderRadius: 16,
      border: `1px solid ${T.border}`, padding: "28px 32px",
      marginBottom: 20,
    }}>
      <div style={{
        fontFamily: T.mono, fontSize: 10, letterSpacing: 2,
        textTransform: "uppercase", color: T.gold, marginBottom: 16,
      }}>{title}</div>
      {children}
    </div>
  );
}

/* ── Horizontal Bar ─────────────────────────────────────────────── */
function HBar({ label, value, max = 100, color }: { label: string; value: number | null; max?: number; color?: string }) {
  const pct = value !== null ? Math.min(100, (value / max) * 100) : 0;
  const c = color || T.gold;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: T.sans, fontSize: 12.5, color: T.inkSoft }}>{label}</span>
        <span style={{ fontFamily: T.mono, fontSize: 12.5, fontWeight: 600, color: value !== null ? T.ink : T.muted }}>
          {value !== null ? value.toFixed(0) : "N/D"}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: T.border }}>
        <div style={{
          height: 6, borderRadius: 3, background: c,
          width: `${pct}%`, transition: "width .6s ease",
        }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB CONTENTS
═══════════════════════════════════════════════════════════════════ */

function ContaminationDetail({ site }: { site: ContaminationSiteData }) {
  const statutLabel: Record<string, string> = {
    contamine: "Contaminé", en_rehab: "En réhabilitation", rehabilite: "Réhabilité", inconnu: "Inconnu",
  };
  return (
    <div style={{
      marginTop: 12, padding: 14, borderRadius: 10,
      background: T.cream, border: `1px solid ${T.border}`,
      fontFamily: T.sans, fontSize: 13, color: T.inkSoft, lineHeight: 1.7,
    }}>
      <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.5, textTransform: "uppercase", color: T.gold, marginBottom: 8 }}>
        Fiche site contaminé — MELCCFP
      </div>
      <div><strong>No dossier :</strong> {site.no_mef_lieu}</div>
      {site.adresse && <div><strong>Adresse du site :</strong> {site.adresse}</div>}
      <div><strong>Statut :</strong> {statutLabel[site.statut ?? ""] ?? site.statut ?? "N/D"}</div>
      {site.milieu_recepteur && <div><strong>Milieu récepteur :</strong> {site.milieu_recepteur}</div>}
      {site.nb_fiches !== null && <div><strong>Nb fiches :</strong> {site.nb_fiches}</div>}
      {site.mrc_region && <div><strong>MRC / Région :</strong> {site.mrc_region}</div>}
      {site.distance_m !== null && <div><strong>Distance :</strong> {site.distance_m} m</div>}
      <div style={{ marginTop: 8, fontSize: 11, color: T.muted }}>
        Source : Répertoire des terrains contaminés (GTC), MELCCFP — données déterministes Supabase.
      </div>
    </div>
  );
}

function TabSynthese({ data, score }: { data: FullData; score: ScoreResult }) {
  const p = data.property;
  const sc = scoreColors(score.score);
  const [showContamDetail, setShowContamDetail] = useState(false);

  const isContaminated = p.contamination_statut === "OUI";
  const isRehab = p.contamination_statut === "REHABILITE";
  const isFlood020 = p.zone_inondable_0_20 === "OUI" || p.zone_inondable_0_20 === true;
  const isFlood20100 = p.zone_inondable_20_100 === "OUI" || p.zone_inondable_20_100 === true;
  const hasMH = p.mh_intersecte === "OUI" || p.mh_intersecte === true;
  const pente = p.pente_moyenne_pct;

  const risks = [
    {
      label: "Contamination",
      level: (p.contamination_statut == null || p.contamination_statut === "Inconnu") ? "unknown" as const
        : isContaminated ? "danger" as const
        : isRehab ? "warn" as const : "ok" as const,
      text: (p.contamination_statut == null || p.contamination_statut === "Inconnu") ? "Donnée non disponible"
        : isContaminated ? "Site contaminé répertorié"
        : isRehab ? "Site réhabilité à proximité" : "Aucun site répertorié",
    },
    {
      label: "Zone inondable",
      level: (p.zone_inondable_0_20 === null && p.zone_inondable_20_100 === null) ? "unknown" as const
        : (isFlood020 || isFlood20100) ? "danger" as const : "ok" as const,
      text: (p.zone_inondable_0_20 === null && p.zone_inondable_20_100 === null) ? "Donnée non disponible"
        : isFlood020 ? "Zone 0-20 ans" : isFlood20100 ? "Zone 20-100 ans" : "Hors zone inondable",
    },
    {
      label: "Pente",
      level: pente === null ? "unknown" as const
        : pente < 5 ? "ok" as const : pente < 10 ? "warn" as const : "danger" as const,
      text: pente === null ? "Donnée non disponible"
        : pente < 5 ? `Faible (${pente.toFixed(1)}%)` : pente < 10 ? `Modérée (${pente.toFixed(1)}%)` : `Forte (${pente.toFixed(1)}%)`,
    },
    {
      label: "Milieux humides",
      level: p.mh_intersecte === null ? "unknown" as const
        : hasMH ? "warn" as const : "ok" as const,
      text: p.mh_intersecte === null ? "Donnée non disponible"
        : hasMH ? `Intersection détectée${p.mh_distance_m !== null ? ` (${p.mh_distance_m.toFixed(0)} m)` : ""}` : "Aucune intersection",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* Score + facteurs */}
      <SCard title="Score de faisabilité">
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            display: "inline-block", padding: "20px",
            background: T.navy, borderRadius: 16,
          }}>
            <ScoreArc score={score.score} size={120} />
            <div style={{
              fontFamily: T.sans, fontSize: 14, fontWeight: 600,
              color: sc.border, marginTop: 8,
            }}>{score.label}</div>
          </div>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.5, textTransform: "uppercase", color: T.gold, marginBottom: 10 }}>
          Facteurs clés
        </div>
        {score.factors.map((f, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 0", borderBottom: `1px solid ${T.border}`,
            fontFamily: T.sans, fontSize: 13, color: T.inkSoft,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.gold, flexShrink: 0 }} />
            {f}
          </div>
        ))}
      </SCard>

      {/* Risques */}
      <SCard title="Alertes et contraintes">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {risks.map((r, i) => {
            const isContamRow = r.label === "Contamination" && data.contamination_site;
            return (
              <div key={i}>
                <div
                  onClick={isContamRow ? () => setShowContamDetail(!showContamDetail) : undefined}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px", borderRadius: 10,
                    background: riskColor(r.level) + "08",
                    border: `1px solid ${riskColor(r.level)}20`,
                    cursor: isContamRow ? "pointer" : "default",
                  }}
                >
                  <span style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.ink }}>
                    {r.label}
                    {isContamRow && <span style={{ fontSize: 11, color: T.gold, marginLeft: 8 }}>{showContamDetail ? "[ masquer ]" : "[ voir fiche ]"}</span>}
                  </span>
                  <StatusBadge level={r.level} text={r.text} />
                </div>
                {isContamRow && showContamDetail && (
                  <ContaminationDetail site={data.contamination_site!}  />
                )}
              </div>
            );
          })}
        </div>
      </SCard>

      {/* Fiche rapide */}
      <SCard title="Fiche propriété">
        <KV label="Zonage" value={nd(p.zone_code)} mono />
        <KV label="Superficie" value={p.superficie_m2 !== null ? `${formatNumber(p.superficie_m2)} mètres carrés` : "N/D"} />
        <KV label="CES réel" value={p.ces_reel !== null ? p.ces_reel.toFixed(2) : "N/D"} />
        <KV label="Nb étages" value={nd(p.nb_etages)} />
        <KV label="Nb logements" value={nd(p.nb_logements)} />
        <KV label="Nb bâtiments" value={nd(p.nb_batiments)} />
        <KV label="Numéro de lot" value={nd(p.numero_lot)} mono />
        <KV label="Année construction" value={p.annee_construction !== null ? String(Math.round(p.annee_construction)) : "N/D"} />
      </SCard>

      {/* Réglementation */}
      <SCard title="Réglementation">
        <KV label="COS max" value={p.cos_max !== null ? p.cos_max.toFixed(2) : "N/D"} />
        <KV label="Hauteur max (étages)" value={nd(p.hauteur_max_etages)} />
        <KV label="Hauteur max (m)" value={p.qc_hauteur_max_m !== null ? `${p.qc_hauteur_max_m} m` : "N/D"} />
        <KV label="Aire verte min" value={p.aire_verte_min_pct !== null ? `${p.aire_verte_min_pct} %` : "N/D"} />
        <KV label="Surface constructible" value={p.surface_constructible_pct !== null ? `${p.surface_constructible_pct} %` : "N/D"} />
        <KV label="Densité min (log/ha)" value={p.qc_densite_min_logha !== null ? String(p.qc_densite_min_logha) : "N/D"} />
        <KV label="Dominante zonage" value={nd(p.qc_dominante_label)} />
        <KV label="Type milieu" value={nd(p.qc_type_milieu)} />
      </SCard>
    </div>
  );
}

function TabCarte({ data }: { data: FullData }) {
  const p = data.property;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!p.latitude || !p.longitude || !mapRef.current) return;

    // Load Leaflet CSS
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const scriptId = "leaflet-js";
    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      const map = L.map(mapRef.current).setView([p.latitude, p.longitude], 16);
      mapInstanceRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);
      L.marker([p.latitude, p.longitude]).addTo(map)
        .bindPopup(`<b>${p.adresse || "Propriété"}</b>`).openPopup();
    };

    if (document.getElementById(scriptId)) {
      setTimeout(initMap, 100);
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setTimeout(initMap, 100);
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [p.latitude, p.longitude, p.adresse]);

  if (!p.latitude || !p.longitude) {
    return (
      <SCard title="Localisation">
        <p style={{ fontFamily: T.sans, fontSize: 14, color: T.muted }}>
          Coordonnées géographiques non disponibles pour cette propriété.
        </p>
      </SCard>
    );
  }

  return (
    <div>
      <SCard title="Localisation">
        <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
          <KV label="Latitude" value={p.latitude.toFixed(6)} mono />
          <KV label="Longitude" value={p.longitude.toFixed(6)} mono />
        </div>
      </SCard>
      <div ref={mapRef} style={{
        width: "100%", height: 450, borderRadius: 16,
        border: `1px solid ${T.border}`, overflow: "hidden",
      }} />
    </div>
  );
}

function TabLidar({ data }: { data: FullData }) {
  const p = data.property;
  const hasLidar = p.lidar_match_method && p.lidar_match_method !== "OUTSIDE_COVERAGE";

  const lidarLabels: Record<string, { text: string; level: "ok" | "warn" | "danger" }> = {
    WITHIN: { text: "Haute précision (WITHIN)", level: "ok" },
    NEAREST_OK: { text: "Approximatif (NEAREST_OK)", level: "warn" },
    OUTSIDE_COVERAGE: { text: "Hors couverture", level: "danger" },
  };
  const normalizedMethod = normalizeLidarMethod(p.lidar_match_method);
  const lidarInfo = normalizedMethod ? lidarLabels[normalizedMethod] : null;

  // Elevation bar
  const elevMin = p.elevation_min_m;
  const elevMax = p.elevation_max_m;
  const elevRange = elevMin !== null && elevMax !== null ? elevMax - elevMin : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* Données LiDAR */}
      <SCard title="Métadonnées LiDAR">
        {lidarInfo && (
          <div style={{ marginBottom: 16 }}>
            <StatusBadge level={lidarInfo.level} text={lidarInfo.text} />
          </div>
        )}
        <KV label="Source" value={nd(p.lidar_source)} />
        <KV label="Année" value={nd(p.lidar_year)} />
        <KV label="Distance match" value={p.lidar_match_distance_m !== null ? `${p.lidar_match_distance_m.toFixed(1)} m` : "N/D"} />
        <KV label="Obsolète" value={p.lidar_obsolete === true ? "Oui" : p.lidar_obsolete === false ? "Non" : "N/D"}
          color={p.lidar_obsolete === true ? T.amber : undefined}
        />
      </SCard>

      {/* Topographie */}
      <SCard title="Topographie">
        <KV label="Pente moyenne" value={fmtPct(p.pente_moyenne_pct)}
          color={p.pente_moyenne_pct !== null && p.pente_moyenne_pct >= 10 ? T.red : undefined}
        />
        <KV label="Dénivelé moyen" value={fmtM(p.denivele_moyen_m)} />
        <KV label="Élévation min" value={fmtM(p.elevation_min_m)} />
        <KV label="Élévation max" value={fmtM(p.elevation_max_m)} />

        {/* Elevation profile bar */}
        {elevMin !== null && elevMax !== null && (
          <div style={{ marginTop: 20 }}>
            <div style={{
              fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.5,
              textTransform: "uppercase", color: T.gold, marginBottom: 10,
            }}>Profil d'élévation</div>
            <div style={{ position: "relative", height: 40, borderRadius: 8, overflow: "hidden" }}>
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(90deg, ${T.green}40 0%, ${T.amber}40 50%, ${T.red}40 100%)`,
                borderRadius: 8,
              }} />
              <div style={{
                position: "absolute", left: 0, bottom: 0, top: 0,
                display: "flex", alignItems: "center", paddingLeft: 10,
              }}>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.ink, fontWeight: 600 }}>
                  {elevMin.toFixed(1)} m
                </span>
              </div>
              <div style={{
                position: "absolute", right: 0, bottom: 0, top: 0,
                display: "flex", alignItems: "center", paddingRight: 10,
              }}>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.ink, fontWeight: 600 }}>
                  {elevMax.toFixed(1)} m
                </span>
              </div>
              {elevRange !== null && (
                <div style={{
                  position: "absolute", left: "50%", top: "50%",
                  transform: "translate(-50%, -50%)",
                  fontFamily: T.mono, fontSize: 10, color: T.muted,
                }}>
                  {"\u0394"} {elevRange.toFixed(1)} m
                </div>
              )}
            </div>
          </div>
        )}
      </SCard>
    </div>
  );
}

function TabEnvironnement({ data }: { data: FullData }) {
  const p = data.property;
  const [showContamDetail, setShowContamDetail] = useState(false);
  const isContaminated = p.contamination_statut === "OUI";
  const isRehab = p.contamination_statut === "REHABILITE";
  const isFlood020 = p.zone_inondable_0_20 === "OUI" || p.zone_inondable_0_20 === true;
  const isFlood20100 = p.zone_inondable_20_100 === "OUI" || p.zone_inondable_20_100 === true;
  const hasMH = p.mh_intersecte === "OUI" || p.mh_intersecte === true;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* Contamination */}
      <SCard title="Contamination">
        <div
          onClick={data.contamination_site ? () => setShowContamDetail(!showContamDetail) : undefined}
          style={{ marginBottom: 16, cursor: data.contamination_site ? "pointer" : "default" }}
        >
          {(p.contamination_statut == null || p.contamination_statut === "Inconnu") ? (
            <StatusBadge level="unknown" text="Donnée non disponible" />
          ) : isContaminated ? (
            <StatusBadge level="danger" text="Site contaminé répertorié" />
          ) : isRehab ? (
            <StatusBadge level="warn" text="Site réhabilité à proximité" />
          ) : (
            <StatusBadge level="ok" text="Aucun site répertorié" />
          )}
          {data.contamination_site && (
            <span style={{ fontFamily: T.sans, fontSize: 11, color: T.gold, marginLeft: 10 }}>
              {showContamDetail ? "[ masquer ]" : "[ voir fiche du site ]"}
            </span>
          )}
        </div>
        {showContamDetail && data.contamination_site && (
          <ContaminationDetail site={data.contamination_site}  />
        )}
        <p style={{ fontFamily: T.sans, fontSize: 12.5, color: T.muted, lineHeight: 1.7 }}>
          Vérification dans le répertoire des terrains contaminés (GTC) du MELCCFP.
          Rayon de recherche : 100 m.
        </p>
      </SCard>

      {/* Inondation */}
      <SCard title="Zone inondable">
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: T.sans, fontSize: 13, color: T.inkSoft }}>Récurrence 0-20 ans</span>
            {p.zone_inondable_0_20 === null ? (
              <StatusBadge level="unknown" text="N/D" />
            ) : isFlood020 ? (
              <StatusBadge level="danger" text="OUI" />
            ) : (
              <StatusBadge level="ok" text="NON" />
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: T.sans, fontSize: 13, color: T.inkSoft }}>Récurrence 20-100 ans</span>
            {p.zone_inondable_20_100 === null ? (
              <StatusBadge level="unknown" text="N/D" />
            ) : isFlood20100 ? (
              <StatusBadge level="warn" text="OUI" />
            ) : (
              <StatusBadge level="ok" text="NON" />
            )}
          </div>
        </div>
        <p style={{ fontFamily: T.sans, fontSize: 12.5, color: T.muted, lineHeight: 1.7 }}>
          Zones inondables selon les données du MSP.
        </p>
      </SCard>

      {/* Milieux humides */}
      <SCard title="Milieux humides">
        <div style={{ marginBottom: 16 }}>
          {p.mh_intersecte === null ? (
            <StatusBadge level="unknown" text="Donnée non disponible" />
          ) : hasMH ? (
            <StatusBadge level="warn" text="Intersection détectée" />
          ) : (
            <StatusBadge level="ok" text="Aucune intersection" />
          )}
        </div>
        {p.mh_distance_m !== null && (
          <KV label="Distance" value={`${p.mh_distance_m.toFixed(0)} m`} />
        )}
      </SCard>

      {/* Terrain */}
      <SCard title="Analyse terrain">
        {data.analysis && (
          <>
            <KV label="Type terrain" value={nd(data.analysis.type_terrain)} />
            <KV label="Zone agricole" value={
              p.est_agricole === null ? "Données indisponibles"
                : p.est_agricole ? "OUI" : "NON"
            } color={p.est_agricole === true ? T.red : p.est_agricole === false ? T.green : undefined} />
          </>
        )}
      </SCard>
    </div>
  );
}

function TabProximite({ data }: { data: FullData }) {
  const prox = data.proximity;

  if (!prox) {
    return (
      <SCard title="Accessibilité & Proximité">
        <p style={{ fontFamily: T.sans, fontSize: 14, color: T.muted }}>
          Données de proximité non disponibles pour cette propriété.
        </p>
      </SCard>
    );
  }

  const indices = [
    { key: "idx_transit", label: "Transport en commun", value: prox.idx_transit },
    { key: "idx_epicerie", label: "Épicerie", value: prox.idx_epicerie },
    { key: "idx_sante", label: "Santé", value: prox.idx_sante },
    { key: "idx_parcs", label: "Parcs", value: prox.idx_parcs },
    { key: "idx_educpri", label: "École primaire", value: prox.idx_educpri },
    { key: "idx_garderie", label: "Garderie", value: prox.idx_garderie },
    { key: "idx_pharma", label: "Pharmacie", value: prox.idx_pharma },
    { key: "idx_emp", label: "Emploi", value: prox.idx_emp },
    { key: "idx_educsec", label: "École secondaire", value: prox.idx_educsec },
    { key: "idx_bibl", label: "Bibliothèque", value: prox.idx_bibl },
  ];

  const radarData = indices
    .filter(ix => ix.value !== null)
    .map(ix => ({ subject: ix.label, value: ix.value!, fullMark: 100 }));

  const barColor = (v: number | null) => {
    if (v === null) return T.muted;
    if (v >= 60) return T.green;
    if (v >= 30) return T.gold;
    return T.red;
  };

  const sc = prox.access_score_0_100 !== null ? scoreColors(prox.access_score_0_100) : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* Radar */}
      <SCard title="Radar de proximité">
        {prox.access_score_0_100 !== null && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span style={{
              fontFamily: T.display, fontSize: 42, color: sc?.border || T.ink,
            }}>{prox.access_score_0_100.toFixed(0)}</span>
            <span style={{ fontFamily: T.mono, fontSize: 12, color: T.muted, marginLeft: 4 }}>/ 100</span>
            <div style={{
              fontFamily: T.sans, fontSize: 13, fontWeight: 600,
              color: sc?.border || T.muted, marginTop: 2,
            }}>Score d'accessibilité</div>
          </div>
        )}
        {radarData.length > 2 ? (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 10, fill: T.muted, fontFamily: T.sans }}
              />
              <PolarRadiusAxis
                angle={90} domain={[0, 100]}
                tick={{ fontSize: 9, fill: T.muted }}
              />
              <Radar
                dataKey="value" stroke="#2E86AB" fill="#2E86AB"
                fillOpacity={0.25} strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, textAlign: "center" }}>
            Données insuffisantes pour le radar.
          </p>
        )}
      </SCard>

      {/* Detail bars */}
      <SCard title="Détail des indices">
        {indices.map(ix => (
          <HBar key={ix.key} label={ix.label} value={ix.value} color={barColor(ix.value)} />
        ))}
        <p style={{
          fontFamily: T.sans, fontSize: 11.5, color: T.muted, lineHeight: 1.6,
          marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`,
        }}>
          Indices normalisés 0-100 (Statistique Canada). Plus la valeur est élevée,
          meilleur est l'accès au service.
        </p>
      </SCard>

    </div>
  );
}

/* ── Matrice 5×5 INSPQ ──────────────────────────────────────────── */
function Matrix5x5({ quintMat, quintSoc }: { quintMat: number; quintSoc: number }) {
  const cells = [];
  // Lignes : mat=5 en haut, mat=1 en bas
  for (let mat = 5; mat >= 1; mat--) {
    for (let soc = 1; soc <= 5; soc++) {
      const isActive = mat === quintMat && soc === quintSoc;
      cells.push(
        <div
          key={`${soc}-${mat}`}
          data-testid={`matrix-cell-${soc}-${mat}`}
          className={isActive ? "active" : ""}
          style={{
            width: 36, height: 36, borderRadius: 6,
            background: isActive ? T.gold : T.subtle,
            border: isActive ? `2px solid ${T.gold}` : `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontFamily: T.mono, fontWeight: 600,
            color: isActive ? T.navy : "transparent",
            transition: "all .2s ease",
          }}
        >
          {isActive ? `${mat},${soc}` : ""}
        </div>
      );
    }
  }

  return (
    <div style={{ display: "inline-block" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Label axe Y */}
        <div style={{
          writingMode: "vertical-rl", transform: "rotate(180deg)",
          fontFamily: T.mono, fontSize: 9, color: T.muted,
          letterSpacing: 1, textTransform: "uppercase",
        }}>Mat.</div>
        {/* Grille */}
        <div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(5, 36px)",
            gap: 3,
          }}>
            {cells}
          </div>
          {/* Label axe X */}
          <div style={{
            textAlign: "center", marginTop: 6,
            fontFamily: T.mono, fontSize: 9, color: T.muted,
            letterSpacing: 1, textTransform: "uppercase",
          }}>Soc.</div>
        </div>
      </div>
    </div>
  );
}

/* ── Onglet Défavorisation ──────────────────────────────────────── */

function ScatterPlotDefav({ centMat, centSoc }: { centMat: number; centSoc: number }) {
  const pointData = [{ centSoc, centMat }];

  return (
    <div style={{ width: "100%", maxWidth: 420, aspectRatio: "1 / 1" }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis
            type="number" dataKey="centSoc" name="Centile social"
            domain={[0, 100]} ticks={[0, 25, 50, 75, 100]}
            tick={{ fontFamily: T.mono, fontSize: 10, fill: T.muted }}
            label={{ value: "Centile social", position: "insideBottom", offset: -28, fontFamily: T.sans, fontSize: 12, fill: T.inkSoft }}
            stroke={T.border}
          />
          <YAxis
            type="number" dataKey="centMat" name="Centile matériel"
            domain={[0, 100]} ticks={[0, 25, 50, 75, 100]}
            tick={{ fontFamily: T.mono, fontSize: 10, fill: T.muted }}
            label={{ value: "Centile matériel", angle: -90, position: "insideLeft", offset: -24, fontFamily: T.sans, fontSize: 12, fill: T.inkSoft }}
            stroke={T.border}
          />
          <ReferenceLine x={50} stroke={T.border} strokeDasharray="6 4" />
          <ReferenceLine y={50} stroke={T.border} strokeDasharray="6 4" />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const d = payload[0].payload;
              return (
                <div style={{
                  background: T.white, border: `1px solid ${T.border}`,
                  borderRadius: 8, padding: "8px 12px",
                  fontFamily: T.mono, fontSize: 12, color: T.ink,
                  boxShadow: "0 2px 8px rgba(27,42,74,0.12)",
                }}>
                  CentMat : {d.centMat} | CentSoc : {d.centSoc}
                </div>
              );
            }}
          />
          <Scatter data={pointData} fill={T.gold}>
            {pointData.map((_, i) => (
              <Cell key={i} fill={T.gold} stroke={T.goldDim} strokeWidth={2} r={8} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function GeoComparisonChart({ data }: { data: DefavorisationData }) {
  const levels = [
    {
      name: "Provincial",
      mat: data.quintMat,
      soc: data.quintSoc,
    },
    {
      name: "RSS",
      mat: data.regional?.quintMatRSS ?? null,
      soc: data.regional?.quintSocRSS ?? null,
    },
    {
      name: "RTS",
      mat: (data.rts_detail as Record<string, unknown>)?.quintMatRTS as number | null ?? null,
      soc: (data.rts_detail as Record<string, unknown>)?.quintSocRTS as number | null ?? null,
    },
    {
      name: "RLS",
      mat: (data.rls_detail as Record<string, unknown>)?.quintMatRLS as number | null ?? null,
      soc: (data.rls_detail as Record<string, unknown>)?.quintSocRLS as number | null ?? null,
    },
    {
      name: "CLSC",
      mat: (data.clsc_detail as Record<string, unknown>)?.quintMatCLSC as number | null ?? null,
      soc: (data.clsc_detail as Record<string, unknown>)?.quintSocCLSC as number | null ?? null,
    },
  ];

  const chartData = levels.map(l => ({
    name: l.name,
    mat: l.mat != null ? l.mat : 0,
    soc: l.soc != null ? l.soc : 0,
    matValid: l.mat != null,
    socValid: l.soc != null,
  }));

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 20, bottom: 8, left: 70 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
          <XAxis
            type="number" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]}
            tick={{ fontFamily: T.mono, fontSize: 10, fill: T.muted }}
            stroke={T.border}
          />
          <YAxis
            type="category" dataKey="name"
            tick={{ fontFamily: T.sans, fontSize: 12, fill: T.inkSoft }}
            stroke="none" width={60}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const d = payload[0]?.payload;
              return (
                <div style={{
                  background: T.white, border: `1px solid ${T.border}`,
                  borderRadius: 8, padding: "8px 12px",
                  fontFamily: T.mono, fontSize: 11, color: T.ink,
                  boxShadow: "0 2px 8px rgba(27,42,74,0.12)",
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
                  <div>Matériel : {d?.matValid ? d.mat : "N/D"}</div>
                  <div>Social : {d?.socValid ? d.soc : "N/D"}</div>
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ fontFamily: T.sans, fontSize: 11 }}
            formatter={(value: string) => <span style={{ color: T.inkSoft }}>{value}</span>}
          />
          <Bar dataKey="mat" name="Matériel" fill={T.navy} barSize={14} radius={[0, 4, 4, 0]} />
          <Bar dataKey="soc" name="Social" fill={T.gold} barSize={14} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const LEGENDES_INDICE = [
  { code: "C1", label: "Aire de diffusion matériellement et socialement très favorisée" },
  { code: "C2", label: "Aire de diffusion moyenne" },
  { code: "C3", label: "Aire de diffusion matériellement favorisée et socialement très défavorisée" },
  { code: "C4", label: "Aire de diffusion socialement favorisée et matériellement très défavorisée" },
  { code: "C5", label: "Aire de diffusion matériellement et socialement très défavorisée" },
] as const;

function TabDefavorisation({ data }: { data: FullData }) {
  const d = data.defavorisation;
  if (d == null) return null;

  const indicesAvailable = d.quintMat >= 1 && d.quintMat <= 5
                         && d.quintSoc >= 1 && d.quintSoc <= 5;

  const zoneLabels: Record<number, string> = {
    1: "Urbaine (grande)", 2: "Urbaine (petite)",
    3: "Rurale (forte)", 4: "Rurale (faible)",
  };

  const indiceCom: string | null = (typeof d.com === "string" && d.com.length > 0) ? d.com : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Légende indice combiné ─────────────────────────────────── */}
      <SCard title="Indice combiné matériel et social">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {LEGENDES_INDICE.map(item => {
            const isActive = indiceCom === item.code;
            return (
              <div
                key={item.code}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: isActive ? T.gold + "18" : "transparent",
                  border: isActive ? `2px solid ${T.gold}` : `1px solid ${T.border}`,
                  transition: "all .15s ease",
                }}
              >
                <span style={{
                  fontFamily: T.mono, fontSize: 13, fontWeight: 700,
                  color: isActive ? T.gold : T.muted,
                  minWidth: 28,
                }}>
                  {item.code}
                </span>
                <span style={{
                  fontFamily: T.sans, fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? T.ink : T.inkSoft,
                }}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </SCard>

      {/* ── Section A — Positionnement ──────────────────────────────── */}
      <SCard title="Positionnement matériel et social">
        {indicesAvailable ? (
          <>
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 32, alignItems: "flex-start",
              justifyContent: "center",
            }}>
              {/* Scatter plot */}
              <ScatterPlotDefav centMat={d.centMat} centSoc={d.centSoc} />

              {/* Matrice 5×5 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{
                  fontFamily: T.mono, fontSize: 9.5, letterSpacing: 2,
                  textTransform: "uppercase", color: T.muted,
                }}>Matrice quintiles</div>
                <Matrix5x5 quintMat={d.quintMat} quintSoc={d.quintSoc} />
                <div style={{
                  fontFamily: T.mono, fontSize: 11, color: T.ink,
                  background: T.subtle, borderRadius: 6, padding: "4px 10px",
                }}>
                  Mat. {d.quintMat} / Soc. {d.quintSoc}
                </div>
              </div>
            </div>

            {/* Valeurs centiles sous le graphique */}
            <div style={{
              marginTop: 16, textAlign: "center",
              fontFamily: T.mono, fontSize: 13, color: T.ink,
            }}>
              Centile matériel : <strong>{d.centMat}</strong> / 100 &nbsp;&nbsp;|&nbsp;&nbsp; Centile social : <strong>{d.centSoc}</strong> / 100
            </div>
          </>
        ) : (
          <div style={{
            padding: 32, textAlign: "center",
            fontFamily: T.sans, fontSize: 14, color: T.muted,
          }}>
            Indices non calculés pour cette aire de diffusion.
          </div>
        )}
      </SCard>

      {/* ── Section B — Indices détaillés ───────────────────────────── */}
      <SCard title="Indices détaillés">
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "0 32px",
        }}>
          <div>
            <KV label="Centile matériel" value={`${d.centMat} / 100`} mono />
            <KV label="Centile social" value={`${d.centSoc} / 100`} mono />
            <KV label="Quintile matériel" value={`${d.quintMat} / 5`} mono />
          </div>
          <div>
            <KV label="Quintile social" value={`${d.quintSoc} / 5`} mono />
            <KV label="Indice combiné" value={d.com} mono />
            <KV label="Indice combiné 3c" value={d.com3} mono />
          </div>
          <div>
            <KV label="Zone de résidence" value={zoneLabels[d.zone] ?? String(d.zone)} />
            <KV label="Score factoriel mat." value={d.noteMat !== null ? d.noteMat : "N/D"} mono />
            <KV label="Score factoriel soc." value={d.noteSoc !== null ? d.noteSoc : "N/D"} mono />
          </div>
        </div>
      </SCard>

      {/* ── Section C — Comparaison multi-niveaux ──────────────────── */}
      <SCard title="Comparaison multi-niveaux géographiques">
        <div style={{
          fontFamily: T.sans, fontSize: 12, color: T.muted,
          marginTop: -8, marginBottom: 16,
        }}>
          Quintiles matériels et sociaux par niveau de découpage (échelle 1–5)
        </div>
        <GeoComparisonChart data={d} />

        {/* Tableau complémentaire avec l'indice combiné */}
        <div style={{ marginTop: 20, overflowX: "auto" }}>
          <table style={{
            width: "100%", borderCollapse: "collapse",
            fontFamily: T.sans, fontSize: 12.5,
          }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                <th style={{ textAlign: "left", padding: "8px 12px", color: T.muted, fontWeight: 500 }}>Niveau</th>
                <th style={{ textAlign: "center", padding: "8px 12px", color: T.muted, fontWeight: 500 }}>Quint. Mat.</th>
                <th style={{ textAlign: "center", padding: "8px 12px", color: T.muted, fontWeight: 500 }}>Quint. Soc.</th>
                <th style={{ textAlign: "center", padding: "8px 12px", color: T.muted, fontWeight: 500 }}>Combiné</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Provincial", qm: d.quintMat, qs: d.quintSoc, com: d.com },
                { label: "Régional (RSS)", qm: d.regional?.quintMatRSS, qs: d.regional?.quintSocRSS, com: d.regional?.comRSS },
                { label: "Territorial (RTS)", qm: (d.rts_detail as Record<string, unknown>)?.quintMatRTS as number | null, qs: (d.rts_detail as Record<string, unknown>)?.quintSocRTS as number | null, com: (d.rts_detail as Record<string, unknown>)?.comRTS as string | null },
                { label: "Local (RLS)", qm: (d.rls_detail as Record<string, unknown>)?.quintMatRLS as number | null, qs: (d.rls_detail as Record<string, unknown>)?.quintSocRLS as number | null, com: (d.rls_detail as Record<string, unknown>)?.comRLS as string | null },
                { label: "CLSC", qm: (d.clsc_detail as Record<string, unknown>)?.quintMatCLSC as number | null, qs: (d.clsc_detail as Record<string, unknown>)?.quintSocCLSC as number | null, com: (d.clsc_detail as Record<string, unknown>)?.comCLSC as string | null },
              ].map((row, i) => (
                <tr key={row.label} style={{
                  borderBottom: `1px solid ${T.border}`,
                  background: i === 0 ? T.subtle : "transparent",
                }}>
                  <td style={{ padding: "8px 12px", fontWeight: i === 0 ? 600 : 400, color: T.ink }}>{row.label}</td>
                  <td style={{ textAlign: "center", padding: "8px 12px", fontFamily: T.mono, fontWeight: 600, color: T.ink }}>
                    {row.qm != null ? row.qm : "N/D"}
                  </td>
                  <td style={{ textAlign: "center", padding: "8px 12px", fontFamily: T.mono, fontWeight: 600, color: T.ink }}>
                    {row.qs != null ? row.qs : "N/D"}
                  </td>
                  <td style={{ textAlign: "center", padding: "8px 12px", fontFamily: T.mono, fontWeight: 600, color: T.ink }}>
                    {row.com != null ? String(row.com) : "N/D"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SCard>

      {/* ── Pied d'onglet ──────────────────────────────────────────── */}
      <div style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.muted }}>
            AD : {d.adidu}
            {d.adpop2021 !== null ? ` | Pop. ${d.adpop2021.toLocaleString("fr-CA")}` : ""}
          </div>
        </div>
        <div style={{
          fontFamily: T.sans, fontSize: 10.5, color: T.muted, lineHeight: 1.6,
          borderTop: `1px solid ${T.border}`, paddingTop: 8,
        }}>
          Institut national de santé publique du Québec, Indice de défavorisation matérielle et sociale compilé par le Bureau d{"'"}information et d{"'"}études en santé des populations (BIESP) à partir des données des recensements canadiens de 1991, 1996, 2001, 2006, 2011, 2016{" "}
          <a
            href="https://www.inspq.qc.ca/defavorisation/indice-de-defavorisation-materielle-et-sociale"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: T.muted,
              textDecoration: "underline", textDecorationColor: T.border,
            }}
          >
            [En ligne]
          </a>
        </div>
      </div>
    </div>
  );
}

function TabFinances({ data }: { data: FullData }) {
  const p = data.property;

  // Derived calculations
  const prixM2 = (p.valeur_totale && p.superficie_m2 && p.superficie_m2 > 0)
    ? p.valeur_totale / p.superficie_m2 : null;
  const prixTerrainM2 = (p.valeur_terrain && p.superficie_m2 && p.superficie_m2 > 0)
    ? p.valeur_terrain / p.superficie_m2 : null;
  const variationPct = (p.valeur_totale && p.valeur_anterieure && p.valeur_anterieure > 0)
    ? ((p.valeur_totale - p.valeur_anterieure) / p.valeur_anterieure) * 100 : null;

  // Donut data (terrain vs batiment)
  const terrainPct = (p.valeur_terrain && p.valeur_totale && p.valeur_totale > 0)
    ? (p.valeur_terrain / p.valeur_totale) * 100 : null;
  const batimentPct = (p.valeur_batiment && p.valeur_totale && p.valeur_totale > 0)
    ? (p.valeur_batiment / p.valeur_totale) * 100 : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* Évaluation foncière */}
      <SCard title="Évaluation foncière">
        <div style={{
          fontFamily: T.display, fontSize: 34, color: T.navy,
          marginBottom: 16, letterSpacing: -1,
        }}>
          {formatCurrency(p.valeur_totale)}
        </div>
        <KV label="Valeur totale" value={formatCurrency(p.valeur_totale)} />
        <KV label="Valeur terrain" value={formatCurrency(p.valeur_terrain)} />
        <KV label="Valeur bâtiment" value={formatCurrency(p.valeur_batiment)} />
        <KV label="Valeur antérieure" value={formatCurrency(p.valeur_anterieure)} />
        {variationPct !== null && (
          <KV
            label="Variation"
            value={`${variationPct > 0 ? "+" : ""}${variationPct.toFixed(1)} %`}
            color={variationPct >= 0 ? T.green : T.red}
          />
        )}
      </SCard>

      {/* Répartition */}
      <SCard title="Répartition de la valeur">
        {terrainPct !== null && batimentPct !== null ? (
          <div>
            {/* Simple donut via SVG */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <svg viewBox="0 0 120 120" width={160} height={160}>
                <circle cx="60" cy="60" r="50" fill="none" stroke={T.gold} strokeWidth="12"
                  strokeDasharray={`${terrainPct * 3.14} ${100 * 3.14}`}
                  transform="rotate(-90 60 60)"
                />
                <circle cx="60" cy="60" r="50" fill="none" stroke={T.navy} strokeWidth="12"
                  strokeDasharray={`${batimentPct * 3.14} ${100 * 3.14}`}
                  strokeDashoffset={`${-terrainPct * 3.14}`}
                  transform="rotate(-90 60 60)"
                />
              </svg>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: T.gold }} />
                <span style={{ fontFamily: T.sans, fontSize: 12.5, color: T.inkSoft }}>
                  Terrain {terrainPct.toFixed(0)}%
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: T.navy }} />
                <span style={{ fontFamily: T.sans, fontSize: 12.5, color: T.inkSoft }}>
                  Bâtiment {batimentPct.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ fontFamily: T.sans, fontSize: 14, color: T.muted }}>
            Répartition non disponible.
          </p>
        )}
      </SCard>

      {/* Ratios */}
      <SCard title="Ratios">
        <KV label="Prix au mètre carré (total)" value={prixM2 !== null ? `${formatNumber(Math.round(prixM2))} $/mètre carré` : "N/D"} mono />
        <KV label="Prix au mètre carré (terrain)" value={prixTerrainM2 !== null ? `${formatNumber(Math.round(prixTerrainM2))} $/mètre carré` : "N/D"} mono />
        {data.analysis?.prix_terrain_pi2 !== null && data.analysis?.prix_terrain_pi2 !== undefined && (
          <KV label="Prix terrain (pied carré)" value={`${data.analysis.prix_terrain_pi2.toFixed(2)} $/pied carré`} mono />
        )}
        <KV label="CES réel" value={p.ces_reel !== null ? p.ces_reel.toFixed(2) : "N/D"} />
        <KV label="Façade" value={p.front_m !== null ? `${p.front_m.toFixed(1)} m` : "N/D"} />
      </SCard>

      {/* Bâtiment */}
      <SCard title="Bâtiment">
        <KV label="Année construction" value={p.annee_construction !== null ? String(Math.round(p.annee_construction)) : "N/D"} />
        <KV label="Superficie bâtiment" value={p.superficie_batiment_m2 !== null ? `${formatNumber(p.superficie_batiment_m2)} mètres carrés` : "N/D"} />
        <KV label="Nb étages" value={nd(p.nb_etages)} />
        <KV label="Nb logements" value={nd(p.nb_logements)} />
        <KV label="Nb bâtiments" value={nd(p.nb_batiments)} />
      </SCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB: PERMIS DE CONSTRUCTION
═══════════════════════════════════════════════════════════════════ */
function TabPermis({ data }: { data: FullData }) {
  const permits = data.permits ?? [];

  if (permits.length === 0) {
    return (
      <SCard title="Permis de construction">
        <p style={{ fontFamily: T.sans, fontSize: 14, color: T.muted }}>
          Aucun permis de construction dans un rayon de 200 m.
        </p>
      </SCard>
    );
  }

  const distColor = (d: number | null) => {
    if (d == null) return T.muted;
    if (d <= 10) return "#16a34a";
    if (d <= 50) return T.gold;
    return T.muted;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SCard title={`Permis de construction — rayon 200 m (${permits.length})`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {permits.map((pm, i) => (
            <div key={`${pm.no_demande}-${i}`} style={{
              padding: "12px 16px",
              background: i % 2 === 0 ? T.cream : "#fff",
              borderRadius: 8,
              border: `1px solid ${T.cream}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy, fontWeight: 600 }}>
                    {pm.no_demande ?? "N/D"}
                  </span>
                  {pm.distance_m != null && (
                    <span style={{
                      fontFamily: T.mono, fontSize: 10.5, fontWeight: 600,
                      color: distColor(pm.distance_m),
                      background: `${distColor(pm.distance_m)}18`,
                      padding: "1px 7px", borderRadius: 10,
                    }}>
                      {pm.distance_m.toFixed(0)} m
                    </span>
                  )}
                </div>
                <span style={{ fontFamily: T.mono, fontSize: 12, color: T.muted }}>
                  {pm.date_emission ?? "Date N/D"}
                </span>
              </div>
              {pm.adresse_brute && (
                <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.inkSoft, marginBottom: 4 }}>
                  {pm.adresse_brute}
                </div>
              )}
              {pm.description_type && (
                <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink, marginBottom: 4 }}>
                  {pm.description_type}
                </div>
              )}
              {pm.nature_travaux && (
                <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.inkSoft }}>
                  {pm.nature_travaux}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                {pm.categorie && (
                  <span style={{
                    fontFamily: T.sans, fontSize: 11, color: T.navy,
                    background: T.cream, padding: "2px 8px", borderRadius: 4,
                  }}>
                    {pm.categorie}
                  </span>
                )}
                {pm.nb_logements != null && pm.nb_logements > 0 && (
                  <span style={{ fontFamily: T.sans, fontSize: 11, color: T.inkSoft }}>
                    {pm.nb_logements} logement{pm.nb_logements > 1 ? "s" : ""}
                  </span>
                )}
                {pm.source_ville && (
                  <span style={{ fontFamily: T.sans, fontSize: 11, color: T.muted, textTransform: "capitalize" }}>
                    {pm.source_ville}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </SCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function PreviewPage() {
  const params = useParams<{ matricule: string }>();
  const router = useRouter();
  const [fullData, setFullData] = useState<FullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("synthese");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const tabs = useMemo(() => {
    if (fullData?.defavorisation != null) return ALL_TABS;
    return ALL_TABS.filter(t => t.id !== "defavorisation");
  }, [fullData?.defavorisation]);

  useEffect(() => {
    if (!params.matricule) return;
    fetch(`/api/property-data/${params.matricule}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setFullData(null); setLoading(false); return; }
        setFullData(d);
        setLoading(false);
      })
      .catch(() => { setFullData(null); setLoading(false); });
  }, [params.matricule]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Build PropertyPreview for calculateScore (used as fallback + for factors)
  const preview = useMemo<PropertyPreview | null>(() => {
    if (!fullData) return null;
    const p = fullData.property;
    return {
      id: p.id,
      matricule: p.matricule,
      adresse: p.adresse || "Adresse non disponible",
      municipalite: "Quebec",
      code_municipalite: p.code_municipalite || "",
      latitude: p.latitude,
      longitude: p.longitude,
      zonage: p.zone_code,
      zonage_dominante: p.qc_dominante,                    // T3: champ DB prioritaire
      superficie: p.superficie_m2,
      evaluation_fonciere: p.valeur_totale,
      pente_moyenne_pct: p.pente_moyenne_pct,
      lidar_match_method: normalizeLidarMethod(p.lidar_match_method) as any,
      lidar_match_distance_m: p.lidar_match_distance_m,
      contamination: p.contamination_statut === "OUI" ? true       // T2: OUI = -20
        : p.contamination_statut === "NON" ? false                  // NON = +5
        : null,                                                     // REHABILITE/Inconnu/NULL = neutre (0)
      zone_inondable: (p.zone_inondable_0_20 != null)
        ? (p.zone_inondable_0_20 === "OUI" || p.zone_inondable_0_20 === true)
        : null,
      densite_max: p.cos_max != null                        // T5: fallback qc_densite
        ? p.cos_max
        : p.qc_densite_min_logha != null
          ? p.qc_densite_min_logha / 30
          : null,
      hauteur_max: p.hauteur_max_etages,
    };
  }, [fullData]);

  // Score unique : score_scanimmo DB quand disponible.
  // Fallback frontend uniquement si la base n'a pas encore de score materialise.
  const score = useMemo<ScoreResult | null>(() => {
    if (!fullData || !preview) return null;

    return resolveScore(preview, fullData.property.score_scanimmo);
  }, [fullData, preview]);

  /* ── Generate PDF ──────────────────────────────────────────────── */
  const handleGenerate = async () => {
    if (!fullData) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/generate-free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule: fullData.property.matricule, force: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de la génération");
      router.push(`/success?matricule=${fullData.property.matricule}&token=${json.token}`);
    } catch (err: any) {
      setGenError(err.message || "Erreur inattendue");
      setGenerating(false);
    }
  };

  /* ── Loading ────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: T.cream, fontFamily: T.sans,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: `3px solid ${T.border}`,
            borderTopColor: T.gold, borderRadius: "50%",
            animation: "spin .7s linear infinite",
            margin: "0 auto 20px",
          }} />
          <div style={{ fontFamily: T.mono, fontSize: 12, color: T.muted, letterSpacing: 1.5 }}>
            CHARGEMENT DES DONNÉES...
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  /* ── Not found ──────────────────────────────────────────────────── */
  if (!fullData || !score) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: T.cream, fontFamily: T.sans,
      }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontFamily: T.display, fontSize: 64, color: T.navy, marginBottom: 16 }}>404</div>
          <h1 style={{ fontFamily: T.display, fontSize: 28, color: T.navy, marginBottom: 12, fontWeight: 400 }}>
            Propriété introuvable
          </h1>
          <p style={{ fontFamily: T.sans, fontSize: 15, color: T.muted, lineHeight: 1.7, marginBottom: 32 }}>
            Le matricule <span style={{ fontFamily: T.mono, color: T.ink }}>{params.matricule}</span> ne
            correspond à aucune propriété dans notre base de données.
          </p>
          <a href="/" style={{
            display: "inline-block", padding: "14px 32px",
            background: T.navy, borderRadius: 10, textDecoration: "none",
            fontFamily: T.sans, fontSize: 14, fontWeight: 600,
            color: T.goldLt, letterSpacing: .3,
          }}>
            Nouvelle recherche
          </a>
        </div>
      </div>
    );
  }

  const p = fullData.property;
  const sc = scoreColors(score.score);

  const metrics = [
    { label: "Zonage", value: p.zone_code || "N/D", unit: "" },
    { label: "Superficie", value: formatNumber(p.superficie_m2), unit: "mètres carrés" },
    {
      label: "Pente moyenne",
      value: typeof p.pente_moyenne_pct === "number" ? p.pente_moyenne_pct.toFixed(1) : "N/D",
      unit: typeof p.pente_moyenne_pct === "number" ? "%" : "",
    },
    { label: "Évaluation foncière", value: formatCurrency(p.valeur_totale), unit: "" },
  ];

  const lidarLabels: Record<string, { text: string; color: string }> = {
    WITHIN: { text: "Données LiDAR haute précision disponibles", color: T.green },
    NEAREST_OK: { text: "Données LiDAR approximatives", color: T.amber },
    OUTSIDE_COVERAGE: { text: "Hors couverture LiDAR", color: T.red },
  };
  const normLidar = normalizeLidarMethod(p.lidar_match_method);

  return (
    <div style={{ fontFamily: T.sans, background: T.cream, minHeight: "100vh", color: T.ink }}>

      {/* ── TOPBAR ──────────────────────────────────────────────────── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 900,
        height: 56,
        background: scrolled ? "rgba(15,43,75,.97)" : T.navy,
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: `1px solid rgba(196,154,40,.12)`,
        display: "flex", alignItems: "center",
        padding: "0 40px",
        transition: "all .3s ease",
      }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontFamily: T.display, fontSize: 17, fontWeight: 400,
            color: T.goldLt, letterSpacing: 2.5, textTransform: "uppercase",
          }}>SCANIMMO</span>
          <span style={{
            fontFamily: T.mono, fontSize: 9, color: T.gold + "77",
            border: `1px solid ${T.gold}44`, borderRadius: 4,
            padding: "2px 6px", letterSpacing: 1.5,
          }}>BETA</span>
        </a>
        <div style={{ flex: 1 }} />
        <a href="/" style={{
          fontFamily: T.sans, fontSize: 13, color: "rgba(255,255,255,.52)",
          textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
          transition: "color .15s",
        }}
          onMouseEnter={e => e.currentTarget.style.color = T.goldLt}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.52)"}
        >
          {"\u2190"} Nouvelle recherche
        </a>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section style={{
        paddingTop: 56,
        background: `linear-gradient(160deg, ${T.navyDeep} 0%, ${T.navy} 50%, ${T.navyLt} 100%)`,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: .025,
          backgroundImage: "radial-gradient(circle at 1px 1px,#fff 1px,transparent 0)",
          backgroundSize: "18px 18px", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: "40%", right: "20%",
          width: 400, height: 400, borderRadius: "50%",
          background: `radial-gradient(circle,${T.gold}12 0%,transparent 65%)`,
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 40px 56px" }}>
          <div style={{
            fontFamily: T.mono, fontSize: 10.5, letterSpacing: 2.5,
            textTransform: "uppercase", color: T.gold, marginBottom: 16,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ display: "inline-block", width: 24, height: 1.5, background: T.gold }} />
            Fiche propriété
          </div>

          <h1 style={{
            fontFamily: T.display, fontSize: "clamp(28px,4vw,48px)",
            fontWeight: 400, color: T.white,
            margin: "0 0 12px", lineHeight: 1.15, letterSpacing: -1,
          }}>
            {p.adresse || "Adresse non disponible"}
          </h1>

          <div style={{
            fontFamily: T.sans, fontSize: 15, color: "rgba(255,255,255,.45)",
            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
          }}>
            <span>Matricule <span style={{ fontFamily: T.mono, color: "rgba(255,255,255,.6)" }}>{p.matricule}</span></span>
            {p.latitude && p.longitude && (
              <>
                <span style={{ color: "rgba(255,255,255,.15)" }}>{"\u00b7"}</span>
                <span style={{ fontFamily: T.mono, fontSize: 12, color: "rgba(255,255,255,.3)" }}>
                  {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                </span>
              </>
            )}
          </div>

          {/* Score + Metriques */}
          <div style={{
            marginTop: 48,
            display: "grid", gridTemplateColumns: "auto 1fr", gap: 40,
            alignItems: "start",
          }}>
            <div style={{
              background: "rgba(255,255,255,.04)",
              border: `1px solid rgba(255,255,255,.08)`,
              borderRadius: 16, padding: "28px 32px",
              textAlign: "center", minWidth: 160,
            }}>
              <ScoreArc score={score.score} />
              <div style={{
                fontFamily: T.sans, fontSize: 13, fontWeight: 600,
                color: sc.border, marginTop: 8,
              }}>{score.label}</div>
              <div style={{
                fontFamily: T.mono, fontSize: 9.5, color: "rgba(255,255,255,.25)",
                letterSpacing: 1, textTransform: "uppercase", marginTop: 2,
              }}>Score Scanimmo</div>
            </div>

            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{
                  fontFamily: T.mono, fontSize: 9.5, letterSpacing: 2,
                  textTransform: "uppercase", color: T.gold, marginBottom: 12,
                }}>Facteurs clés</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {score.factors.map((f, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      fontFamily: T.sans, fontSize: 13.5, color: "rgba(255,255,255,.6)",
                    }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.gold, flexShrink: 0 }} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
                {metrics.map((m, i) => (
                  <div key={i} style={{ padding: "16px 20px", borderLeft: `2px solid ${T.gold}33` }}>
                    <div style={{
                      fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.5,
                      textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 8,
                    }}>{m.label}</div>
                    <div style={{
                      fontFamily: T.display, fontSize: 22, color: T.white,
                      letterSpacing: -.5, lineHeight: 1,
                    }}>
                      {m.value}
                      {m.unit && <span style={{ fontFamily: T.sans, fontSize: 13, color: "rgba(255,255,255,.4)", marginLeft: 2 }}>{m.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIDAR BADGE ──────────────────────────────────────────── */}
      {normLidar && lidarLabels[normLidar] && (
        <div style={{
          background: T.navy,
          borderBottom: `1px solid rgba(196,154,40,.12)`,
          padding: "12px 40px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: lidarLabels[normLidar].color,
          }} />
          <span style={{
            fontFamily: T.mono, fontSize: 11.5, fontWeight: 500,
            color: "rgba(255,255,255,.5)", letterSpacing: .5,
          }}>
            {lidarLabels[normLidar].text}
          </span>
          {p.lidar_match_distance_m !== null && normLidar === "NEAREST_OK" && (
            <span style={{ fontFamily: T.mono, fontSize: 10, color: "rgba(255,255,255,.25)" }}>
              ({p.lidar_match_distance_m.toFixed(0)} m)
            </span>
          )}
        </div>
      )}

      {/* ── TABS ─────────────────────────────────────────────────── */}
      <div style={{
        background: T.white,
        borderBottom: `1px solid ${T.border}`,
        position: "sticky", top: 56, zIndex: 800,
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", gap: 0, padding: "0 40px",
          overflowX: "auto",
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "16px 24px",
                fontFamily: T.sans, fontSize: 13.5, fontWeight: 600,
                color: activeTab === tab.id ? T.navy : T.muted,
                background: "none", border: "none", cursor: "pointer",
                borderBottom: `2px solid ${activeTab === tab.id ? T.gold : "transparent"}`,
                transition: "all .15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = T.ink; }}
              onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = T.muted; }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────────── */}
      <section style={{ padding: "32px 40px 40px", background: T.cream }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {activeTab === "synthese" && <TabSynthese data={fullData} score={score} />}
          {activeTab === "carte" && <TabCarte data={fullData} />}
          {activeTab === "lidar" && <TabLidar data={fullData} />}
          {activeTab === "env" && <TabEnvironnement data={fullData} />}
          {activeTab === "proximite" && <TabProximite data={fullData} />}
          {activeTab === "defavorisation" && fullData.defavorisation != null && <TabDefavorisation data={fullData} />}
          {activeTab === "finances" && <TabFinances data={fullData} />}
          {activeTab === "permis" && <TabPermis data={fullData} />}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section style={{ padding: "0 40px 72px", background: T.cream }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            background: `linear-gradient(135deg, ${T.navyDeep} 0%, ${T.navy} 100%)`,
            borderRadius: 20, padding: "48px 40px",
            textAlign: "center", position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              width: 400, height: 400, borderRadius: "50%",
              background: `radial-gradient(circle,${T.gold}10 0%,transparent 65%)`,
              transform: "translate(-50%,-50%)", pointerEvents: "none",
            }} />
            <div style={{
              fontFamily: T.mono, fontSize: 10.5, letterSpacing: 3,
              textTransform: "uppercase", color: T.gold,
              marginBottom: 16, position: "relative",
            }}>
              Gratuit {"\u00b7"} sans engagement
            </div>
            <h3 style={{
              fontFamily: T.display, fontSize: 30, fontWeight: 400,
              color: T.white, margin: "0 0 12px",
              letterSpacing: -.5, position: "relative",
            }}>
              Télécharger le rapport <em style={{ fontStyle: "italic", color: T.goldLt }}>PDF complet</em>
            </h3>
            <p style={{
              fontFamily: T.sans, fontSize: 15, color: "rgba(255,255,255,.45)",
              maxWidth: 480, margin: "0 auto 32px",
              lineHeight: 1.7, position: "relative",
            }}>
              Toutes les données ci-dessus dans un rapport PDF professionnel.
              Génération en quelques secondes.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                padding: "16px 48px",
                background: generating ? T.border : T.gold,
                border: "none", cursor: generating ? "default" : "pointer",
                borderRadius: 12,
                fontFamily: T.sans, fontSize: 16, fontWeight: 600,
                color: generating ? T.muted : T.navy,
                letterSpacing: .3, transition: "all .15s",
                position: "relative",
                display: "inline-flex", alignItems: "center", gap: 10,
              }}
              onMouseEnter={e => { if (!generating) e.currentTarget.style.background = T.goldLt; }}
              onMouseLeave={e => { if (!generating) e.currentTarget.style.background = T.gold; }}
            >
              {generating ? (
                <>
                  <span style={{
                    width: 16, height: 16, border: `2px solid ${T.muted}`,
                    borderTopColor: T.navy, borderRadius: "50%",
                    animation: "spin .7s linear infinite",
                    display: "inline-block",
                  }} />
                  Génération en cours...
                </>
              ) : (
                <>Générer le rapport PDF {"\u2192"}</>
              )}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            {genError && (
              <p style={{
                fontFamily: T.sans, fontSize: 14, color: "#FCA5A5",
                marginTop: 16, position: "relative",
              }}>{genError}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── DISCLAIMER ────────────────────────────────────────────── */}
      <div style={{
        background: T.cream,
        borderTop: `1px solid ${T.border}`,
        padding: "24px 40px",
        textAlign: "center",
      }}>
        <p style={{
          fontFamily: T.sans, fontSize: 12.5, color: T.muted,
          lineHeight: 1.7, maxWidth: 700, margin: "0 auto",
        }}>
          Les analyses sont basées sur les données publiques disponibles (MRNF, MSP, MELCCFP, StatCan, municipalités)
          et ne constituent pas un avis professionnel. Vérifiez les informations auprès des sources primaires.
        </p>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer style={{
        background: T.navyDeep,
        borderTop: `1px solid rgba(196,154,40,.12)`,
        padding: "32px 40px",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{
              fontFamily: T.display, fontSize: 15, fontWeight: 400,
              color: T.goldLt, letterSpacing: 2, textTransform: "uppercase",
            }}>SCANIMMO</span>
            <span style={{ fontFamily: T.mono, fontSize: 10.5, color: "rgba(255,255,255,.2)" }}>
              {"\u00a9"} {new Date().getFullYear()} Innovations Scanimmo Inc.
            </span>
          </div>
          <span style={{ fontFamily: T.mono, fontSize: 10, color: "rgba(255,255,255,.15)" }}>
            v4.1 {"\u00b7"} Quebec, Canada
          </span>
        </div>
      </footer>
    </div>
  );
}
