// src/types/supabase.ts
export interface Document {
  id: string;
  user_id?: string;
  file_name: string;
  storage_url: string;
  upload_date: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface DocumentAnalysis {
  id: string;
  document_id: string;
  document_category: string;
  confidence_percentage: number;
  ai_summary: string;
  processed_at: string;
}

export interface ExtractedMetadata {
  id: string;
  document_id: string;
  field_name: string;
  field_value: string;
  confidence: number;
}

export interface DocumentDerivation {
  id: string;
  document_id: string;
  target_area: string;
  derivation_reason: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  created_at: string;
}
