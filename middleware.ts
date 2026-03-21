import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Rate limiting in-memory (par IP, 30 req/min sur les routes API)
// Adapté au déploiement Vercel Serverless — mémoire non partagée entre
// instances, donc le rate limiting est "best-effort" par isolat.
// ---------------------------------------------------------------------------

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 30; // max requêtes par fenêtre

interface Entry {
  count: number;
  resetAt: number;
}

const ipMap = new Map<string, Entry>();

// Nettoyage périodique pour éviter les fuites mémoire
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60_000; // 5 minutes

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [ip, entry] of ipMap) {
    if (now > entry.resetAt) ipMap.delete(ip);
  }
}

function isRateLimited(ip: string): { limited: boolean; remaining: number } {
  cleanup();

  const now = Date.now();
  const entry = ipMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false, remaining: MAX_REQUESTS - 1 };
  }

  entry.count++;
  const remaining = Math.max(0, MAX_REQUESTS - entry.count);

  if (entry.count > MAX_REQUESTS) {
    return { limited: true, remaining: 0 };
  }

  return { limited: false, remaining };
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting uniquement sur /api/*
  if (pathname.startsWith("/api/")) {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0].trim() || request.ip || "unknown";

    const { limited, remaining } = isRateLimited(ip);

    if (limited) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans quelques instants." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": String(MAX_REQUESTS),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

    // Ajouter les headers de rate limit à la réponse
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS));
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
