"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatAnswer, EvidenceReference } from "@/lib/ai/schemas";
import { Badge } from "@/components/ui/Badge";
import {
  FileCode,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  ArrowDown,
  Info,
  Loader2,
} from "lucide-react";
import { Composer } from "./Composer";
import { FileDrawer } from "./FileDrawer";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useToast } from "@/components/ui/Toast";
import { useSessionWorkspaceOptional } from "@/context/SessionWorkspaceContext";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  answerData?: ChatAnswer;
  created_at?: string;
}

export interface ChatPanelProps {
  repoUrl: string;
  sessionId?: string;
}

const STARTER_QUESTIONS = [
  "How is the application structured and what are the main entry points?",
  "What external dependencies and APIs are integrated in this codebase?",
  "How is error handling and validation implemented?",
  "Does this project include automated tests or CI/CD pipelines?",
];

export function ChatPanel({ repoUrl, sessionId }: ChatPanelProps) {
  const workspace = useSessionWorkspaceOptional();
  const [localMessages, setLocalMessages] = useState<ChatMessageItem[]>([]);
  const messages = workspace ? workspace.messages : localMessages;
  const setMessages = workspace ? workspace.setMessages : setLocalMessages;

  const [inputQuestion, setInputQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);

  // Evidence Drawer state
  const [activeEvidence, setActiveEvidence] = useState<EvidenceReference | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Message action states
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Scroll anchoring states
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { toast } = useToast();

  // Load persisted messages if standalone without workspace provider
  useEffect(() => {
    if (workspace || !sessionId) return;
    let isMounted = true;

    fetch(`/api/sessions/${sessionId}/messages`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data?.messages || !Array.isArray(data.messages)) return;
        if (data.messages.length > 0) {
          setMessages(
            data.messages.map((m: any) => ({
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
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [sessionId, workspace, setMessages]);

  // Handle scroll detection for "Jump to latest"
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  }, []);

  const isInitialMount = useRef(true);

  // Auto-scroll on new messages if near bottom (do not auto-scroll on initial mount of empty chat)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (messages.length > 0 && !showScrollBottom) {
      scrollToBottom(false);
    }
  }, [messages.length, isLoading, showScrollBottom, scrollToBottom]);

  // Window/viewport scroll listener for "Jump to latest"
  useEffect(() => {
    const checkScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const scrollParent = el.closest(".overflow-y-auto") as HTMLElement | null;
      if (scrollParent) {
        const isNearBottom =
          scrollParent.scrollHeight - scrollParent.scrollTop - scrollParent.clientHeight < 120;
        setShowScrollBottom(!isNearBottom);
      } else {
        const isNearBottom =
          window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120;
        setShowScrollBottom(!isNearBottom);
      }
    };

    const scrollParent = containerRef.current?.closest(".overflow-y-auto");
    const target = scrollParent || window;
    target.addEventListener("scroll", checkScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", checkScroll);
    };
  }, []);

  // Send message
  async function handleSend(
    questionText?: string,
    mode: "new" | "retry" | "regenerate" = "new"
  ) {
    const q = (questionText || inputQuestion).trim();
    if (!q || isLoading) return;

    setErrorMsg(null);
    setLastFailedQuestion(null);
    if (mode === "new") {
      setInputQuestion("");
    }

    let history: Array<{ role: "user" | "assistant"; content: string }> = [];

    if (mode === "new") {
      const userMessage: ChatMessageItem = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "user",
        content: q,
        created_at: new Date().toISOString(),
      };
      history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      setMessages((prev) => [...prev, userMessage]);
    } else if (mode === "retry") {
      let lastUserIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          lastUserIndex = i;
          break;
        }
      }
      const historySlice = lastUserIndex >= 0 ? messages.slice(0, lastUserIndex) : [];
      history = historySlice.map((m) => ({
        role: m.role,
        content: m.content,
      }));
    } else if (mode === "regenerate") {
      let lastAsstIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "assistant") {
          lastAsstIndex = i;
          break;
        }
      }
      if (lastAsstIndex >= 0) {
        setMessages((prev) => prev.filter((_, idx) => idx !== lastAsstIndex));
      }
      let lastUserIndex = -1;
      for (let i = (lastAsstIndex >= 0 ? lastAsstIndex - 1 : messages.length - 1); i >= 0; i--) {
        if (messages[i].role === "user") {
          lastUserIndex = i;
          break;
        }
      }
      const historySlice = lastUserIndex >= 0 ? messages.slice(0, lastUserIndex) : [];
      history = historySlice.map((m) => ({
        role: m.role,
        content: m.content,
      }));
    }

    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/repository/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: repoUrl,
          question: q,
          history,
          sessionId,
        }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to receive answer.");
      }

      const answerData = data as ChatAnswer;
      const assistantMessage: ChatMessageItem = {
        id: `asst-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "assistant",
        content: answerData.answer,
        answerData,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        toast({
          title: "Generation stopped",
          message: "You aborted the response generation.",
          type: "info",
        });
      } else {
        const msg = err instanceof Error ? err.message : "Error contacting server.";
        setErrorMsg(msg);
        setLastFailedQuestion(q);
        toast({
          title: "Could not save message",
          message: msg,
          type: "error",
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }

  function handleStop() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }

  function handleRetry() {
    if (lastFailedQuestion) {
      handleSend(lastFailedQuestion, "retry");
    }
  }

  function handleRegenerate() {
    // Find the last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      handleSend(lastUserMsg.content, "regenerate");
    }
  }

  async function handleCopyMessage(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      toast({
        title: "Copied to clipboard",
        message: "Message content copied.",
        type: "info",
      });
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      toast({
        title: "Copy Failed",
        message: "Could not copy message to clipboard.",
        type: "error",
      });
    }
  }

  function openEvidenceDrawer(evidence: EvidenceReference) {
    setActiveEvidence(evidence);
    setIsDrawerOpen(true);
  }

  // Find index of the last assistant message
  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") {
      lastAssistantIndex = i;
      break;
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Scrollable messages container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="space-y-5"
      >
        {/* Starter questions if empty */}
        {messages.length === 0 && (
          <div className="p-6 rounded-lg border border-[#ebebeb] bg-white space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#171717]" />
              <h3 className="text-sm font-semibold text-[#171717]">
                Ask questions grounded in the inspected codebase
              </h3>
            </div>
            <p className="text-xs text-[#666666] leading-relaxed">
              Every answer cites evidence from inspected repository files. If the requested information is not present in the files, RepoPilot states that evidence is limited.
            </p>

            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-mono text-[#8f8f8f] uppercase font-medium">
                Suggested Questions:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STARTER_QUESTIONS.map((sq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(sq)}
                    disabled={isLoading}
                    className="p-3 text-left rounded-md border border-[#ebebeb] bg-[#fafafa] hover:bg-white hover:border-[#171717] transition-all text-xs text-[#333333] leading-relaxed group"
                  >
                    <span className="group-hover:text-[#171717] transition-colors">
                      &ldquo;{sq}&rdquo;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          const isLastAssistant = !isUser && index === lastAssistantIndex;

          return (
            <div
              key={msg.id}
              className={`group relative p-5 rounded-lg border transition-all ${
                isUser
                  ? "bg-[#fafafa] border-[#ebebeb]"
                  : "bg-white border-[#ebebeb] shadow-xs"
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase font-semibold text-[#8f8f8f]">
                    {isUser ? "You" : "▲ RepoPilot"}
                  </span>
                  {!isUser && msg.answerData?.confidence && (
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-[#ebebeb] bg-[#fafafa] text-[#666666]">
                      Confidence: {msg.answerData.confidence}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {msg.answerData?.insufficientEvidence && (
                    <Badge variant="warning">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Limited evidence in inspected files
                    </Badge>
                  )}

                  {/* Actions (visible on hover or focus) */}
                  <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      aria-label="Copy message text"
                      title="Copy message"
                      className="p-1 rounded text-[#8f8f8f] hover:text-[#171717] hover:bg-[#f0f0f0] transition-colors"
                    >
                      {copiedMessageId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-[#16a34a]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isLastAssistant && (
                      <button
                        type="button"
                        onClick={handleRegenerate}
                        disabled={isLoading}
                        aria-label="Regenerate answer"
                        title="Regenerate answer"
                        className="p-1 rounded text-[#8f8f8f] hover:text-[#171717] hover:bg-[#f0f0f0] transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Content */}
              {isUser ? (
                <div className="text-xs sm:text-sm text-[#171717] leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
              ) : (
                <MarkdownRenderer content={msg.content} />
              )}

              {/* Inspected File Citations & Evidence Pills */}
              {msg.answerData?.evidence && msg.answerData.evidence.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#f0f0f0] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8f8f8f] uppercase font-semibold">
                    <FileCode className="w-3 h-3 text-[#8f8f8f]" />
                    <span>Evidence Citations (Click to inspect file):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.answerData.evidence.map((ev, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => openEvidenceDrawer(ev)}
                        title={`Click to view file excerpt: ${ev.reason}`}
                        className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono bg-[#fafafa] hover:bg-[#f0f0f0] hover:border-[#171717] text-[#333333] border border-[#ebebeb] transition-all cursor-pointer text-left"
                      >
                        <FileCode className="w-3 h-3 text-[#666666]" />
                        <span className="underline decoration-[#d4d4d4] group-hover:decoration-[#171717]">
                          {ev.path}
                        </span>
                        {!ev.excerpt && (
                          <span className="text-[9px] text-[#8f8f8f] font-normal" title="File was identified in repository tree without cached content excerpt">
                            (tree)
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Honest Progress Indicator during loading */}
        {isLoading && (
          <div className="p-4 rounded-lg border border-[#ebebeb] bg-white flex items-center justify-between text-xs font-mono text-[#666666]">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-[#171717]" />
              <span>Analyzing repository context and synthesizing grounded answer...</span>
            </div>
            <button
              type="button"
              onClick={handleStop}
              className="text-xs text-[#8f8f8f] hover:text-[#171717] underline decoration-[#d4d4d4]"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Actionable Error State with Retry */}
        {errorMsg && (
          <div className="p-4 rounded-lg border border-[#fae29c] bg-[#fff9e6] text-xs text-[#7d5700] flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">{errorMsg}</p>
                <p className="text-[11px] text-[#996b00]">
                  You can retry the request or rephrase your question.
                </p>
              </div>
            </div>
            {lastFailedQuestion && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={isLoading}
                className="px-3 py-1 rounded bg-white border border-[#e0c268] text-[#7d5700] hover:bg-[#fff5d6] text-xs font-medium shrink-0 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating "Jump to latest" button */}
      {showScrollBottom && (
        <div className="sticky bottom-20 flex justify-center z-10">
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className="px-3 py-1.5 rounded-full bg-[#171717] text-white text-xs font-mono shadow-md hover:bg-black flex items-center gap-1.5 transition-all animate-bounce"
          >
            <ArrowDown className="w-3 h-3" />
            <span>Jump to latest</span>
          </button>
        </div>
      )}

      {/* Composer Input Area */}
      <Composer
        value={inputQuestion}
        onChange={setInputQuestion}
        onSend={(text) => handleSend(text)}
        onStop={handleStop}
        isLoading={isLoading}
        sessionId={sessionId || "guest"}
        placeholder="Ask a question about the repository (e.g. How is routing handled?)..."
      />

      {/* Slide-over File Drawer */}
      <FileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        evidence={activeEvidence}
        repoUrl={repoUrl}
      />
    </div>
  );
}
