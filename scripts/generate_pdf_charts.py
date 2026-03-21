#!/usr/bin/env python3
"""
generate_pdf_charts.py — Génère les diagrammes pour le rapport PDF Scanimmo.

Usage:
    echo '{"score": 39.8, ...}' | python generate_pdf_charts.py
    → Sortie JSON: {"radar": "data:image/png;base64,...", "topo": "data:image/png;base64,..."}

Design system: navy #0F2B4B, gold #C49A28, cream #F8F6F1
"""

import sys
import json
import base64
import io
import math

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
from matplotlib.patches import FancyBboxPatch
import numpy as np

# ═══════════════════════════════════════════════════════════════
# DESIGN TOKENS (Scanimmo)
# ═══════════════════════════════════════════════════════════════
NAVY      = "#0F2B4B"
NAVY_DEEP = "#091E34"
GOLD      = "#C49A28"
GOLD_LT   = "#EDD68A"
GOLD_DIM  = "#8A6B1A"
CREAM     = "#F8F6F1"
WHITE     = "#FFFFFF"
GREEN     = "#16A34A"
AMBER     = "#B45309"
RED       = "#B91C1C"
MUTED     = "#7C7268"
BORDER    = "#E4E0D8"

FONT_SANS  = "IBM Plex Sans"
FONT_MONO  = "IBM Plex Mono"
FONT_FALLBACK = ["DejaVu Sans", "Arial", "sans-serif"]


def _setup_fonts():
    """Configure matplotlib fonts with fallback."""
    available = set(f.name for f in matplotlib.font_manager.fontManager.ttflist)
    if FONT_SANS in available:
        plt.rcParams["font.family"] = FONT_SANS
    else:
        plt.rcParams["font.family"] = "sans-serif"
        plt.rcParams["font.sans-serif"] = FONT_FALLBACK
    plt.rcParams["text.color"] = CREAM
    plt.rcParams["axes.labelcolor"] = CREAM
    plt.rcParams["xtick.color"] = CREAM
    plt.rcParams["ytick.color"] = CREAM


def _fig_to_base64(fig, dpi=180):
    """Convert matplotlib figure to base64 data URI."""
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=dpi, bbox_inches="tight",
                facecolor=fig.get_facecolor(), edgecolor="none",
                transparent=False)
    plt.close(fig)
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode("ascii")
    return f"data:image/png;base64,{b64}"


# ═══════════════════════════════════════════════════════════════
# 1. RADAR CHART — Profil multi-dimensionnel
# ═══════════════════════════════════════════════════════════════

def _normalize_topographie(pente):
    """Pente 0% = 100, pente >= 15% = 0."""
    if pente is None:
        return 50  # neutral
    return max(0, min(100, 100 - (float(pente) / 15) * 100))


def _normalize_environnement(inond_020, inond_20100, contam, mh):
    """Score 0-100: more constraints = lower."""
    score = 100
    if inond_020:
        score -= 40
    if inond_20100:
        score -= 20
    if contam == "OUI" or contam is True:
        score -= 30
    if mh is True:
        score -= 15
    return max(0, score)


def _normalize_reglementation(cos, hauteur_m, hauteur_etages, aire_verte):
    """Score 0-100: higher COS/height = better potential."""
    score = 50  # baseline
    if cos is not None:
        score += min(25, float(cos) * 10)
    if hauteur_m is not None:
        score += min(15, float(hauteur_m) / 4)
    elif hauteur_etages is not None:
        score += min(15, float(hauteur_etages) * 2)
    if aire_verte is not None and float(aire_verte) < 30:
        score += 10
    return max(0, min(100, score))


def _normalize_foncier(val_terrain, val_total, superficie):
    """Score 0-100: good terrain/total ratio + reasonable $/m2."""
    if val_total is None or val_total == 0:
        return 50
    score = 50
    ratio = float(val_terrain or 0) / float(val_total)
    # Higher terrain ratio = more land value = better for redevelopment
    score += ratio * 30
    # Price per m2
    if superficie and float(superficie) > 0:
        price_m2 = float(val_total) / float(superficie)
        if price_m2 < 5000:
            score += 20
        elif price_m2 < 15000:
            score += 10
    return max(0, min(100, score))


def _normalize_constructibilite(superficie, cos, nb_logements):
    """Score 0-100: bigger buildable area = better."""
    if superficie is None:
        return 50
    sup = float(superficie)
    cos_val = float(cos) if cos is not None else 1.5
    buildable = sup * cos_val
    # Scale: 500m2 = 30, 5000m2 = 80, 10000+ = 100
    score = min(100, 30 + (buildable / 5000) * 50)
    if nb_logements and int(nb_logements) > 10:
        score = min(100, score + 10)
    return max(0, min(100, score))


