/**
 * Landing Page (/) — Charte graphique Rapport v12
 * @description Homepage Scanimmo — fidèle au design system navy/or/crème
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════════
   DESIGN SYSTEM — hérité du Rapport v12
   Palette : navy . or . crème . sémantiques
   Fonts   : DM Serif Display . IBM Plex Sans . DM Mono
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


/* ── Statistiques d'en-tête ──────────────────────────────────────── */
const STATS = [
  { value: "3,7 M+", label: "Propriétés analysées" },
  { value: "1 187",  label: "Municipalités couvertes" },
  { value: "12",     label: "Sources de données" },
  { value: "10 s",   label: "Rapport généré en" },
];

/* ── Sources de données ──────────────────────────────────────────── */
const SOURCES: { nom: string; org: string; citation?: string; url?: string }[] = [
  {
    nom: "R\u00f4le d\u2019\u00e9valuation fonci\u00e8re",
    org: "MAMH",
    citation: "MINIST\u00c8RE DES AFFAIRES MUNICIPALES ET DE L\u2019HABITATION. \u00ab R\u00f4les d\u2019\u00e9valuation fonci\u00e8re du Qu\u00e9bec \u00bb, [Jeu de donn\u00e9es], dans Donn\u00e9es Qu\u00e9bec, 2025.",
    url: "https://www.donneesquebec.ca/recherche/dataset/roles-d-evaluation-fonciere-du-quebec",
  },
  {
    nom: "Zonage municipal",
    org: "Municipalit\u00e9s du Qu\u00e9bec",
    citation: "MUNICIPALIT\u00c9S DU QU\u00c9BEC. \u00ab Zonage municipal \u2014 Zones \u00bb, [Jeux de donn\u00e9es], dans Donn\u00e9es Qu\u00e9bec, 2024.",
    url: "https://www.donneesquebec.ca/recherche/dataset/?tags=Urbanisme",
  },
  {
    nom: "Cadastre du Qu\u00e9bec",
    org: "MRNF",
    citation: "MINIST\u00c8RE DES RESSOURCES NATURELLES ET DES FOR\u00caTS. \u00ab Cadastre du Qu\u00e9bec \u00bb, [Service en ligne], Gouvernement du Qu\u00e9bec.",
    url: "https://appli.foncier.gouv.qc.ca/infolot/",
  },
  {
    nom: "LiDAR a\u00e9roport\u00e9 (topographie)",
    org: "MRNF",
    citation: "MINIST\u00c8RE DES RESSOURCES NATURELLES ET DES FOR\u00caTS. \u00ab Donn\u00e9es LiDAR du Qu\u00e9bec \u00bb, [Jeu de donn\u00e9es], dans Donn\u00e9es Qu\u00e9bec, 2021.",
    url: "https://www.donneesquebec.ca/recherche/dataset/donnees-lidar-du-quebec",
  },
  {
    nom: "Zones inondables",
    org: "MELCCFP",
    citation: "MINIST\u00c8RE DE L\u2019ENVIRONNEMENT, DE LA LUTTE CONTRE LES CHANGEMENTS CLIMATIQUES, DE LA FAUNE ET DES PARCS. \u00ab Base de donn\u00e9es des zones \u00e0 risque d\u2019inondation (BDZI) \u00bb, [Jeu de donn\u00e9es], dans Donn\u00e9es Qu\u00e9bec.",
    url: "https://www.donneesquebec.ca/recherche/dataset/base-de-donnees-des-zones-inondables",
  },
  {
    nom: "Sites contamin\u00e9s (GTC)",
    org: "MELCCFP",
    citation: "MINIST\u00c8RE DE L\u2019ENVIRONNEMENT, DE LA LUTTE CONTRE LES CHANGEMENTS CLIMATIQUES, DE LA FAUNE ET DES PARCS. \u00ab R\u00e9pertoire des terrains contamin\u00e9s \u00bb, [Jeu de donn\u00e9es], dans Donn\u00e9es Qu\u00e9bec.",
    url: "https://www.donneesquebec.ca/recherche/dataset/repertoire-des-terrains-contamines-gtc",
  },
  {
    nom: "Milieux humides",
    org: "CIC / MELCCFP",
    citation: "CANARDS ILLIMIT\u00c9S CANADA et MELCCFP. \u00ab Milieux humides \u2014 Cartographie d\u00e9taill\u00e9e \u00bb, [Jeu de donn\u00e9es], dans Donn\u00e9es Qu\u00e9bec, 2009.",
    url: "https://www.donneesquebec.ca/recherche/dataset/milieux-humides-du-quebec",
  },
  {
    nom: "Permis de construction",
    org: "Donn\u00e9es ouvertes municipales",
    citation: "VILLE DE MONTR\u00c9AL / VILLE DE QU\u00c9BEC. \u00ab Permis de construction, transformation et d\u00e9molition \u00bb, [Jeux de donn\u00e9es], dans Donn\u00e9es ouvertes municipales.",
    url: "https://donnees.montreal.ca/ville-de-montreal/permis-construction",
  },
  {
    nom: "Proximit\u00e9 et services",
    org: "Statistique Canada",
  },
  {
    nom: "Recensement 2021",
    org: "Statistique Canada",
  },
  {
    nom: "D\u00e9favorisation 2021",
    org: "INSPQ",
    citation: "INSTITUT NATIONAL DE SANT\u00c9 PUBLIQUE DU QU\u00c9BEC. \u00ab Indice de d\u00e9favorisation du Qu\u00e9bec 2021 \u00bb, [Jeu de donn\u00e9es], dans Donn\u00e9es Qu\u00e9bec, 2023.",
    url: "https://www.donneesquebec.ca/recherche/dataset/indice-de-defavorisation-du-quebec-2021",
  },
  {
    nom: "Plan d\u2019urbanisme m\u00e9tropolitain",
    org: "CMM / Ville de Montr\u00e9al",
    citation: "VILLE DE MONTR\u00c9AL. \u00ab Plan d\u2019urbanisme et de mobilit\u00e9 2050 \u00bb, [Document de planification], 2025.",
    url: "https://montreal.ca/articles/plan-durbanisme-et-de-mobilite-2050-72130",
  },
];

/* ── Types ───────────────────────────────────────────────────────── */
type Suggestion = {
  property_id: string;
  adresse: string;
  nom_municipalite: string;
  latitude: number | null;
  longitude: number | null;
};

