export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  role: 'admin' | 'handler' | 'viewer';
  is_active: boolean;
  created_at: string;
}

export interface Case {
  id: number;
  case_number: string;
  claim_number?: string;
  policy_number?: string;
  status: 'new' | 'in_progress' | 'pending_review' | 'approved' | 'rejected' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sla_risk: 'none' | 'low' | 'medium' | 'high';
  incident_date?: string;
  report_date?: string;
  due_date?: string;
  closed_date?: string;
  assigned_to_id?: number;
  claimant_name?: string;
  claimant_contact?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  schade_oorzaak?: string;
  product?: string;
  claim_amount?: number;
  estimated_reserve?: number;
  created_at: string;
  updated_at?: string;
  is_uitgelicht?: boolean;
  signal_count?: number;
  urgent_signal_count?: number;
  uitgelicht_reason?: string;
}

export interface Signal {
  id: number;
  case_id: number;
  category: 'communicatie' | 'taken' | 'datakwaliteit' | 'financieel' | 'proces';
  severity: 'info' | 'warning' | 'error' | 'critical' | 'urgent';
  title: string;
  description?: string;
  deadline?: string;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by_id?: number;
  action_type?: string;
  action_data?: string;
  action_notes?: string;
  action_taken_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface TimelineEntry {
  id: number;
  case_id: number;
  event_type: string;
  title: string;
  description?: string;
  created_by_id?: number;
  created_by_name?: string;
  created_at: string;
}

export interface Behandelplan {
  id: number;
  case_id: number;
  
  // Dossierverloop
  toedracht?: string;
  causaliteitsvraag?: string;
  dekking?: boolean;
  percentage_aansprakelijkheid?: number;
  datum_aansprakelijkheid?: string;
  percentage_eigen_schuld?: number;
  regres_mogelijk?: boolean;
  alle_of_niets_dossier?: boolean;
  
  // Medische informatie
  letselsoort?: string;
  letselspecificatie?: string;
  letsel_zijde?: string;
  dominante_zijde_beinvloedt?: boolean;
  klachten?: string;
  diagnose?: string;
  beperkingen?: string;
  bijzonderheden_pre_existente?: boolean;
  hersteld?: boolean;
  datum_eindsituatie?: string;
  medisch_advies?: string;
  
  // Arbeidsongeschiktheid & Werk
  beroep?: string;
  dienstverband?: string;
  omvang_dienstverband?: number;
  netto_inkomen?: number;
  nu_arbeidsongeschikt?: boolean;
  percentage_arbeidsongeschikt?: number;
  arbeidsongeschiktheid_startdatum?: string;
  arbeidsongeschiktheid_einddatum?: string;
  interventies?: string;
  prognose?: string;
  arbeid_overweging?: string;
  
  // Privesituatie & Sociale omstandigheden
  samenstelling_huishouden?: string;
  aantal_kinderen?: number;
  aandeel_huishoudelijke_taken?: number;
  aandeel_zelfwerkzaamheid?: number;
  nu_beperkt?: boolean;
  sociaal_startdatum?: string;
  sociaal_overweging?: string;
  
  // Strategie & Scenario
  reden_lopend_dossier?: string;
  oplossingsrichting?: string;
  scenarios?: string;
  vervolgstappen?: string;
  motivering?: string;
  
  // AI Generated Summaries
  ai_summary_dossierverloop?: string;
  ai_summary_medisch?: string;
  ai_summary_arbeid?: string;
  ai_summary_sociaal?: string;
  ai_summary_strategie?: string;
  ai_summary_overall?: string;
  
  // Legacy fields
  treatment_plan?: string;
  expected_duration_days?: number;
  start_date?: string;
  expected_end_date?: string;
  actual_end_date?: string;
  provider_name?: string;
  provider_contact?: string;
  provider_specialty?: string;
  is_approved?: boolean;
  approved_date?: string;
  notes?: string;
  
  created_at: string;
  updated_at?: string;
}

export interface Reserve {
  id: number;
  case_id: number;
  reserve_type: 'initial' | 'revision' | 'final';
  amount: number;
  currency: string;
  effective_date: string;
  reason?: string;
  notes?: string;
  created_by_name?: string;
  created_at: string;
}

export interface ComparableCase {
  id: number;
  case_id: number;
  reference_case_number?: string;
  reference_case_id?: number;
  similarity_score?: number;
  similarity_factors?: string;
  summary?: string;
  outcome?: string;
  settlement_amount?: number;
  notes?: string;
  created_at: string;
}
