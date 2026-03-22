/**
 * Success Page (/success?matricule=...&token=...)
 * @description Confirmation post-generation — design navy/or/creme
 *              Affiche le bouton de telechargement PDF si token present
 */

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useIsMobile } from "@/lib/use-is-mobile";

/* ═══════════════════════════════════════════════════════════════════
   DESIGN SYSTEM — herite du Rapport v12
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
  muted:    "#7C7268",
  border:   "#E4E0D8",
  subtle:   "#F2EFE8",
  navy:     "#0F2B4B",
  navyDeep: "#091E34",
  display:  "var(--font-display), 'Playfair Display', Georgia, serif",
  mono:     "var(--font-mono), 'IBM Plex Mono', monospace",
  sans:     "var(--font-sans), system-ui, sans-serif",
};

function SuccessContent() {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const matricule = searchParams.get("matricule");
  const token = searchParams.get("token");
  const [downloading, setDownloading] = useState(false);

  if (!matricule) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        background: T.cream, fontFamily: T.sans,
      }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{
            fontFamily: T.display, fontSize: 48, color: T.navy, marginBottom: 16,
          }}>?</div>
          <h1 style={{
            fontFamily: T.display, fontSize: 28, color: T.navy,
            marginBottom: 12, fontWeight: 400,
          }}>Lien invalide</h1>
          <p style={{ fontFamily: T.sans, fontSize: 15, color: T.muted, lineHeight: 1.7, marginBottom: 32 }}>
            Ce lien ne contient pas de matricule. Lancez une nouvelle recherche.
          </p>
          <a href="/" style={{
            display: "inline-block", padding: "14px 32px",
            background: T.navy, borderRadius: 10, textDecoration: "none",
            fontFamily: T.sans, fontSize: 14, fontWeight: 600,
            color: T.goldLt,
          }}>Nouvelle recherche</a>
        </div>
      </div>
    );
  }

  const isReady = !!token;

  const handleDownload = async () => {
    if (!token) return;
    setDownloading(true);
    // Open download in new tab — the API route sets Content-Disposition: attachment
    window.open(`/api/report/${token}`, "_blank");
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div style={{ fontFamily: T.sans, background: T.cream, minHeight: "100dvh", color: T.ink }}>

      {/* ── TOPBAR ──────────────────────────────────────────────────── */}
      <header style={{
        height: 56,
        background: T.navy,
        borderBottom: `1px solid rgba(196,154,40,.12)`,
        display: "flex", alignItems: "center",
        padding: isMobile ? "0 20px" : "0 40px",
      }}>
        <a href="/" style={{
          textDecoration: "none", display: "flex", alignItems: "center", gap: 10,
        }}>
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
      </header>

      {/* ── CONTENU PRINCIPAL ─────────────────────────────────────── */}
      <main style={{
        maxWidth: 680, margin: "0 auto",
        padding: isMobile ? "64px 20px 40px" : "80px 40px 48px",
      }}>

        {/* Success indicator */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          {/* Checkmark ring */}
          <div style={{
            width: 88, height: 88, borderRadius: "50%",
            background: (isReady ? T.green : T.gold) + "15",
            border: `2px solid ${(isReady ? T.green : T.gold)}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            {isReady ? (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            ) : (
              <div style={{
                width: 32, height: 32, border: `3px solid ${T.gold}`,
                borderTopColor: "transparent", borderRadius: "50%",
                animation: "spin .7s linear infinite",
              }}/>
            )}
          </div>

          <h1 style={{
            fontFamily: T.display, fontSize: 36, fontWeight: 400,
            color: T.navy, margin: "0 0 12px", letterSpacing: -.5,
          }}>
            {isReady
              ? <>Rapport <em style={{ fontStyle: "italic", color: T.green }}>prêt</em></>
              : <>Rapport en <em style={{ fontStyle: "italic", color: T.gold }}>préparation</em></>
            }
          </h1>
          <p style={{
            fontFamily: T.sans, fontSize: 16, color: T.muted,
            lineHeight: 1.7, maxWidth: 440, margin: "0 auto",
          }}>
            {isReady
              ? "Votre rapport PDF est prêt. Cliquez ci-dessous pour le télécharger."
              : "Votre analyse est en cours de génération. Le rapport PDF sera disponible dans quelques instants."
            }
          </p>
        </div>

        {/* Download button — visible only when token present */}
        {isReady && (
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                padding: "18px 56px",
                background: downloading ? T.border : T.green,
                border: "none",
                cursor: downloading ? "default" : "pointer",
                borderRadius: 12,
                fontFamily: T.sans, fontSize: 17, fontWeight: 600,
                color: downloading ? T.muted : T.white,
                letterSpacing: .3,
                transition: "all .15s",
                display: "inline-flex", alignItems: "center", gap: 12,
              }}
              onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = "#15803D"; }}
              onMouseLeave={e => { if (!downloading) e.currentTarget.style.background = T.green; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {downloading ? "Téléchargement..." : "Télécharger le PDF"}
            </button>
          </div>
        )}

        {/* Info card */}
        <div style={{
          background: T.white,
          borderRadius: 16,
          border: `1px solid ${T.border}`,
          overflow: "hidden",
          marginBottom: 32,
        }}>
          {/* Card header */}
          <div style={{
            background: T.navy,
            padding: "16px 28px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: T.gold,
            }}/>
            <span style={{
              fontFamily: T.mono, fontSize: 11, letterSpacing: 1.5,
              textTransform: "uppercase", color: T.goldLt,
            }}>Informations du rapport</span>
          </div>

          {/* Card body */}
          <div style={{ padding: "24px 28px" }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{
                  fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5,
                  textTransform: "uppercase", color: T.muted, marginBottom: 6,
                }}>Matricule</div>
                <div style={{
                  fontFamily: T.mono, fontSize: 15, fontWeight: 600,
                  color: T.navy,
                }}>{matricule}</div>
              </div>
              <div>
                <div style={{
                  fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5,
                  textTransform: "uppercase", color: T.muted, marginBottom: 6,
                }}>Type</div>
                <div style={{
                  fontFamily: T.sans, fontSize: 15, fontWeight: 600,
                  color: T.navy,
                }}>Rapport Scanimmo</div>
              </div>
              <div>
                <div style={{
                  fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5,
                  textTransform: "uppercase", color: T.muted, marginBottom: 6,
                }}>Tarif</div>
                <div style={{
                  fontFamily: T.sans, fontSize: 15, fontWeight: 600,
                  color: T.green,
                }}>Gratuit</div>
              </div>
              <div>
                <div style={{
                  fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5,
                  textTransform: "uppercase", color: T.muted, marginBottom: 6,
                }}>Statut</div>
                <div style={{
                  fontFamily: T.sans, fontSize: 15, fontWeight: 600,
                  color: isReady ? T.green : T.gold,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  {isReady ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      Prêt
                    </>
                  ) : (
                    <>
                      <span style={{
                        width: 12, height: 12, border: `2px solid ${T.gold}`,
                        borderTopColor: "transparent", borderRadius: "50%",
                        animation: "spin .7s linear infinite",
                        display: "inline-block",
                      }}/>
                      En génération...
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* CTA */}
        <div style={{
          textAlign: "center",
          borderTop: `1px solid ${T.border}`,
          paddingTop: 32,
        }}>
          <p style={{
            fontFamily: T.sans, fontSize: 14, color: T.muted,
            marginBottom: 16,
          }}>
            Besoin d'analyser un autre terrain ?
          </p>
          <a href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 32px",
            background: "transparent",
            border: `2px solid ${T.navy}`,
            borderRadius: 10,
            textDecoration: "none",
            fontFamily: T.sans, fontSize: 14, fontWeight: 600,
            color: T.navy, letterSpacing: .3,
            transition: "all .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = T.navy; e.currentTarget.style.color = T.goldLt; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.navy; }}
          >
            {"\u2190"} Nouvelle recherche
          </a>
        </div>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{
        background: T.navyDeep,
        borderTop: `1px solid rgba(196,154,40,.12)`,
        padding: isMobile ? "24px 20px" : "24px 40px",
        marginTop: 48,
      }}>
        <div style={{
          maxWidth: 680, margin: "0 auto",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 10 : 0,
        }}>
          <span style={{
            fontFamily: T.mono, fontSize: 10.5, color: "rgba(255,255,255,.2)",
          }}>
            {"\u00a9"} {new Date().getFullYear()} Innovations Scanimmo Inc.
          </span>
          <span style={{
            fontFamily: T.mono, fontSize: 10, color: "rgba(255,255,255,.15)",
          }}>
            v4.1 {"\u00b7"} Quebec, Canada
          </span>
        </div>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#F8F6F1",
      }}>
        <div style={{
          width: 40, height: 40, border: "3px solid #E4E0D8",
          borderTopColor: "#C49A28", borderRadius: "50%",
          animation: "spin .7s linear infinite",
        }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