def _normalize_fiabilite(lidar_method, lidar_source, pente, zone_code):
    """Score 0-100: data completeness & quality."""
    score = 20  # base
    if lidar_method == "WITHIN":
        score += 30
    elif lidar_method == "NEAREST_OK":
        score += 15
    if lidar_source is not None:
        score += 15
    if pente is not None:
        score += 10
    if zone_code and zone_code != "N/D":
        score += 15
    return max(0, min(100, score + 10))


def generate_radar(data):
    """Generate 6-axis radar chart."""
    categories = [
        "Topographie",
        "Environnement",
        "Reglementation",
        "Foncier",
        "Constructibilite",
        "Fiabilite donnees",
    ]
    values = [
        _normalize_topographie(data.get("pente_moyenne_pct")),
        _normalize_environnement(
            data.get("zone_inondable_0_20"),
            data.get("zone_inondable_20_100"),
            data.get("contamination_statut"),
            data.get("mh_intersecte"),
        ),
        _normalize_reglementation(
            data.get("cos_max"),
            data.get("qc_hauteur_max_m"),
            data.get("hauteur_max_etages"),
            data.get("aire_verte_min_pct"),
        ),
        _normalize_foncier(
            data.get("valeur_terrain"),
            data.get("valeur_totale"),
            data.get("superficie_m2"),
        ),
        _normalize_constructibilite(
            data.get("superficie_m2"),
            data.get("cos_max"),
            data.get("nb_logements"),
        ),
        _normalize_fiabilite(
            data.get("lidar_match_method"),
            data.get("lidar_source"),
            data.get("pente_moyenne_pct"),
            data.get("zone_code"),
        ),
    ]

    N = len(categories)
    angles_base = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
    values_plot = values + [values[0]]
    angles = angles_base + [angles_base[0]]

    fig, ax = plt.subplots(figsize=(5.2, 5.2), subplot_kw=dict(polar=True))
    fig.set_facecolor(NAVY_DEEP)
    ax.set_facecolor(NAVY_DEEP)

    # Grid rings
    for ring in [20, 40, 60, 80, 100]:
        ring_vals = [ring] * (N + 1)
        ax.plot(angles, ring_vals, color=GOLD_DIM, alpha=0.15, linewidth=0.5)

    # Grid spokes
    for angle in angles[:-1]:
        ax.plot([angle, angle], [0, 100], color=GOLD_DIM, alpha=0.2, linewidth=0.5)

    # Data area fill
    ax.fill(angles, values_plot, color=GOLD, alpha=0.15)
    # Data line
    ax.plot(angles, values_plot, color=GOLD, linewidth=2.5, linestyle="-")
    # Data points
    ax.scatter(angles_base, values, color=GOLD_LT, s=60, zorder=5,
               edgecolors=GOLD, linewidths=1.5)

    # Value labels on each point
    for i, (angle, val) in enumerate(zip(angles_base, values)):
        ha = "center"
        offset_r = 12
        ax.text(angle, val + offset_r, f"{int(val)}",
                ha=ha, va="center", fontsize=9, fontweight="bold",
                color=GOLD_LT)

    # Category labels
    ax.set_xticks(angles_base)
    ax.set_xticklabels(categories, fontsize=9.5, fontweight="500", color=CREAM)

    # Adjust label positions
    for label, angle in zip(ax.get_xticklabels(), angles_base):
        if angle == 0:
            label.set_ha("center")
            label.set_va("bottom")
        elif 0 < angle < np.pi:
            label.set_ha("left")
        elif angle == np.pi:
            label.set_ha("center")
            label.set_va("top")
        else:
            label.set_ha("right")

    ax.set_ylim(0, 110)
    ax.set_yticklabels([])
    ax.spines["polar"].set_visible(False)
    ax.grid(False)

    # Title
    fig.text(0.5, 0.98, "PROFIL DE LA PROPRIETE", ha="center", va="top",
             fontsize=11, fontweight="bold", color=GOLD_LT,
             fontfamily="sans-serif")

    fig.subplots_adjust(top=0.92, bottom=0.05, left=0.08, right=0.92)
    return _fig_to_base64(fig, dpi=200)


# ═══════════════════════════════════════════════════════════════
# 2. ÉVALUATION FONCIÈRE — Donut Chart
# ═══════════════════════════════════════════════════════════════

