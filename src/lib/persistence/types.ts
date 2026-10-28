import { CompleteAnalysisResult } from "@/lib/analysis/analyze-repository";
import { EvidenceReference } from "@/lib/ai/schemas";

export interface DbSession {
  id: string;
  user_id: string;
  repo_url: string;
  owner: string;
  repo: string;
  title: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbRepoSnapshot {
  id: string;
  session_id: string;
  default_branch: string;
  selected_paths: string[];
  analysis_json: CompleteAnalysisResult;
  coverage_notes: string[];
  fetched_at: string;
}

export interface DbMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  evidence_json: EvidenceReference[];
  confidence: string;
  created_at: string;
}

export interface DbDocument {
  id: string;
  session_id: string;
  kind: "prd" | "trd" | "tdd" | "prompt" | "all";
  content_md: string;
  version: number;
  created_at: string;
}

export interface DbBlueprint {
  id: string;
  session_id: string;
  opportunities_json: unknown[];
  selected_index: number;
  plan_json: unknown;
  created_at: string;
}

export interface DbUsageEvent {
  id: string;
  user_id: string;
  route: string;
  created_at: string;
}