/* ─── Debounce hook ──────────────────────────────────────────────── */
function useDebounce(value: string, delay: number) {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

/* ─── Composant : barre de recherche principale ─────────────────── */
function SearchEngine({ onSearch }: { onSearch: (p: { mode: string; value: string | { lat: string; lng: string } }) => void }) {
  const [mode, setMode]       = useState("adresse");
  const [query, setQuery]     = useState("");
  const [matricule, setMat]   = useState("");
  const [lat, setLat]         = useState("");
  const [lng, setLng]         = useState("");
  const [suggestions, setSug] = useState<Suggestion[]>([]);
  const [focused, setFocused] = useState(false);
  const [selIdx, setSelIdx]   = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 200);

  /* Autocompletion Supabase RPC */
  useEffect(() => {
    if (mode !== "adresse" || debouncedQuery.trim().length < 2) { setSug([]); return; }
    let cancelled = false;
    supabase
      .rpc("search_properties_autocomplete", { q: debouncedQuery.trim(), limit_n: 6 })
      .then(({ data: rows, error: err }) => {
        if (cancelled) return;
        if (err) { setSug([]); return; }
        setSug(Array.isArray(rows) ? (rows as Suggestion[]) : []);
        setSelIdx(-1);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery, mode]);

  const navigateToProperty = async (searchQuery: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { onSearch({ mode, value: searchQuery }); setLoading(false); return; }
      const mat = data.results ? data.results[0].matricule : data.matricule;
      router.push(`/preview/${mat}`);
    } catch {
      onSearch({ mode, value: searchQuery });
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelIdx(i => Math.min(i+1, suggestions.length-1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelIdx(i => Math.max(i-1, -1)); }
    if (e.key === "Enter")     { if (selIdx >= 0) selectSug(suggestions[selIdx]); else submit(); }
    if (e.key === "Escape")    { setSug([]); setFocused(false); }
  };

  const selectSug = (s: Suggestion) => {
    setQuery(s.adresse);
    setSug([]);
    setFocused(false);
    navigateToProperty(s.adresse);
  };

  const submit = () => {
    if (mode === "adresse" && query.trim())    navigateToProperty(query);
    if (mode === "matricule" && matricule.length === 18) navigateToProperty(matricule);
    if (mode === "gps" && lat && lng)          onSearch({ mode, value: { lat, lng } });
  };

  const MODES = [
    { id: "adresse",    label: "Adresse" },
    { id: "matricule",  label: "Matricule" },
    { id: "gps",        label: "GPS" },
  ];

  return (
    <div style={{ width: "100%", maxWidth: 720, margin: "0 auto" }}>

      {/* Mode tabs */}
      <div style={{
        display: "flex", gap: 0, marginBottom: 0,
        background: "rgba(255,255,255,.06)",
        borderRadius: "14px 14px 0 0",
        border: "1px solid rgba(255,255,255,.10)",
        borderBottom: "none",
        overflow: "hidden",
      }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setSug([]); }}
            style={{
              flex: 1, border: "none", cursor: "pointer",
              padding: "11px 16px",
              fontFamily: T.mono, fontSize: 11.5, fontWeight: 600,
              letterSpacing: 1.2, textTransform: "uppercase",
              transition: "all .18s",
              background: mode === m.id ? "rgba(196,154,40,.18)" : "transparent",
              color: mode === m.id ? T.goldLt : "rgba(255,255,255,.38)",
              borderBottom: mode === m.id ? `2px solid ${T.gold}` : "2px solid transparent",
            }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Input zone */}
      <div style={{
        background: "rgba(255,255,255,.97)",
        borderRadius: "0 0 14px 14px",
        border: "1px solid rgba(255,255,255,.15)",
        borderTop: "none",
        boxShadow: focused
          ? `0 0 0 3px ${T.gold}55, 0 24px 56px rgba(0,0,0,.35)`
          : "0 16px 48px rgba(0,0,0,.28)",
        transition: "box-shadow .2s",
        position: "relative",
      }}>

        {/* ADRESSE */}
        {mode === "adresse" && (
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{
                padding: "0 0 0 20px",
                fontFamily: T.mono, fontSize: 17, color: T.muted, flexShrink: 0,
              }}>{"\u2315"}</span>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 180)}
                onKeyDown={handleKey}
                placeholder="Saisissez l'adresse ici !"
                style={{
                  width: "100%", border: "none", outline: "none",
                  padding: "20px 16px 20px 12px",
                  fontFamily: T.sans, fontSize: 16.5, color: T.ink,
                  background: "transparent",
                }}
              />
              <button onClick={submit} disabled={loading} style={{
                margin: "8px 10px 8px 0",
                padding: "11px 26px",
                background: loading ? T.border : T.navy, border: "none", cursor: loading ? "default" : "pointer",
                borderRadius: 10, flexShrink: 0,
                fontFamily: T.sans, fontSize: 13, fontWeight: 600,
                color: loading ? T.muted : T.goldLt, letterSpacing: .3,
                transition: "background .15s, transform .1s",
              }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = T.navyLt; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = T.navy; }}
                onMouseDown={e => e.currentTarget.style.transform = "scale(.97)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
              >
                {loading ? "..." : "Analyser \u2192"}
              </button>
            </div>

            {/* Suggestions progressives */}
            {focused && suggestions.length > 0 && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                background: T.white,
                border: `1px solid ${T.border}`,
                borderTop: "none",
                borderRadius: "0 0 14px 14px",
                boxShadow: "0 20px 48px rgba(0,0,0,.18)",
                overflow: "hidden",
              }}>
                {suggestions.map((s, i) => (
                  <div key={s.property_id}
                    onMouseDown={() => selectSug(s)}
                    style={{
                      padding: "13px 20px",
                      cursor: "pointer",
                      background: i === selIdx ? T.subtle : T.white,
                      borderBottom: i < suggestions.length - 1 ? `1px solid ${T.border}` : "none",
                      display: "flex", alignItems: "center", gap: 12,
                      transition: "background .1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = T.subtle}
                    onMouseLeave={e => e.currentTarget.style.background = i === selIdx ? T.subtle : T.white}
                  >
                    <span style={{ fontSize: 14, color: T.muted, flexShrink: 0 }}>{"\u25CE"}</span>
                    <div>
                      <HighlightMatch text={s.adresse} query={query}/>
                      <div style={{
                        fontFamily: T.mono, fontSize: 10.5, color: T.muted,
                        marginTop: 2,
                      }}>
                        Mun. {s.nom_municipalite}
                        {s.latitude && s.longitude && ` \u00b7 ${s.latitude.toFixed(4)}\u00b0N, ${Math.abs(s.longitude!).toFixed(4)}\u00b0O`}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{
                  padding: "8px 20px",
                  background: T.subtle,
                  fontFamily: T.mono, fontSize: 10, color: T.muted,
                  letterSpacing: .5,
                }}>
                  {suggestions.length} résultat{suggestions.length > 1 ? "s" : ""} — données BDIMF + Rôle foncier
                </div>
              </div>
            )}
          </div>
        )}

        {/* MATRICULE */}
        {mode === "matricule" && (
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ padding: "0 0 0 20px", fontFamily: T.mono, fontSize: 15, color: T.muted, flexShrink: 0 }}>
              {"\u25C8"}
            </span>
            <input
              value={matricule}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 18);
                setMat(v);
              }}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="Saisissez le matricule ici !"
              style={{
                width: "100%", border: "none", outline: "none",
                padding: "20px 16px 20px 12px",
                fontFamily: T.mono, fontSize: 16, color: T.ink,
                background: "transparent", letterSpacing: 1.5,
              }}
            />
            <span style={{
              fontFamily: T.mono, fontSize: 10.5, color: T.muted,
              flexShrink: 0, marginRight: 12, opacity: .6,
            }}>
              {matricule.length}/18
            </span>
            <button onClick={submit} disabled={loading} style={{
              margin: "8px 10px 8px 0", padding: "11px 26px",
              background: matricule.length === 18 && !loading ? T.navy : T.border,
              border: "none", cursor: matricule.length === 18 && !loading ? "pointer" : "default",
              borderRadius: 10, flexShrink: 0,
              fontFamily: T.sans, fontSize: 13, fontWeight: 600,
              color: matricule.length === 18 ? T.goldLt : T.muted,
              transition: "all .15s",
            }}>
              {loading ? "..." : "Analyser \u2192"}
            </button>
          </div>
        )}

        {/* GPS */}
        {mode === "gps" && (
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <span style={{ padding: "0 0 0 20px", fontFamily: T.mono, fontSize: 15, color: T.muted, flexShrink: 0 }}>
              {"\u25C9"}
            </span>
            <input
              value={lat} onChange={e => setLat(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="00.000"
              style={{
                flex: 1, border: "none", outline: "none",
                padding: "20px 8px 20px 12px",
                fontFamily: T.mono, fontSize: 14.5, color: T.ink,
                background: "transparent",
              }}
            />
            <span style={{ color: T.border, fontSize: 20, flexShrink: 0 }}>|</span>
            <input
              value={lng} onChange={e => setLng(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="00.000"
              style={{
                flex: 1, border: "none", outline: "none",
                padding: "20px 8px 20px 12px",
                fontFamily: T.mono, fontSize: 14.5, color: T.ink,
                background: "transparent",
              }}
            />
            <button onClick={submit} style={{
              margin: "8px 10px 8px 0", padding: "11px 26px",
              background: lat && lng ? T.navy : T.border,
              border: "none", cursor: lat && lng ? "pointer" : "default",
              borderRadius: 10, flexShrink: 0,
              fontFamily: T.sans, fontSize: 13, fontWeight: 600,
              color: lat && lng ? T.goldLt : T.muted,
              transition: "all .15s",
            }}>
              Analyser {"\u2192"}
            </button>
          </div>
        )}
      </div>

      {/* Hint sous la barre */}
      <div style={{
        marginTop: 12, textAlign: "center",
        fontFamily: T.mono, fontSize: 10.5,
        color: "rgba(255,255,255,.28)", lineHeight: 1.8,
      }}>
        {mode === "adresse" && "Québec \u00b7 Montréal \u00b7 Laval... : 1 187 municipalités"}
        {mode === "matricule" && "18 chiffres — source : Rôle d'évaluation foncière municipal"}
        {mode === "gps" && "Coordonnées décimales WGS84 — ex : 46.7737, -71.2975"}
      </div>
    </div>
  );
}

/* Highlight du texte matchant dans les suggestions */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) {
    return <span style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink }}>{text}</span>;
  }
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) {
    return <span style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink }}>{text}</span>;
  }
  return (
    <span style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink }}>
      {text.slice(0, idx)}
      <mark style={{
        background: T.gold + "38", color: T.ink,
        borderRadius: 3, padding: "0 2px",
      }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

/* ─── Composant : Modal générique ───────────────────────────────── */
function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(9,30,52,.72)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
        animation: "fadeIn .2s ease",
      }}>
      <div style={{
        background: T.white, borderRadius: 20,
        width: "100%", maxWidth: 660,
        maxHeight: "85vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 40px 120px rgba(0,0,0,.4)",
        border: `1px solid ${T.border}`,
        animation: "slideUp .25s ease",
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 32px 20px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: T.navy,
        }}>
          <span style={{
            fontFamily: T.display, fontSize: 20, fontWeight: 400,
            color: T.goldLt, letterSpacing: -.3,
          }}>{title}</span>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.12)",
            color: "rgba(255,255,255,.5)",
            cursor: "pointer", borderRadius: 8,
            width: 32, height: 32,
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.15)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.08)"; e.currentTarget.style.color = "rgba(255,255,255,.5)"; }}
          >{"\u2715"}</button>
        </div>
        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}