def generate_valuation_donut(data):
    """Donut chart: terrain vs batiment."""
    terrain = float(data.get("valeur_terrain") or 0)
    batiment = float(data.get("valeur_batiment") or 0)
    total = terrain + batiment

    if total == 0:
        return None

    pct_terrain = terrain / total * 100
    pct_batiment = batiment / total * 100

    fig, ax = plt.subplots(figsize=(3.8, 3.8))
    fig.set_facecolor(NAVY_DEEP)
    ax.set_facecolor(NAVY_DEEP)

    sizes = [terrain, batiment]
    colors = [GOLD, "#4A7C9B"]  # Gold for terrain, muted blue for batiment
    explode = (0.02, 0.02)

    wedges, _ = ax.pie(
        sizes, explode=explode, colors=colors,
        startangle=90, wedgeprops=dict(width=0.35, edgecolor=NAVY_DEEP, linewidth=2)
    )

    # Center text
    ax.text(0, 0.08, f"{total/1e6:.1f} M$", ha="center", va="center",
            fontsize=16, fontweight="bold", color=WHITE)
    ax.text(0, -0.12, "VALEUR TOTALE", ha="center", va="center",
            fontsize=7, fontweight="bold", color=MUTED)

    # Legend
    legend_y = -0.18
    ax.text(-0.55, legend_y - 0.22, "\u25CF", fontsize=12, color=GOLD,
            ha="center", va="center", transform=ax.transAxes)
    ax.text(-0.42, legend_y - 0.22, f"Terrain  {pct_terrain:.0f}%", fontsize=9,
            color=CREAM, ha="left", va="center", transform=ax.transAxes)

    ax.text(0.45, legend_y - 0.22, "\u25CF", fontsize=12, color="#4A7C9B",
            ha="center", va="center", transform=ax.transAxes)
    ax.text(0.58, legend_y - 0.22, f"Batiment  {pct_batiment:.0f}%", fontsize=9,
            color=CREAM, ha="left", va="center", transform=ax.transAxes)

    ax.set_aspect("equal")
    fig.subplots_adjust(bottom=0.12)
    return _fig_to_base64(fig, dpi=200)


# ═══════════════════════════════════════════════════════════════
# 3. TOPOGRAPHY PROFILE — Elevation + Slope
# ═══════════════════════════════════════════════════════════════

def generate_topo_profile(data):
    """Visual topography summary bar chart."""
    elev_min = data.get("elevation_min_m")
    elev_max = data.get("elevation_max_m")
    pente = data.get("pente_moyenne_pct")
    denivele = data.get("denivele_moyen_m")

    if elev_min is None and elev_max is None:
        return None

    elev_min = float(elev_min or 0)
    elev_max = float(elev_max or elev_min)
    pente = float(pente) if pente is not None else 0
    denivele = float(denivele) if denivele is not None else (elev_max - elev_min)

    fig, axes = plt.subplots(1, 3, figsize=(7.5, 2.6),
                             gridspec_kw={"width_ratios": [1.2, 1, 1]})
    fig.set_facecolor(NAVY_DEEP)

    for ax in axes:
        ax.set_facecolor(NAVY_DEEP)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.spines["bottom"].set_color(GOLD_DIM + "44")
        ax.spines["left"].set_color(GOLD_DIM + "44")
        ax.tick_params(colors=CREAM, labelsize=8)

    # Panel 1: Elevation bar
    bar_range = max(elev_max - elev_min, 0.5)
    ax1 = axes[0]
    ax1.barh([""], [elev_max - elev_min], left=[elev_min], height=0.5,
             color=GOLD, alpha=0.7, edgecolor=GOLD_LT, linewidth=1)
    ax1.set_xlim(elev_min - bar_range * 0.3, elev_max + bar_range * 0.3)
    ax1.set_title("Elevation (m)", fontsize=9, color=GOLD_LT, pad=10, fontweight="bold")
    ax1.text(elev_min, 0, f"{elev_min:.1f}m", ha="right", va="center",
             fontsize=9, color=CREAM, fontweight="bold")
    ax1.text(elev_max, 0, f" {elev_max:.1f}m", ha="left", va="center",
             fontsize=9, color=CREAM, fontweight="bold")
    ax1.set_yticks([])

    # Panel 2: Pente gauge
    ax2 = axes[1]
    # Semicircle gauge for slope
    theta = np.linspace(np.pi, 0, 100)
    # Background arc
    ax2.plot(np.cos(theta), np.sin(theta), color=GOLD_DIM, alpha=0.3, linewidth=8)
    # Value arc (pente up to 15% = full)
    pente_ratio = min(pente / 15, 1.0)
    n_pts = max(2, int(pente_ratio * 100))
    theta_val = np.linspace(np.pi, np.pi - pente_ratio * np.pi, n_pts)
    color = GREEN if pente < 5 else AMBER if pente < 10 else RED
    ax2.plot(np.cos(theta_val), np.sin(theta_val), color=color, linewidth=8,
             solid_capstyle="round")
    ax2.text(0, 0.15, f"{pente:.1f}%", ha="center", va="center",
             fontsize=18, fontweight="bold", color=WHITE)
    ax2.text(0, -0.15, "PENTE", ha="center", va="center",
             fontsize=7, fontweight="bold", color=MUTED)
    ax2.set_xlim(-1.3, 1.3)
    ax2.set_ylim(-0.4, 1.3)
    ax2.set_aspect("equal")
    ax2.axis("off")
    ax2.set_title("Pente moyenne", fontsize=9, color=GOLD_LT, pad=10, fontweight="bold")

    # Panel 3: Denivele
    ax3 = axes[2]
    ax3.bar(["Denivele"], [denivele], color=GOLD, alpha=0.7,
            edgecolor=GOLD_LT, linewidth=1, width=0.4)
    ax3.text(0, denivele + 0.05, f"{denivele:.2f} m", ha="center", va="bottom",
             fontsize=12, fontweight="bold", color=WHITE)
    ax3.set_ylim(0, max(denivele * 1.5, 1))
    ax3.set_title("Denivele", fontsize=9, color=GOLD_LT, pad=10, fontweight="bold")
    ax3.set_xticklabels([])

    fig.subplots_adjust(wspace=0.4, left=0.06, right=0.96, top=0.82, bottom=0.08)
    return _fig_to_base64(fig, dpi=200)


