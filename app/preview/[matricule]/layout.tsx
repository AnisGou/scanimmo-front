import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ matricule: string }>;
}): Promise<Metadata> {
  const { matricule } = await params;

  let adresse = `Matricule ${matricule}`;
  let municipalite = "Qu\u00e9bec";

  try {
    if (supabaseUrl && supabaseAnonKey) {
      const sb = createClient(supabaseUrl, supabaseAnonKey);
      const { data } = await sb
        .from("properties")
        .select("adresse, municipalite")
        .eq("matricule", matricule)
        .single();
      if (data?.adresse) adresse = data.adresse;
      if (data?.municipalite) municipalite = data.municipalite;
    }
  } catch {
    // Fallback to matricule-based title
  }

  const title = `${adresse} \u2014 Analyse fonci\u00e8re`;
  const description = `Rapport Scanimmo pour ${adresse}, ${municipalite}. Score, zonage, topographie, contraintes, proximit\u00e9 et d\u00e9favorisation.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