/* ─── Modal CGU ──────────────────────────────────────────────────── */
function CGUModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const CGU_SECTIONS = [
    { t: "1. Acceptation des Conditions", b: "En acc\u00e9dant au site Web, \u00e0 la plateforme ou \u00e0 tout rapport, r\u00e9sultat, carte, fiche, interface, export ou contenu fourni sous la banni\u00e8re Scanimmo (collectivement, le \u00ab\u00a0Service\u00a0\u00bb), l\u2019utilisateur reconna\u00eet avoir pris connaissance des pr\u00e9sentes Conditions g\u00e9n\u00e9rales d\u2019utilisation (les \u00ab\u00a0Conditions\u00a0\u00bb) et accepte d\u2019y \u00eatre li\u00e9.\n\nSi l\u2019utilisateur n\u2019accepte pas les pr\u00e9sentes Conditions, il doit cesser imm\u00e9diatement d\u2019utiliser le Service.\n\nL\u2019utilisation du Service constitue une utilisation dans un cadre d\u2019affaires, de veille, d\u2019analyse pr\u00e9liminaire, d\u2019\u00e9valuation immobili\u00e8re ou de rep\u00e9rage foncier. Le Service est destin\u00e9 en priorit\u00e9 aux promoteurs, investisseurs, cabinets d\u2019architecture, firmes d\u2019urbanisme, professionnels de l\u2019immobilier et autres utilisateurs agissant dans un contexte professionnel ou pr\u00e9professionnel." },
    { t: "2. Objet du Service", b: "Scanimmo est une plateforme informationnelle et technologique d\u2019aide au rep\u00e9rage pr\u00e9liminaire de contraintes, risques, caract\u00e9ristiques et opportunit\u00e9s relatives \u00e0 un terrain, un immeuble ou un secteur donn\u00e9.\n\nLe Service peut notamment agr\u00e9ger, croiser, normaliser, visualiser, estimer, scorer, interpoler ou synth\u00e9tiser certaines informations issues de sources publiques, parapubliques, municipales, gouvernementales ou tierces, y compris, sans s\u2019y limiter, des donn\u00e9es relatives au zonage, \u00e0 la topographie, \u00e0 la pente, au LiDAR, aux zones inondables, \u00e0 la contamination, au contexte cadastral, aux services de proximit\u00e9, aux r\u00e9seaux, \u00e0 l\u2019occupation du sol ou \u00e0 d\u2019autres couches territoriales.\n\nLe Service est fourni \u00e0 des fins d\u2019information g\u00e9n\u00e9rale et de pr\u00e9s\u00e9lection uniquement." },
    { t: "3. Aucune opinion professionnelle", b: "Scanimmo n\u2019exerce pas, par l\u2019entremise du Service, une activit\u00e9 r\u00e9serv\u00e9e \u00e0 un urbaniste, un ing\u00e9nieur, un arpenteur-g\u00e9om\u00e8tre, un \u00e9valuateur agr\u00e9\u00e9, un courtier immobilier, un architecte, un notaire, un avocat ou tout autre professionnel r\u00e9gi par un ordre professionnel.\n\nLe Service, ses rapports et ses r\u00e9sultats\u00a0:\n\na) ne constituent pas un avis juridique, un avis d\u2019urbanisme, un avis d\u2019ing\u00e9nierie, un certificat, une attestation, une expertise, un lev\u00e9, une opinion professionnelle ou un acte r\u00e9serv\u00e9\u00a0;\nb) ne constituent pas une confirmation de conformit\u00e9 r\u00e9glementaire\u00a0;\nc) ne constituent pas une garantie de constructibilit\u00e9, de faisabilit\u00e9, de valeur, de potentiel de d\u00e9veloppement, de densit\u00e9 autorisable, d\u2019obtention de permis, de financement ou d\u2019assurabilit\u00e9\u00a0;\nd) ne remplacent jamais la validation aupr\u00e8s des sources officielles et des professionnels comp\u00e9tents.\n\nL\u2019utilisateur demeure seul responsable d\u2019obtenir toute validation, v\u00e9rification, confirmation, autorisation, mesure, analyse ou opinion professionnelle n\u00e9cessaire avant de prendre une d\u00e9cision d\u2019acquisition, d\u2019investissement, de conception, de financement, de d\u00e9p\u00f4t r\u00e9glementaire, de n\u00e9gociation ou de d\u00e9veloppement." },
    { t: "4. Sources, traitements automatis\u00e9s et limites m\u00e9thodologiques", b: "Le Service repose en tout ou en partie sur des sources externes, incluant des sources publiques ou institutionnelles, ainsi que sur des traitements automatis\u00e9s, g\u00e9ospatiaux, algorithmiques, statistiques ou heuristiques.\n\nEn cons\u00e9quence, l\u2019utilisateur reconna\u00eet et accepte express\u00e9ment que\u00a0:\n\na) certaines donn\u00e9es peuvent \u00eatre incompl\u00e8tes, impr\u00e9cises, p\u00e9rim\u00e9es, contradictoires, mal g\u00e9or\u00e9f\u00e9renc\u00e9es, indisponibles ou retir\u00e9es sans pr\u00e9avis\u00a0;\nb) certaines couches ou sorties peuvent r\u00e9sulter d\u2019une approximation, d\u2019une interpolation, d\u2019un recoupement automatis\u00e9, d\u2019une inf\u00e9rence ou d\u2019un traitement d\u00e9riv\u00e9\u00a0;\nc) certaines informations r\u00e9glementaires, cadastrales, environnementales, hydrologiques, topographiques ou municipales peuvent avoir \u00e9t\u00e9 modifi\u00e9es sans que ces changements ne soient encore int\u00e9gr\u00e9s au Service\u00a0;\nd) une source officielle elle-m\u00eame peut comporter des erreurs, des d\u00e9lais de publication, des r\u00e9visions ou des changements de format\u00a0;\ne) l\u2019affichage d\u2019une information par le Service ne constitue pas une confirmation de son opposabilit\u00e9 juridique, de son applicabilit\u00e9 \u00e0 un projet donn\u00e9 ni de sa suffisance pour fonder une d\u00e9cision." },
    { t: "5. Aucune garantie", b: "Le Service est fourni tel quel, selon disponibilit\u00e9 et sans garantie, dans toute la mesure permise par la loi applicable.\n\nSans limiter la g\u00e9n\u00e9ralit\u00e9 de ce qui pr\u00e9c\u00e8de, Scanimmo ne donne aucune garantie, repr\u00e9sentation ou condition expresse ou implicite relativement\u00a0:\n\na) \u00e0 l\u2019exactitude, l\u2019exhaustivit\u00e9, la fiabilit\u00e9, la pr\u00e9cision, la pertinence, la qualit\u00e9 ou l\u2019actualit\u00e9 des donn\u00e9es\u00a0;\nb) \u00e0 la disponibilit\u00e9 continue, \u00e0 l\u2019absence d\u2019interruption, \u00e0 l\u2019absence d\u2019erreur, \u00e0 la compatibilit\u00e9 ou \u00e0 la s\u00e9curit\u00e9 du Service\u00a0;\nc) \u00e0 l\u2019ad\u00e9quation du Service \u00e0 un besoin particulier, \u00e0 un projet particulier ou \u00e0 une strat\u00e9gie d\u2019affaires particuli\u00e8re\u00a0;\nd) \u00e0 l\u2019obtention d\u2019un r\u00e9sultat \u00e9conomique, financier, r\u00e9glementaire, technique ou administratif donn\u00e9\u00a0;\ne) \u00e0 l\u2019absence d\u2019atteinte aux droits de tiers en lien avec les donn\u00e9es tierces ou publiques int\u00e9gr\u00e9es au Service." },
    { t: "6. Usage permis et usage interdit", b: "Sous r\u00e9serve des pr\u00e9sentes Conditions, Scanimmo accorde \u00e0 l\u2019utilisateur une licence limit\u00e9e, personnelle, non exclusive, non transf\u00e9rable, non cessible et r\u00e9vocable d\u2019acc\u00e9der au Service et de l\u2019utiliser pour ses besoins internes d\u2019analyse pr\u00e9liminaire.\n\nIl est notamment interdit \u00e0 l\u2019utilisateur, sans autorisation \u00e9crite pr\u00e9alable de Scanimmo\u00a0:\n\na) de copier, republier, rediffuser, commercialiser, revendre, conc\u00e9der en sous-licence ou mettre \u00e0 disposition de tiers le Service ou une partie substantielle de celui-ci\u00a0;\nb) d\u2019effectuer du scraping, de l\u2019extraction automatis\u00e9e, de l\u2019aspiration de donn\u00e9es, du crawling, du harvesting ou toute collecte massive ou syst\u00e9matique\u00a0;\nc) de contourner les m\u00e9canismes techniques de protection, de limitation ou de tra\u00e7abilit\u00e9\u00a0;\nd) d\u2019utiliser le Service pour d\u00e9velopper, entra\u00eener, alimenter ou am\u00e9liorer un produit concurrent\u00a0;\ne) de pr\u00e9senter les r\u00e9sultats du Service comme un avis officiel, un avis professionnel, une certification ou une confirmation d\u00e9finitive\u00a0;\nf) de surcharger, perturber, compromettre ou tester de mani\u00e8re intrusive la s\u00e9curit\u00e9 ou la capacit\u00e9 du Service." },
    { t: "7. D\u00e9cisions de l\u2019utilisateur", b: "L\u2019utilisateur reconna\u00eet que toute d\u00e9cision prise \u00e0 la suite de l\u2019utilisation du Service, y compris toute d\u00e9cision d\u2019acquisition, d\u2019offre, d\u2019investissement, de financement, de n\u00e9gociation, de planification, de conception, de d\u00e9p\u00f4t r\u00e9glementaire, de montage de projet ou de d\u00e9veloppement, est prise \u00e0 ses seuls risques.\n\nLe Service ne doit pas \u00eatre utilis\u00e9 comme unique fondement d\u2019une d\u00e9cision. L\u2019utilisateur doit proc\u00e9der \u00e0 ses propres v\u00e9rifications diligentes aupr\u00e8s des autorit\u00e9s comp\u00e9tentes, des registres applicables, des sources primaires et des professionnels qualifi\u00e9s." },
    { t: "8. Limitation de responsabilit\u00e9", b: "Dans toute la mesure permise par la loi applicable, Scanimmo, ses dirigeants, administrateurs, employ\u00e9s, mandataires, fournisseurs, partenaires technologiques, conc\u00e9dants et ayants droit ne pourront \u00eatre tenus responsables de tout dommage, perte, co\u00fbt ou pr\u00e9judice d\u00e9coulant de ou li\u00e9 \u00e0\u00a0:\n\na) l\u2019utilisation ou l\u2019impossibilit\u00e9 d\u2019utiliser le Service\u00a0;\nb) une erreur, omission, impr\u00e9cision, indisponibilit\u00e9, interruption, latence, anomalie, d\u00e9faut d\u2019actualisation ou retrait d\u2019une donn\u00e9e, carte, couche ou source\u00a0;\nc) toute d\u00e9cision prise, report\u00e9e, modifi\u00e9e ou abandonn\u00e9e sur la foi du Service\u00a0;\nd) tout refus de permis, refus de financement, refus d\u2019assurance, \u00e9chec de transaction, surco\u00fbt, perte d\u2019occasion, perte de profit, perte de revenus, perte d\u2019\u00e9conomies anticip\u00e9es, perte de donn\u00e9es, perte de r\u00e9putation ou retard de projet\u00a0;\ne) tout acte ou omission d\u2019une source tierce, d\u2019une autorit\u00e9 publique ou d\u2019un fournisseur externe.\n\nSous r\u00e9serve des r\u00e8gles d\u2019ordre public applicables, la responsabilit\u00e9 totale cumulative de Scanimmo relativement \u00e0 toute r\u00e9clamation, quelle qu\u2019en soit la cause d\u2019action, est limit\u00e9e au montant le plus faible entre\u00a0: cent dollars canadiens (100\u00a0$\u00a0CA)\u00a0; et le montant effectivement pay\u00e9 par l\u2019utilisateur \u00e0 Scanimmo pour l\u2019utilisation du Service au cours des douze (12) mois pr\u00e9c\u00e9dant imm\u00e9diatement l\u2019\u00e9v\u00e9nement g\u00e9n\u00e9rateur de responsabilit\u00e9.\n\nComme le Service est offert gratuitement, ce montant sera normalement de 0\u00a0$\u00a0CA, sauf preuve d\u2019un paiement applicable.\n\nLa pr\u00e9sente clause n\u2019a pas pour effet d\u2019exclure ni de limiter une responsabilit\u00e9 que la loi interdit d\u2019exclure ou de limiter. En particulier, rien dans les pr\u00e9sentes Conditions n\u2019a pour effet d\u2019exclure ou de limiter la responsabilit\u00e9 de Scanimmo pour un pr\u00e9judice dont l\u2019exclusion ou la limitation serait interdite par l\u2019article 1474 du Code civil du Qu\u00e9bec." },
    { t: "9. Avertissement sur les clauses de limitation", b: "L\u2019utilisateur reconna\u00eet que\u00a0:\n\na) le Service est offert sans frais\u00a0;\nb) Scanimmo ne fournit pas, par le Service, un service professionnel ni une garantie de r\u00e9sultat\u00a0;\nc) les exclusions et limitations pr\u00e9vues aux pr\u00e9sentes sont essentielles \u00e0 l\u2019\u00e9conomie des pr\u00e9sentes Conditions et au maintien de l\u2019offre gratuite du Service." },
    { t: "10. Propri\u00e9t\u00e9 intellectuelle", b: "Sous r\u00e9serve des droits des tiers sur certaines donn\u00e9es publiques ou sous licence, tous les droits, titres et int\u00e9r\u00eats relatifs au Service, \u00e0 sa structure, son assemblage, sa s\u00e9lection de contenus, son interface, ses rapports, ses mod\u00e8les, ses enrichissements, ses algorithmes, ses m\u00e9thodes de traitement, ses visualisations, ses textes, son image de marque et ses \u00e9l\u00e9ments distinctifs appartiennent \u00e0 Scanimmo ou \u00e0 ses conc\u00e9dants.\n\nAucun droit n\u2019est c\u00e9d\u00e9 \u00e0 l\u2019utilisateur autrement que la licence limit\u00e9e pr\u00e9vue aux pr\u00e9sentes." },
    { t: "11. Donn\u00e9es de tiers et liens externes", b: "Le Service peut r\u00e9f\u00e9rencer ou int\u00e9grer des donn\u00e9es, API, cartes, couches, documents, hyperliens ou contenus fournis par des tiers. Scanimmo n\u2019endosse pas ces tiers et n\u2019assume aucune responsabilit\u00e9 quant \u00e0 leur contenu, leur disponibilit\u00e9, leur exactitude, leurs politiques ou leurs pratiques." },
    { t: "12. Confidentialit\u00e9 et renseignements personnels", b: "L\u2019utilisation du Service peut entra\u00eener la collecte de certains renseignements personnels ou identifiants techniques, notamment lorsque l\u2019utilisateur soumet un formulaire, communique avec Scanimmo, t\u00e9l\u00e9verse un document, demande une d\u00e9monstration, accepte des t\u00e9moins, ou interagit avec certaines fonctions analytiques, de mesure d\u2019audience, de s\u00e9curit\u00e9 ou de journalisation.\n\nLe traitement de ces renseignements est r\u00e9gi par la Politique de confidentialit\u00e9 de Scanimmo, laquelle fait partie int\u00e9grante des pr\u00e9sentes par renvoi.\n\nLorsque requis par la loi, Scanimmo publie sa politique de confidentialit\u00e9 en termes simples et clairs, identifie la personne responsable de la protection des renseignements personnels et met en place des mesures de s\u00e9curit\u00e9 raisonnables compte tenu de la sensibilit\u00e9 des renseignements trait\u00e9s." },
    { t: "13. Modification, suspension et retrait du Service", b: "Scanimmo peut, en tout temps et sans pr\u00e9avis, modifier, suspendre, limiter, interrompre ou retirer tout ou partie du Service, d\u2019une fonctionnalit\u00e9, d\u2019une source de donn\u00e9es, d\u2019une m\u00e9thode de calcul, d\u2019un visuel, d\u2019un rapport, d\u2019un export ou d\u2019une couche informationnelle.\n\nScanimmo peut \u00e9galement modifier les pr\u00e9sentes Conditions. La version alors publi\u00e9e s\u2019appliquera \u00e0 compter de sa mise en ligne, sauf disposition imp\u00e9rative contraire." },
    { t: "14. Indemnisation", b: "L\u2019utilisateur s\u2019engage \u00e0 d\u00e9fendre, indemniser et tenir indemnes Scanimmo, ses dirigeants, administrateurs, employ\u00e9s, mandataires et fournisseurs \u00e0 l\u2019\u00e9gard de toute r\u00e9clamation, mise en demeure, demande, poursuite, perte, responsabilit\u00e9, co\u00fbt ou d\u00e9pense, y compris des frais juridiques raisonnables, d\u00e9coulant\u00a0:\n\na) d\u2019une utilisation du Service en contravention des pr\u00e9sentes Conditions\u00a0;\nb) de la redistribution, republication ou commercialisation non autoris\u00e9e des r\u00e9sultats\u00a0;\nc) de l\u2019utilisation du Service comme fondement unique d\u2019une affirmation officielle, d\u2019une repr\u00e9sentation commerciale, d\u2019une opinion professionnelle ou d\u2019une communication trompeuse \u00e0 un tiers\u00a0;\nd) de toute violation des droits d\u2019un tiers caus\u00e9e par l\u2019utilisateur." },
    { t: "15. Droit applicable et juridiction", b: "Les pr\u00e9sentes Conditions sont r\u00e9gies par les lois en vigueur dans la province de Qu\u00e9bec et les lois f\u00e9d\u00e9rales du Canada qui y sont applicables.\n\nSous r\u00e9serve de toute r\u00e8gle d\u2019ordre public applicable, tout diff\u00e9rend relatif aux pr\u00e9sentes Conditions ou au Service sera soumis \u00e0 la comp\u00e9tence exclusive des tribunaux du district judiciaire de Qu\u00e9bec, province de Qu\u00e9bec." },
    { t: "16. Divisibilit\u00e9", b: "Si une disposition des pr\u00e9sentes Conditions est d\u00e9clar\u00e9e nulle, invalide, inopposable ou inex\u00e9cutoire, cette disposition sera r\u00e9put\u00e9e dissociable et n\u2019affectera pas la validit\u00e9 des autres dispositions, lesquelles demeureront en vigueur dans toute la mesure permise par la loi.\n\nCette logique est coh\u00e9rente avec le Code civil, qui pr\u00e9voit qu\u2019une clause nulle n\u2019invalide pas le reste du contrat, sauf indivisibilit\u00e9." },
    { t: "17. Int\u00e9gralit\u00e9", b: "Les pr\u00e9sentes Conditions, avec l\u2019Avertissement m\u00e9thodologique et la Politique de confidentialit\u00e9 de Scanimmo, constituent l\u2019entente compl\u00e8te entre l\u2019utilisateur et Scanimmo quant \u00e0 l\u2019utilisation du Service et remplacent toute communication ant\u00e9rieure portant sur le m\u00eame objet." },
    { t: "18. Version fran\u00e7aise", b: "La version fran\u00e7aise des pr\u00e9sentes Conditions pr\u00e9vaut sur toute version traduite." },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Conditions générales d'utilisation — Scanimmo">
      <div style={{ padding: "32px 36px", fontFamily: T.sans }}>
        {CGU_SECTIONS.map(({ t, b }, i) => (
          <div key={i} style={{ marginBottom: 28 }}>
            <div style={{
              fontFamily: T.sans, fontSize: 14, fontWeight: 600,
              color: T.navy, marginBottom: 10,
            }}>{t}</div>
            <div style={{
              fontFamily: T.sans, fontSize: 13.5, color: T.inkSoft,
              lineHeight: 1.8, whiteSpace: "pre-line",
            }}>{b}</div>
          </div>
        ))}
        <div style={{
          marginTop: 32, padding: "16px 20px",
          background: T.subtle, borderRadius: 10,
          border: `1px solid ${T.border}`,
          fontFamily: T.mono, fontSize: 11, color: T.muted,
        }}>
          Version 2.0.0 {"\u00b7"} En vigueur depuis le 6 mars 2026 {"\u00b7"} Innovations Scanimmo Inc.<br/>
          Si\u00e8ge social : Qu\u00e9bec (Qu\u00e9bec) Canada {"\u00b7"} Contact via le formulaire du site
        </div>
      </div>
    </Modal>
  );
}