# ═══════════════════════════════════════════════════════════════
# 4. CONTRAINTES HEATMAP
# ═══════════════════════════════════════════════════════════════

def generate_contraintes_visual(data):
    """Visual matrix of environmental constraints."""
    items = [
        ("Zone inondable\n0-20 ans", data.get("zone_inondable_0_20", False)),
        ("Zone inondable\n20-100 ans", data.get("zone_inondable_20_100", False)),
        ("Contamination", data.get("contamination_statut") in ("OUI", True)),
        ("Milieux\nhumides", data.get("mh_intersecte", False)),
    ]

    fig, axes = plt.subplots(1, 4, figsize=(7.5, 1.8))
    fig.set_facecolor(NAVY_DEEP)

    for ax, (label, is_risk) in zip(axes, items):
        ax.set_facecolor(NAVY_DEEP)
        ax.axis("off")

        # Circle indicator
        circle_color = RED if is_risk else GREEN
        circle = plt.Circle((0.5, 0.6), 0.25, color=circle_color, alpha=0.2)
        ax.add_patch(circle)
        inner = plt.Circle((0.5, 0.6), 0.12, color=circle_color, alpha=0.8)
        ax.add_patch(inner)

        # Checkmark or X
        symbol = "\u2717" if is_risk else "\u2713"
        ax.text(0.5, 0.6, symbol, ha="center", va="center",
                fontsize=16, fontweight="bold", color=WHITE)

        # Label
        ax.text(0.5, 0.12, label, ha="center", va="center",
                fontsize=8, color=CREAM, fontweight="500",
                multialignment="center", linespacing=1.3)

        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.set_aspect("equal")

    fig.subplots_adjust(wspace=0.15, left=0.02, right=0.98, top=0.95, bottom=0.02)
    return _fig_to_base64(fig, dpi=200)


# ═══════════════════════════════════════════════════════════════
# 5. PROXIMITY RADAR — 10 axes StatCan (properties_access)
# ═══════════════════════════════════════════════════════════════

PROXIMITY_LABELS = {
    "idx_transit":  "Transport\nen commun",
    "idx_epicerie": "Epicerie",
    "idx_sante":    "Sante",
    "idx_parcs":    "Parcs",
    "idx_educpri":  "Ecole\nprimaire",
    "idx_garderie": "Garderie",
    "idx_pharma":   "Pharmacie",
    "idx_emp":      "Emploi",
    "idx_educsec":  "Ecole\nsecondaire",
    "idx_bibl":     "Bibliotheque",
}

PROXIMITY_KEYS = list(PROXIMITY_LABELS.keys())


