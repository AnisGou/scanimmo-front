// ⚠ AUTO-GENERATED then TRIMMED — ne pas modifier manuellement
// Contient uniquement les tables/vues/fonctions utilisees par le frontend
// Source complete : npx supabase gen types typescript --db-url "$DATABASE_URL" --schema public

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          matricule: string
          code_municipalite: string
          adresse: string | null
          latitude: number | null
          longitude: number | null
          zone_code: string | null
          annee_construction: string | null
          nb_etages: number | null
          nb_logements: number | null
          nb_batiments: number | null
          superficie_m2: number | null
          superficie_batiment_m2: number | null
          front_m: number | null
          ces_reel: number | null
          valeur_totale: number | null
          valeur_terrain: number | null
          valeur_batiment: number | null
          valeur_anterieure: number | null
          cos_max: number | null
          hauteur_max_etages: number | null
          aire_verte_min_pct: number | null
          surface_constructible_pct: number | null
          qc_code_zone: string | null
          qc_dominante: string | null
          qc_dominante_label: string | null
          qc_type_milieu: string | null
          qc_hauteur_max_m: number | null
          qc_densite_min_logha: number | null
          zone_municipal_code: string | null
          zone_source: string | null
          pente_moyenne_pct: number | null
          denivele_moyen_m: number | null
          elevation_min_m: number | null
          elevation_max_m: number | null
          lidar_match_method: string | null
          lidar_match_distance_m: number | null
          lidar_source: string | null
          lidar_year: number | null
          lidar_obsolete: boolean | null
          contamination_statut: string | null
          gtc_id: string | null
          distance_gtc_m: number | null
          zone_inondable_0_20: boolean | null
          zone_inondable_20_100: boolean | null
          mh_intersecte: boolean | null
          mh_distance_m: number | null
          est_agricole: boolean | null
          score_scanimmo: number | null
          numero_lot: string | null
        }
        Insert: {
          id?: string
          matricule: string
          code_municipalite: string
          adresse?: string | null
          latitude?: number | null
          longitude?: number | null
          zone_code?: string | null
          annee_construction?: string | null
          nb_etages?: number | null
          nb_logements?: number | null
          nb_batiments?: number | null
          superficie_m2?: number | null
          superficie_batiment_m2?: number | null
          front_m?: number | null
          ces_reel?: number | null
          valeur_totale?: number | null
          valeur_terrain?: number | null
          valeur_batiment?: number | null
          valeur_anterieure?: number | null
          cos_max?: number | null
          hauteur_max_etages?: number | null
          aire_verte_min_pct?: number | null
          surface_constructible_pct?: number | null
          qc_code_zone?: string | null
          qc_dominante?: string | null
          qc_dominante_label?: string | null
          qc_type_milieu?: string | null
          qc_hauteur_max_m?: number | null
          qc_densite_min_logha?: number | null
          zone_municipal_code?: string | null
          zone_source?: string | null
          pente_moyenne_pct?: number | null
          denivele_moyen_m?: number | null
          elevation_min_m?: number | null
          elevation_max_m?: number | null
          lidar_match_method?: string | null
          lidar_match_distance_m?: number | null
          lidar_source?: string | null
          lidar_year?: number | null
          lidar_obsolete?: boolean | null
          contamination_statut?: string | null
          gtc_id?: string | null
          distance_gtc_m?: number | null
          zone_inondable_0_20?: boolean | null
          zone_inondable_20_100?: boolean | null
          mh_intersecte?: boolean | null
          mh_distance_m?: number | null
          est_agricole?: boolean | null
          score_scanimmo?: number | null
          numero_lot?: string | null
        }
        Update: {
          id?: string
          matricule?: string
          code_municipalite?: string
          adresse?: string | null
          latitude?: number | null
          longitude?: number | null
          zone_code?: string | null
          annee_construction?: string | null
          nb_etages?: number | null
          nb_logements?: number | null
          nb_batiments?: number | null
          superficie_m2?: number | null
          superficie_batiment_m2?: number | null
          front_m?: number | null
          ces_reel?: number | null
          valeur_totale?: number | null
          valeur_terrain?: number | null
          valeur_batiment?: number | null
          valeur_anterieure?: number | null
          cos_max?: number | null
          hauteur_max_etages?: number | null
          aire_verte_min_pct?: number | null
          surface_constructible_pct?: number | null
          qc_code_zone?: string | null
          qc_dominante?: string | null
          qc_dominante_label?: string | null
          qc_type_milieu?: string | null
          qc_hauteur_max_m?: number | null
          qc_densite_min_logha?: number | null
          zone_municipal_code?: string | null
          zone_source?: string | null
          pente_moyenne_pct?: number | null
          denivele_moyen_m?: number | null
          elevation_min_m?: number | null
          elevation_max_m?: number | null
          lidar_match_method?: string | null
          lidar_match_distance_m?: number | null
          lidar_source?: string | null
          lidar_year?: number | null
          lidar_obsolete?: boolean | null
          contamination_statut?: string | null
          gtc_id?: string | null
          distance_gtc_m?: number | null
          zone_inondable_0_20?: boolean | null
          zone_inondable_20_100?: boolean | null
          mh_intersecte?: boolean | null
          mh_distance_m?: number | null
          est_agricole?: boolean | null
          score_scanimmo?: number | null
          numero_lot?: string | null
        }
        Relationships: []
      }
      report_tokens: {
        Row: {
          id: string
          token: string
          report_id: string
          matricule: string
          tier: string
          customer_email: string
          pdf_filename: string
          pdf_storage_path: string
          created_at: string | null
          expires_at: string
          download_count: number | null
          downloaded_at: string | null
          last_downloaded_at: string | null
        }
        Insert: {
          id?: string
          token: string
          report_id: string
          matricule: string
          tier: string
          customer_email: string
          pdf_filename: string
          pdf_storage_path: string
          created_at?: string | null
          expires_at: string
          download_count?: number | null
          downloaded_at?: string | null
          last_downloaded_at?: string | null
        }
        Update: {
          id?: string
          token?: string
          report_id?: string
          matricule?: string
          tier?: string
          customer_email?: string
          pdf_filename?: string
          pdf_storage_path?: string
          created_at?: string | null
          expires_at?: string
          download_count?: number | null
          downloaded_at?: string | null
          last_downloaded_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          matricule: string
          property_id: string | null
          code_municipalite: string | null
          municipalite: string | null
          tier: string
          stripe_session_id: string
          stripe_payment_intent: string | null
          stripe_customer_id: string | null
          status: string
          amount_cents: number
          customer_email: string
          pdf_filename: string | null
          pdf_storage_path: string | null
          created_at: string | null
          paid_at: string | null
          ready_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          matricule: string
          property_id?: string | null
          code_municipalite?: string | null
          municipalite?: string | null
          tier: string
          stripe_session_id: string
          stripe_payment_intent?: string | null
          stripe_customer_id?: string | null
          status?: string
          amount_cents: number
          customer_email: string
          pdf_filename?: string | null
          pdf_storage_path?: string | null
          created_at?: string | null
          paid_at?: string | null
          ready_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          matricule?: string
          property_id?: string | null
          code_municipalite?: string | null
          municipalite?: string | null
          tier?: string
          stripe_session_id?: string
          stripe_payment_intent?: string | null
          stripe_customer_id?: string | null
          status?: string
          amount_cents?: number
          customer_email?: string
          pdf_filename?: string | null
          pdf_storage_path?: string | null
          created_at?: string | null
          paid_at?: string | null
          ready_at?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          id: string
          stripe_event_id: string
          event_type: string
          event_data: Json
          processed: boolean | null
          processed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          stripe_event_id: string
          event_type: string
          event_data: Json
          processed?: boolean | null
          processed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          stripe_event_id?: string
          event_type?: string
          event_data?: Json
          processed?: boolean | null
          processed_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      properties_access: {
        Row: {
          property_id: string
          ad_id: number | null
          da_uid: string | null
          nb_blocks: number | null
          idx_transit: number | null
          idx_epicerie: number | null
          idx_sante: number | null
          idx_parcs: number | null
          idx_educpri: number | null
          idx_garderie: number | null
          idx_pharma: number | null
          idx_emp: number | null
          idx_educsec: number | null
          idx_bibl: number | null
          access_score_0_100: number | null
          threshold_version: number | null
          source: string
          updated_at: string
        }
        Relationships: []
      }
      properties_analysis: {
        Row: {
          property_id: string
          type_terrain: string | null
          prix_terrain_pi2: number | null
          est_exploitable: boolean | null
          exclusion_reason: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_secure_token: {
        Args: Record<string, never>
        Returns: string
      }
      get_nearest_contamination_site: {
        Args: {
          p_lat: number
          p_lng: number
          p_radius_m?: number
        }
        Returns: unknown
      }
      get_permis_nearby: {
        Args: {
          p_lat: number
          p_lng: number
          p_radius_m?: number
        }
        Returns: unknown
      }
      get_property_defavorisation: {
        Args: {
          p_property_id: string
        }
        Returns: Json
      }
      search_properties_autocomplete: {
        Args: {
          q: string
          limit_n?: number
        }
        Returns: unknown
      }
    }
    Enums: {
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never