/* ─── Modal Avertissement ────────────────────────────────────────── */
function AvertissementModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const AVERT_SECTIONS = [
    { t: "1. Usage strictement pr\u00e9liminaire", b: "Le rapport Scanimmo est fourni \u00e0 titre indicatif uniquement. Il sert \u00e0 soutenir une premi\u00e8re analyse et ne doit pas \u00eatre utilis\u00e9 comme seule base pour prendre une d\u00e9cision d\u2019achat, d\u2019investissement, de financement, de conception, de d\u00e9p\u00f4t r\u00e9glementaire, de construction ou de d\u00e9veloppement." },
    { t: "2. Aucun avis professionnel", b: "Le rapport Scanimmo ne constitue pas\u00a0:\n\n\u2022 un avis juridique\u00a0;\n\u2022 un avis d\u2019urbanisme\u00a0;\n\u2022 un avis d\u2019ing\u00e9nierie\u00a0;\n\u2022 un certificat d\u2019arpentage\u00a0;\n\u2022 une expertise environnementale\u00a0;\n\u2022 une \u00e9valuation immobili\u00e8re\u00a0;\n\u2022 une confirmation officielle de conformit\u00e9\u00a0;\n\u2022 une garantie de faisabilit\u00e9, de constructibilit\u00e9 ou d\u2019obtention de permis.\n\nL\u2019utilisation du rapport ne cr\u00e9e aucune relation professionnelle de type client-conseil avec un avocat, urbaniste, ing\u00e9nieur, arpenteur-g\u00e9om\u00e8tre, architecte, \u00e9valuateur agr\u00e9\u00e9, notaire, courtier immobilier ou autre professionnel." },
    { t: "3. V\u00e9rification obligatoire aupr\u00e8s des sources officielles", b: "Avant toute d\u00e9cision ou tout engagement, l\u2019utilisateur doit faire ses propres v\u00e9rifications aupr\u00e8s des sources officielles et, au besoin, consulter les professionnels comp\u00e9tents.\n\nCela inclut notamment, selon le cas\u00a0:\n\n\u2022 la municipalit\u00e9 comp\u00e9tente et ses r\u00e8glements en vigueur\u00a0;\n\u2022 les cartes et documents r\u00e9glementaires officiels\u00a0;\n\u2022 les autorit\u00e9s environnementales concern\u00e9es\u00a0;\n\u2022 le registre foncier, le cadastre et les titres\u00a0;\n\u2022 les \u00e9tudes, expertises et relev\u00e9s techniques requis pour le projet.\n\nEn cas de divergence entre un rapport Scanimmo et une source officielle, la source officielle pr\u00e9vaut." },
    { t: "4. Donn\u00e9es issues de sources tierces et traitements automatis\u00e9s", b: "Les rapports Scanimmo sont g\u00e9n\u00e9r\u00e9s \u00e0 partir de donn\u00e9es provenant en tout ou en partie de sources publiques, institutionnelles, municipales, gouvernementales ou tierces, ainsi que de traitements automatis\u00e9s, g\u00e9ospatiaux, algorithmiques ou m\u00e9thodologiques internes.\n\nEn cons\u00e9quence, certaines informations peuvent\u00a0:\n\n\u2022 \u00eatre incompl\u00e8tes\u00a0;\n\u2022 \u00eatre inexactes\u00a0;\n\u2022 \u00eatre p\u00e9rim\u00e9es\u00a0;\n\u2022 comporter des erreurs ou omissions\u00a0;\n\u2022 avoir chang\u00e9 sans \u00eatre encore refl\u00e9t\u00e9es dans le rapport\u00a0;\n\u2022 d\u00e9pendre de m\u00e9thodes d\u2019interpr\u00e9tation, d\u2019approximation, d\u2019interpolation ou de croisement de donn\u00e9es.\n\nM\u00eame lorsqu\u2019une donn\u00e9e provient d\u2019une source officielle, Scanimmo ne garantit ni son exactitude absolue, ni son exhaustivit\u00e9, ni son actualit\u00e9. Les sources elles-m\u00eames peuvent \u00eatre r\u00e9vis\u00e9es, corrig\u00e9es ou mises \u00e0 jour apr\u00e8s la g\u00e9n\u00e9ration du rapport." },
    { t: "5. Limites sp\u00e9cifiques de certains contenus", b: "Zonage\nLes informations de zonage pr\u00e9sent\u00e9es dans le rapport sont fournies \u00e0 titre de rep\u00e9rage. Elles ne remplacent jamais l\u2019analyse compl\u00e8te du r\u00e8glement applicable, de ses grilles, usages, normes, exceptions, conditions particuli\u00e8res, PIIA, PPCMOI, usages conditionnels, d\u00e9rogations ou autres m\u00e9canismes municipaux.\n\nInondation et contraintes hydriques\nLes couches relatives aux zones inondables, milieux hydriques ou contraintes similaires peuvent \u00e9voluer et ne doivent pas \u00eatre interpr\u00e9t\u00e9es comme une confirmation d\u00e9finitive de constructibilit\u00e9, d\u2019assurabilit\u00e9 ou d\u2019autorisation.\n\nContamination\nToute indication li\u00e9e \u00e0 une contamination r\u00e9elle, potentielle ou historique est strictement informative. Elle ne remplace pas une \u00e9tude environnementale, un audit ou une expertise sp\u00e9cialis\u00e9e.\n\nLiDAR, pente et topographie\nLes donn\u00e9es LiDAR, de pente, d\u2019\u00e9l\u00e9vation ou de relief peuvent d\u00e9pendre de la r\u00e9solution des donn\u00e9es sources, de la date d\u2019acquisition, du traitement appliqu\u00e9 et des m\u00e9thodes de calcul. Elles ne remplacent pas un relev\u00e9 d\u2019arpentage, une \u00e9tude g\u00e9otechnique, un plan topographique ou une validation terrain.\n\nAcc\u00e8s aux services et contexte local\nLes informations sur les services, infrastructures, r\u00e9seaux ou commodit\u00e9s peuvent \u00eatre partielles, approximatives ou sujettes \u00e0 changement." },
    { t: "6. Aucune garantie", b: "Le rapport Scanimmo est fourni tel quel et selon disponibilit\u00e9, sans garantie expresse ou implicite quant \u00e0\u00a0:\n\n\u2022 l\u2019exactitude\u00a0;\n\u2022 l\u2019exhaustivit\u00e9\u00a0;\n\u2022 la fiabilit\u00e9\u00a0;\n\u2022 la pr\u00e9cision\u00a0;\n\u2022 l\u2019actualit\u00e9\u00a0;\n\u2022 la disponibilit\u00e9\u00a0;\n\u2022 l\u2019ad\u00e9quation \u00e0 un besoin particulier\u00a0;\n\u2022 l\u2019obtention d\u2019un r\u00e9sultat donn\u00e9." },
    { t: "7. Responsabilit\u00e9 de l\u2019utilisateur", b: "L\u2019utilisateur demeure seul responsable\u00a0:\n\n\u2022 de l\u2019usage qu\u2019il fait du rapport\u00a0;\n\u2022 de l\u2019interpr\u00e9tation des informations\u00a0;\n\u2022 de ses d\u00e9cisions d\u2019affaires, d\u2019investissement ou de d\u00e9veloppement\u00a0;\n\u2022 des validations compl\u00e9mentaires n\u00e9cessaires avant d\u2019agir.\n\nLe rapport Scanimmo ne doit jamais \u00eatre pr\u00e9sent\u00e9 \u00e0 un tiers comme une opinion officielle, un document de conformit\u00e9, un certificat ou une confirmation d\u00e9finitive d\u2019un droit, d\u2019un usage permis ou d\u2019une faisabilit\u00e9." },
    { t: "8. Limitation importante", b: "Les limites et exclusions de responsabilit\u00e9 pr\u00e9vues aux Conditions d\u2019utilisation de Scanimmo s\u2019appliquent \u00e0 tout rapport, sous r\u00e9serve des r\u00e8gles imp\u00e9ratives du droit applicable. En droit qu\u00e9b\u00e9cois, une personne ne peut pas exclure ou limiter sa responsabilit\u00e9 pour un pr\u00e9judice mat\u00e9riel caus\u00e9 par une faute intentionnelle ou une faute lourde, ni pour un pr\u00e9judice corporel ou moral." },
    { t: "9. Protection des renseignements personnels", b: "Si l\u2019utilisation du site ou du rapport implique la collecte de renseignements personnels par un moyen technologique, ceux-ci sont trait\u00e9s conform\u00e9ment \u00e0 la Politique de confidentialit\u00e9 de Scanimmo. En droit qu\u00e9b\u00e9cois, une entreprise qui recueille de tels renseignements doit publier une politique de confidentialit\u00e9 claire\u00a0; certaines fonctions d\u2019identification, de localisation ou de profilage doivent aussi \u00eatre signal\u00e9es \u00e0 l\u2019utilisateur." },
    { t: "10. Acceptation", b: "En consultant, t\u00e9l\u00e9chargeant, utilisant ou partageant un rapport Scanimmo, l\u2019utilisateur reconna\u00eet avoir lu le pr\u00e9sent avertissement, en comprendre la port\u00e9e et accepter d\u2019utiliser le rapport uniquement comme outil d\u2019analyse pr\u00e9liminaire, avec les validations additionnelles requises." },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Avertissement important — limites du rapport">
      <div style={{ padding: "32px 36px", fontFamily: T.sans }}>
        <div style={{
          padding: "16px 20px", marginBottom: 28,
          background: "#FEF3C7", borderRadius: 10,
          border: "1px solid #F59E0B44",
          fontFamily: T.sans, fontSize: 13.5, color: T.inkSoft,
          lineHeight: 1.75,
        }}>
          Veuillez lire attentivement cet avertissement avant d{"\u2019"}utiliser un rapport Scanimmo.
          <br/><br/>
          Le rapport Scanimmo est un outil d{"\u2019"}information et de repérage préliminaire.
          Il vise à aider l{"\u2019"}utilisateur à identifier rapidement certains éléments pouvant affecter
          un terrain, un immeuble ou un projet, notamment en matière de pente, zonage, inondation,
          contamination, données LiDAR, accès aux services, contexte territorial ou autres contraintes
          et opportunités apparentes.
        </div>
        {AVERT_SECTIONS.map(({ t, b }, i) => (
          <div key={i} style={{ marginBottom: 28 }}>
            <div style={{
              fontFamily: T.sans, fontSize: 14, fontWeight: 600,
              color: T.navy, marginBottom: 10,
            }}>{t}</div>
            <div style={{
              fontFamily: T.sans, fontSize: 13.5, color: T.inkSoft,
              lineHeight: 1.8, whiteSpace: "pre-line",
            }}>{b}</div>
          </div>
        ))}
        <div style={{
          marginTop: 32, padding: "16px 20px",
          background: T.subtle, borderRadius: 10,
          border: `1px solid ${T.border}`,
          fontFamily: T.mono, fontSize: 11, color: T.muted,
        }}>
          Version 1.0.0 {"\u00b7"} En vigueur depuis le 6 mars 2026 {"\u00b7"} Innovations Scanimmo Inc.<br/>
          Si\u00e8ge social : Qu\u00e9bec (Qu\u00e9bec) Canada {"\u00b7"} Contact via le formulaire du site
        </div>
      </div>
    </Modal>
  );
}