def generate_proximity_radar(data):
    """Generate 10-axis radar chart for StatCan proximity indices (0-100)."""
    values = []
    labels = []
    for key in PROXIMITY_KEYS:
        v = data.get(key)
        values.append(float(v) if v is not None else 0)
        labels.append(PROXIMITY_LABELS[key])

    if all(v == 0 for v in values):
        return None

    access_score = data.get("access_score_0_100")

    N = len(labels)
    angles_base = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
    values_plot = values + [values[0]]
    angles = angles_base + [angles_base[0]]

    fig, ax = plt.subplots(figsize=(5.8, 5.8), subplot_kw=dict(polar=True))
    fig.set_facecolor(NAVY_DEEP)
    ax.set_facecolor(NAVY_DEEP)

    # Grid rings
    for ring in [20, 40, 60, 80, 100]:
        ring_vals = [ring] * (N + 1)
        ax.plot(angles, ring_vals, color=GOLD_DIM, alpha=0.15, linewidth=0.5)
        if ring in (20, 60, 100):
            ax.text(angles_base[0], ring + 2, str(ring),
                    fontsize=7, color=MUTED, ha="center", va="bottom")

    # Grid spokes
    for angle in angles_base:
        ax.plot([angle, angle], [0, 100], color=GOLD_DIM, alpha=0.2, linewidth=0.5)

    # Data area fill
    ax.fill(angles, values_plot, color="#2E86AB", alpha=0.18)
    # Data line
    ax.plot(angles, values_plot, color="#2E86AB", linewidth=2.5, linestyle="-")
    # Data points
    ax.scatter(angles_base, values, color="#60C5F1", s=55, zorder=5,
               edgecolors="#2E86AB", linewidths=1.5)

    # Value labels on each point
    for i, (angle, val) in enumerate(zip(angles_base, values)):
        offset_r = 11
        ax.text(angle, val + offset_r, f"{val:.0f}",
                ha="center", va="center", fontsize=8, fontweight="bold",
                color="#60C5F1")

    # Category labels
    ax.set_xticks(angles_base)
    ax.set_xticklabels(labels, fontsize=8.5, fontweight="500", color=CREAM,
                       linespacing=1.2)

    # Adjust label positions
    for label, angle in zip(ax.get_xticklabels(), angles_base):
        if abs(angle) < 0.01:
            label.set_ha("center")
            label.set_va("bottom")
        elif 0 < angle < np.pi:
            label.set_ha("left")
        elif abs(angle - np.pi) < 0.01:
            label.set_ha("center")
            label.set_va("top")
        else:
            label.set_ha("right")

    ax.set_ylim(0, 115)
    ax.set_yticklabels([])
    ax.spines["polar"].set_visible(False)
    ax.grid(False)

    # Title
    title = "ACCESSIBILITE & PROXIMITE"
    if access_score is not None:
        title += f"  |  Score global : {float(access_score):.0f}/100"
    fig.text(0.5, 0.98, title, ha="center", va="top",
             fontsize=11, fontweight="bold", color=GOLD_LT,
             fontfamily="sans-serif")

    fig.subplots_adjust(top=0.91, bottom=0.06, left=0.08, right=0.92)
    return _fig_to_base64(fig, dpi=200)


# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

def main():
    _setup_fonts()

    raw = sys.stdin.read()
    data = json.loads(raw)

    result = {}

    result["radar"] = generate_radar(data)
    result["valuation_donut"] = generate_valuation_donut(data)
    result["topo_profile"] = generate_topo_profile(data)
    result["contraintes"] = generate_contraintes_visual(data)
    result["proximity_radar"] = generate_proximity_radar(data)

    # Include computed radar values for HTML fallback
    result["radar_values"] = {
        "topographie": int(_normalize_topographie(data.get("pente_moyenne_pct"))),
        "environnement": int(_normalize_environnement(
            data.get("zone_inondable_0_20"),
            data.get("zone_inondable_20_100"),
            data.get("contamination_statut"),
            data.get("mh_intersecte"),
        )),
        "reglementation": int(_normalize_reglementation(
            data.get("cos_max"),
            data.get("qc_hauteur_max_m"),
            data.get("hauteur_max_etages"),
            data.get("aire_verte_min_pct"),
        )),
        "foncier": int(_normalize_foncier(
            data.get("valeur_terrain"),
            data.get("valeur_totale"),
            data.get("superficie_m2"),
        )),
        "constructibilite": int(_normalize_constructibilite(
            data.get("superficie_m2"),
            data.get("cos_max"),
            data.get("nb_logements"),
        )),
        "fiabilite": int(_normalize_fiabilite(
            data.get("lidar_match_method"),
            data.get("lidar_source"),
            data.get("pente_moyenne_pct"),
            data.get("zone_code"),
        )),
    }

    json.dump(result, sys.stdout)


if __name__ == "__main__":
    main()
