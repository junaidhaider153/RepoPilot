"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ChatMessageItem } from "@/components/chat/ChatPanel";
import { GeneratedDocumentsResult } from "@/lib/documents/generate-documents";
import { InnovationOpportunity } from "@/lib/ai/schemas";
import { GeneratedBlueprintResult } from "@/lib/innovation/generate-blueprint";

export interface SessionWorkspaceContextType {
  sessionId: string;
  repoUrl: string;
  messages: ChatMessageItem[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageItem[]>>;
  documentsData: GeneratedDocumentsResult | null;
  setDocumentsData: React.Dispatch<React.SetStateAction<GeneratedDocumentsResult | null>>;
  opportunities: InnovationOpportunity[] | null;
  setOpportunities: React.Dispatch<React.SetStateAction<InnovationOpportunity[] | null>>;
  selectedOpportunity: InnovationOpportunity | null;
  setSelectedOpportunity: React.Dispatch<React.SetStateAction<InnovationOpportunity | null>>;
  blueprintResult: GeneratedBlueprintResult | null;
  setBlueprintResult: React.Dispatch<React.SetStateAction<GeneratedBlueprintResult | null>>;
  selectedIndex: number;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
  isLoaded: boolean;
  refreshFromBackend: () => Promise<void>;
}

const SessionWorkspaceContext = createContext<SessionWorkspaceContextType | null>(null);

export function SessionWorkspaceProvider({
  sessionId,
  repoUrl,
  children,
}: {
  sessionId: string;
  repoUrl: string;
  children: React.ReactNode;
}) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [documentsData, setDocumentsData] = useState<GeneratedDocumentsResult | null>(null);
  const [opportunities, setOpportunities] = useState<InnovationOpportunity[] | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<InnovationOpportunity | null>(null);
  const [blueprintResult, setBlueprintResult] = useState<GeneratedBlueprintResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshFromBackend = useCallback(async () => {
    if (!sessionId) return;

    try {
      // 1. Fetch messages
      const msgRes = await fetch(`/api/sessions/${sessionId}/messages`);
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        if (msgData.messages && Array.isArray(msgData.messages)) {
          setMessages(
            msgData.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              answerData:
                m.role === "assistant"
                  ? {
                      answer: m.content,
                      evidence: m.evidence_json || [],
                      confidence: m.confidence || "medium",
                      insufficientEvidence: false,
                    }
                  : undefined,
              created_at: m.created_at,
            }))
          );
        }
      }

      // 2. Fetch documents
      const docRes = await fetch(`/api/sessions/${sessionId}/documents`);
      if (docRes.ok) {
        const docData = await docRes.json();
        if (docData.documents && Array.isArray(docData.documents) && docData.documents.length > 0) {
          const docs = docData.documents;
          const prdDoc = docs.find((d: any) => d.kind === "prd");
          const trdDoc = docs.find((d: any) => d.kind === "trd");
          const tddDoc = docs.find((d: any) => d.kind === "tdd");
          const promptDoc = docs.find((d: any) => d.kind === "prompt");

          setDocumentsData({
            markdown: {
              prd: prdDoc?.content_md || "",
              trd: trdDoc?.content_md || "",
              tdd: tddDoc?.content_md || "",
              prompt: promptDoc?.content_md || "",
              fullBundle: [
                prdDoc?.content_md,
                trdDoc?.content_md,
                tddDoc?.content_md,
                promptDoc?.content_md,
              ]
                .filter(Boolean)
                .join("\n\n---\n\n"),
            },
            spec: {
              projectName: "Project Specification",
              coreConcept: "",
              targetAudience: [],
              keyDifferentiators: [],
              suggestedStack: [],
              coreCapabilities: [],
            },
            documents: {
              prd: { title: "PRD", tagline: "", problemStatement: "", targetUsers: [], goals: [], userStories: [], acceptanceCriteria: [] },
              trd: { title: "TRD", technologyStack: [], architecturePattern: "", constraintsAndLimits: [], securityAndPrivacy: [], testingStrategy: [] },
              tdd: { title: "TDD", components: [], dataModels: [], requestFlows: [], risksAndMitigations: [] },
              codingAgentPrompt: promptDoc?.content_md || "",
            },
            referenceRepo: repoUrl,
          });
        }
      }

      // 3. Fetch blueprint
      const bpRes = await fetch(`/api/sessions/${sessionId}/blueprint`);
      if (bpRes.ok) {
        const bpData = await bpRes.json();
        if (bpData.blueprint) {
          const bp = bpData.blueprint;
          if (bp.opportunities_json && Array.isArray(bp.opportunities_json) && bp.opportunities_json.length > 0) {
            setOpportunities(bp.opportunities_json as InnovationOpportunity[]);
            const sIdx = bp.selected_index || 0;
            setSelectedIndex(sIdx);
            setSelectedOpportunity(bp.opportunities_json[sIdx] || bp.opportunities_json[0]);
          }
          if (bp.plan_json) {
            setBlueprintResult(bp.plan_json as GeneratedBlueprintResult);
          }
        }
      }
    } catch {
      // Ignore network errors on restore
    } finally {
      setIsLoaded(true);
    }
  }, [sessionId, repoUrl]);

  useEffect(() => {
    refreshFromBackend();
  }, [refreshFromBackend]);

  const value = {
    sessionId,
    repoUrl,
    messages,
    setMessages,
    documentsData,
    setDocumentsData,
    opportunities,
    setOpportunities,
    selectedOpportunity,
    setSelectedOpportunity,
    blueprintResult,
    setBlueprintResult,
    selectedIndex,
    setSelectedIndex,
    isLoaded,
    refreshFromBackend,
  };

  return (
    <SessionWorkspaceContext.Provider value={value}>
      {children}
    </SessionWorkspaceContext.Provider>
  );
}

export function useSessionWorkspace() {
  const ctx = useContext(SessionWorkspaceContext);
  if (!ctx) {
    throw new Error("useSessionWorkspace must be used within a SessionWorkspaceProvider");
  }
  return ctx;
}

export function useSessionWorkspaceOptional() {
  return useContext(SessionWorkspaceContext);
}