/* ─── Modal Contact ──────────────────────────────────────────────── */
function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ nom: "", courriel: "", organisation: "", message: "", objet: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Erreur lors de l'envoi du message");
      }

      setSent(true);
      setForm({ nom: "", courriel: "", organisation: "", message: "", objet: "" });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Erreur lors de l'envoi du message");
    } finally {
      setSending(false);
    }
  };

  const OBJETS = [
    { v: "avis",      l: "Avis / commentaire" },
    { v: "question",  l: "Question" },
    { v: "acquerir",  l: "Acquérir Scanimmo" },
    { v: "autres",    l: "Autres" },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Contactez-nous !">
      <div style={{ padding: "32px 36px" }}>
        {sent ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u2713"}</div>
            <div style={{
              fontFamily: T.display, fontSize: 22, color: T.navy, marginBottom: 12,
            }}>Message envoyé</div>
            <div style={{ fontFamily: T.sans, fontSize: 14, color: T.muted, lineHeight: 1.7 }}>
              Nous vous remercions de votre message et vous répondrons dès que possible !<br/>
            </div>
            <button onClick={() => { setSent(false); setSubmitError(null); setForm({ nom:"",courriel:"",organisation:"",message:"",objet:"" }); onClose(); }}
              style={{
                marginTop: 24, padding: "12px 28px",
                background: T.navy, border: "none", cursor: "pointer",
                borderRadius: 10, fontFamily: T.sans, fontSize: 13,
                fontWeight: 600, color: T.goldLt,
              }}>
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Objet */}
            <div>
              <label style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, color: T.inkSoft, display: "block", marginBottom: 6 }}>
                Objet *
              </label>
              <select
                value={form.objet}
                onChange={e => setForm(f => ({ ...f, objet: e.target.value }))}
                style={{
                  width: "100%", padding: "11px 14px",
                  border: `1px solid ${T.border}`, borderRadius: 8,
                  fontFamily: T.sans, fontSize: 13.5, color: T.ink,
                  background: T.white, outline: "none", cursor: "pointer",
                }}>
                <option value="" disabled>Sélectionnez l{"\u2019"}objet de votre message !</option>
                {OBJETS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>

            {/* Nom + courriel */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { key: "nom" as const, label: "Nom *", placeholder: "Votre nom et prénom ici !", type: "text" },
                { key: "courriel" as const, label: "Courriel *", placeholder: "Votre courriel ici !", type: "email" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, color: T.inkSoft, display: "block", marginBottom: 6 }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    required
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{
                      width: "100%", padding: "11px 14px", boxSizing: "border-box",
                      border: `1px solid ${T.border}`, borderRadius: 8,
                      fontFamily: T.sans, fontSize: 13.5, color: T.ink,
                      background: T.white, outline: "none",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Organisation */}
            <div>
              <label style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, color: T.inkSoft, display: "block", marginBottom: 6 }}>
                Organisation
              </label>
              <input
                type="text"
                value={form.organisation}
                onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))}
                placeholder="Votre organisation ici !"
                style={{
                  width: "100%", padding: "11px 14px", boxSizing: "border-box",
                  border: `1px solid ${T.border}`, borderRadius: 8,
                  fontFamily: T.sans, fontSize: 13.5, color: T.ink,
                  background: T.white, outline: "none",
                }}
              />
            </div>

            {/* Message */}
            <div>
              <label style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, color: T.inkSoft, display: "block", marginBottom: 6 }}>
                Message *
              </label>
              <textarea
                required
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={4}
                placeholder="Saisissez votre message ici !"
                style={{
                  width: "100%", padding: "11px 14px", boxSizing: "border-box",
                  border: `1px solid ${T.border}`, borderRadius: 8,
                  fontFamily: T.sans, fontSize: 13.5, color: T.ink,
                  background: T.white, outline: "none", resize: "vertical",
                  lineHeight: 1.6,
                }}
              />
            </div>

            <button type="submit" disabled={sending}
              style={{
                padding: "14px 32px",
                background: sending ? T.border : T.navy,
                border: "none", cursor: sending ? "default" : "pointer",
                borderRadius: 10,
                fontFamily: T.sans, fontSize: 14, fontWeight: 600,
                color: sending ? T.muted : T.goldLt,
                transition: "all .15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
              {sending ? (
                <>
                  <span style={{
                    width: 14, height: 14, border: `2px solid ${T.muted}`,
                    borderTopColor: T.gold, borderRadius: "50%",
                    animation: "spin .7s linear infinite",
                    display: "inline-block",
                  }}/>
                  Envoi en cours...
                </>
              ) : "Envoyer le message \u2192"}
            </button>
            {submitError && (
              <div style={{
                fontFamily: T.sans,
                fontSize: 13,
                color: T.red,
                lineHeight: 1.6,
              }}>
                {submitError}
              </div>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </form>
        )}
      </div>
    </Modal>
  );
}

