/**
 * Composant SearchInput
 * @description Recherche par adresse ou matricule avec autocomplétion RPC
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Suggestion = {
  property_id: string;
  adresse: string;
  nom_municipalite: string;
  latitude: number | null;
  longitude: number | null;
};

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-gray-900">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function SearchInput() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sug, setSug] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSug, setShowSug] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce input (250ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Autocomplete RPC call
  useEffect(() => {
    if (debouncedQuery.trim().length < 3) {
      setSug([]);
      return;
    }

    let cancelled = false;

    supabase
      .rpc("search_properties_autocomplete", {
        q: debouncedQuery.trim(),
        limit_n: 6,
      })
      .then(({ data: rows, error: err }) => {
        if (cancelled) return;
        if (err) {
          console.error("[autocomplete] error:", err);
          setSug([]);
          return;
        }
        setSug(Array.isArray(rows) ? rows : []);
        setShowSug(true);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSug(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectSug = (s: Suggestion) => {
    setQuery(s.adresse);
    setSug([]);
    setShowSug(false);
    // Navigate via resolve API to get matricule for preview
    handleSearchDirect(s.adresse);
  };

  const handleSearchDirect = async (searchQuery: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Propriété non trouvée");
        setLoading(false);
        return;
      }

      if (data.results) {
        const first = data.results[0];
        router.push(`/preview/${first.matricule}`);
        return;
      }

      router.push(`/preview/${data.matricule}`);
    } catch (err) {
      setError("Erreur de recherche");
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowSug(false);

    if (query.trim().length < 3) {
      setError("Minimum 3 caractères");
      return;
    }

    await handleSearchDirect(query);
  };

  return (
    <div ref={wrapperRef} className="w-full max-w-2xl relative">
      <form onSubmit={handleSearch}>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSug(true);
            }}
            onFocus={() => sug.length > 0 && setShowSug(true)}
            placeholder="Adresse ou matricule cadastral..."
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
            disabled={loading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "..." : "Analyser"}
          </button>
        </div>
      </form>

      {/* Autocomplete dropdown */}
      {showSug && sug.length > 0 && (
        <ul className="absolute z-50 left-0 right-16 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-auto">
          {sug.map((s) => (
            <li
              key={s.property_id}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onMouseDown={() => selectSug(s)}
            >
              <div className="text-sm font-medium text-gray-900">
                <HighlightMatch text={s.adresse} query={debouncedQuery} />
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Mun. {s.nom_municipalite}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