/* ─── Composant : notification toast ────────────────────────────── */
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3200);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div style={{
      position: "fixed", bottom: 32, right: 32, zIndex: 2000,
      background: T.navy, border: `1px solid ${T.gold}44`,
      borderRadius: 12, padding: "16px 24px",
      boxShadow: "0 16px 48px rgba(0,0,0,.35)",
      display: "flex", alignItems: "center", gap: 12,
      animation: "slideUp .25s ease",
      maxWidth: 360,
    }}>
      <span style={{ fontSize: 18 }}>{"\u25CE"}</span>
      <span style={{ fontFamily: T.sans, fontSize: 13.5, color: T.white, lineHeight: 1.5 }}>
        {message}
      </span>
      <button onClick={onDismiss} style={{
        marginLeft: 8, background: "none", border: "none",
        color: "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 14,
      }}>{"\u2715"}</button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
════════════════════════════════════════════════════════════════════ */
export default function ScanimmoHome() {
  const [cguOpen,     setCguOpen]     = useState(false);
  const [avertOpen,   setAvertOpen]   = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [toast,       setToast]       = useState<string | null>(null);
  const [scrolled,    setScrolled]    = useState(false);
  const [activeNav,   setActiveNav]   = useState<string | null>(null);
  const [ready,       setReady]       = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => { clearTimeout(t); window.removeEventListener("scroll", onScroll); };
  }, []);

  const handleSearch = useCallback(({ mode, value }: { mode: string; value: string | { lat: string; lng: string } }) => {
    const labels: Record<string, string> = { adresse: "adresse", matricule: "matricule", gps: "coordonnées GPS" };
    setToast(`Recherche par ${labels[mode]} en cours — rapport en préparation...`);
  }, []);

  const NAV = [
    { id: "cgu",      label: "Conditions g\u00e9n\u00e9rales d\u2019utilisation", action: () => setCguOpen(true) },
    { id: "avert",    label: "Avertissement", action: () => setAvertOpen(true) },
    { id: "sources",  label: "Sources de donn\u00e9es" },
  ];

  return (
    <div style={{
      fontFamily: T.sans, background: T.cream,
      minHeight: "100vh", color: T.ink,
    }}>
      {/* Fonts loaded via layout.tsx head */}
      <CGUModal              open={cguOpen}     onClose={() => setCguOpen(false)}/>
      <AvertissementModal   open={avertOpen}   onClose={() => setAvertOpen(false)}/>
      <ContactModal         open={contactOpen} onClose={() => setContactOpen(false)}/>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)}/>}

      {/* ── TOPBAR ──────────────────────────────────────────────────── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 900,
        height: 56,
        background: scrolled
          ? "rgba(15,43,75,.97)"
          : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? `1px solid rgba(196,154,40,.12)` : "none",
        display: "flex", alignItems: "center",
        padding: "0 40px",
        transition: "all .3s ease",
      }}>
        {/* Logo */}
        <a href="#" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, marginRight: 40 }}>
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

        {/* Nav */}
        <nav style={{ display: "flex", gap: 4, flex: 1 }}>
          {NAV.map(n => (
            <button key={n.id}
              onClick={() => {
                if ((n as any).action) (n as any).action();
                else {
                  const el = document.getElementById(n.id);
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              onMouseEnter={() => setActiveNav(n.id)}
              onMouseLeave={() => setActiveNav(null)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "8px 14px", borderRadius: 8,
                fontFamily: T.sans, fontSize: 13, fontWeight: 400,
                color: activeNav === n.id ? T.goldLt : "rgba(255,255,255,.52)",
                transition: "all .15s",
              }}>
              {n.label}
            </button>
          ))}
        </nav>

        {/* CTA droite */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={() => setContactOpen(true)}
            style={{
              background: T.gold,
              border: "none", cursor: "pointer", borderRadius: 8,
              padding: "9px 20px",
              fontFamily: T.sans, fontSize: 12.5, fontWeight: 600,
              color: T.navy, letterSpacing: .2,
              transition: "all .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.goldLt}
            onMouseLeave={e => e.currentTarget.style.background = T.gold}
          >
            Contactez-nous !
          </button>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${T.navyDeep} 0%, ${T.navy} 45%, ${T.navyLt} 100%)`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "80px 40px 56px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Texture grain */}
        <div style={{
          position: "absolute", inset: 0, opacity: .025,
          backgroundImage: "radial-gradient(circle at 1px 1px,#fff 1px,transparent 0)",
          backgroundSize: "18px 18px", pointerEvents: "none",
        }}/>
        {/* Glow or */}
        <div style={{
          position: "absolute",
          top: "30%", left: "55%",
          width: 600, height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle,${T.gold}18 0%,transparent 65%)`,
          transform: "translate(-50%,-50%)",
          pointerEvents: "none",
        }}/>

        {/* Eyebrow */}
        <div style={{
          fontFamily: T.mono, fontSize: 10.5, letterSpacing: 3,
          textTransform: "uppercase",
          color: T.gold,
          marginBottom: 24,
          display: "flex", alignItems: "center", gap: 10,
          animation: "fadeUp .6s ease both",
        }}>
          <span style={{
            display: "inline-block", width: 28, height: 1.5,
            background: T.gold,
          }}/>
          Faisabilité immobilière pré-conception {"\u00b7"} Québec
          <span style={{
            display: "inline-block", width: 28, height: 1.5,
            background: T.gold,
          }}/>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: T.display, fontSize: "clamp(38px,5.5vw,68px)",
          fontWeight: 400, color: T.white,
          margin: "0 0 20px", lineHeight: 1.12,
          textAlign: "center", letterSpacing: -1.5,
          animation: "fadeUp .6s .1s ease both",
        }}>
          Votre rapport d{"'"}analyse foncière<br/>
          <em style={{ color: T.goldLt, fontStyle: "italic" }}>en quelques secondes !</em>
        </h1>

        <p style={{
          fontFamily: T.sans, fontSize: 15, fontWeight: 300,
          color: "rgba(255,255,255,.52)",
          maxWidth: 720, textAlign: "center", lineHeight: 1.8,
          margin: "0 0 52px",
          animation: "fadeUp .6s .2s ease both",
        }}>
          Zonage, inondation, contamination, LiDAR, acc{"è"}s aux services, permis de construction, d{"é"}favorisation
          <br/>12 sources institutionnelles couvrant 3,7 millions de propri{"é"}t{"é"}s au Qu{"é"}bec.
        </p>

        {/* Moteur de recherche */}
        <div style={{
          width: "100%",
          animation: "fadeUp .6s .3s ease both",
        }}>
          <SearchEngine onSearch={handleSearch}/>
        </div>

        {/* Statistiques */}
        <div style={{
          display: "flex", gap: 0,
          marginTop: 64,
          borderTop: "1px solid rgba(255,255,255,.08)",
          paddingTop: 40,
          width: "100%", maxWidth: 720,
          animation: "fadeUp .6s .45s ease both",
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              flex: 1, textAlign: "center",
              borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,.08)" : "none",
              padding: "0 24px",
            }}>
              <div style={{
                fontFamily: T.display, fontSize: 30,
                color: T.goldLt, letterSpacing: -1, lineHeight: 1,
                marginBottom: 8,
              }}>{s.value}</div>
              <div style={{
                fontFamily: T.mono, fontSize: 10.5,
                color: "rgba(255,255,255,.35)",
                letterSpacing: .8, textTransform: "uppercase",
                lineHeight: 1.5,
              }}>{s.label}</div>
            </div>
          ))}
        </div>

        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0);    }
          }
        `}</style>
      </section>

      {/* ── SOURCES DE DONNÉES ─────────────────────────────────────── */}
      <section id="sources" style={{
        padding: "72px 40px 64px",
        background: T.cream,
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: T.display, fontSize: 28, fontWeight: 400,
            color: T.navy, textAlign: "center", margin: "0 0 8px",
          }}>Sources de données</h2>
          <p style={{
            fontFamily: T.sans, fontSize: 14, color: T.muted,
            textAlign: "center", margin: "0 0 40px",
          }}>12 sources institutionnelles couvrant 3,7 millions de propriétés au Québec</p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {SOURCES.map((s, i) => {
              const Wrap = s.url ? "a" : "div";
              const linkProps = s.url ? { href: s.url, target: "_blank", rel: "noopener noreferrer" } : {};
              return (
                <Wrap key={i} {...linkProps} style={{
                  background: T.white,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  padding: "18px 20px",
                  display: "flex", alignItems: "flex-start", gap: 14,
                  textDecoration: "none",
                  transition: "border-color .15s, box-shadow .15s",
                  cursor: s.url ? "pointer" : "default",
                }}
                  onMouseEnter={s.url ? (e: React.MouseEvent<HTMLElement>) => {
                    e.currentTarget.style.borderColor = T.gold;
                    e.currentTarget.style.boxShadow = `0 2px 12px ${T.gold}22`;
                  } : undefined}
                  onMouseLeave={s.url ? (e: React.MouseEvent<HTMLElement>) => {
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.boxShadow = "none";
                  } : undefined}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: `${T.gold}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 2,
                  }}>
                    <span style={{ fontFamily: T.mono, fontSize: 12, color: T.gold, fontWeight: 600 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: T.sans, fontSize: 13.5, fontWeight: 500,
                      color: T.navy, lineHeight: 1.3, marginBottom: 2,
                    }}>{s.nom}</div>
                    <div style={{
                      fontFamily: T.mono, fontSize: 10.5,
                      color: T.muted, letterSpacing: 0.3, marginBottom: s.citation ? 6 : 0,
                    }}>{s.org}</div>
                    {s.citation && (
                      <div style={{
                        fontFamily: T.sans, fontSize: 10.5, color: T.muted,
                        lineHeight: 1.5, fontStyle: "italic",
                      }}>{s.citation}</div>
                    )}
                  </div>
                  {s.url && (
                    <span style={{ fontSize: 12, color: T.gold, flexShrink: 0, marginTop: 4 }}>{"\u2197"}</span>
                  )}
                </Wrap>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}
