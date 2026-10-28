"use client";

import React, { useState } from "react";
import { ChatAnswer } from "@/lib/ai/schemas";
import { Badge } from "@/components/ui/Badge";
import { Send, FileCode, AlertCircle, Sparkles, Loader2 } from "lucide-react";

interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  answerData?: ChatAnswer;
}

interface ChatPanelProps {
  repoUrl: string;
}

const STARTER_QUESTIONS = [
  "How is the application structured and what are the main entry points?",
  "What external dependencies and APIs are integrated in this codebase?",
  "How is error handling and validation implemented?",
  "Does this project include automated tests or CI/CD pipelines?",
];

export function ChatPanel({ repoUrl }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSend(questionText?: string) {
    const q = (questionText || inputQuestion).trim();
    if (!q || isLoading) return;

    setErrorMsg(null);
    setInputQuestion("");

    const userMessage: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: q,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/repository/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: repoUrl,
          question: q,
          history,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to receive answer.");
      }

      const answerData = data as ChatAnswer;
      const assistantMessage: ChatMessageItem = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: answerData.answer,
        answerData,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error contacting server.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and starter prompts */}
      {messages.length === 0 && (
        <div className="p-6 rounded border border-[#ebebeb] bg-white space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#171717]" />
            <h3 className="text-sm font-medium text-[#171717]">
              Ask questions grounded in the inspected codebase
            </h3>
          </div>
          <p className="text-xs text-[#666666] leading-relaxed">
            All answers cite evidence from retrieved repository files. If the requested information is not present in the inspected files, RepoPilot will explicitly state that evidence is insufficient.
          </p>

          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-mono text-[#8f8f8f] uppercase">
              Suggested Questions:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STARTER_QUESTIONS.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sq)}
                  disabled={isLoading}
                  className="p-2.5 text-left rounded border border-[#ebebeb] bg-[#fafafa] hover:bg-white hover:border-[#171717] transition-all text-xs text-[#4d4d4d] leading-normal"
                >
                  &ldquo;{sq}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Message List */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-5 rounded border ${
              msg.role === "user"
                ? "bg-[#fafafa] border-[#ebebeb]"
                : "bg-white border-[#ebebeb]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase text-[#8f8f8f]">
                {msg.role === "user" ? "You" : "▲ RepoPilot"}
              </span>

              {msg.answerData?.insufficientEvidence && (
                <Badge variant="warning">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Limited evidence in inspected files
                </Badge>
              )}
            </div>

            <div className="text-sm text-[#171717] leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </div>

            {/* Citations & Evidence Pills */}
            {msg.answerData?.evidence && msg.answerData.evidence.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#ebebeb] space-y-1.5">
                <span className="text-[10px] font-mono text-[#8f8f8f] uppercase">
                  Inspected File Citations:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {msg.answerData.evidence.map((ev, i) => (
                    <div
                      key={i}
                      title={ev.reason}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[#f5f5f5] text-[#4d4d4d] border border-[#ebebeb]"
                    >
                      <FileCode className="w-3 h-3 text-[#8f8f8f]" />
                      <span>{ev.path}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="p-4 rounded border border-[#ebebeb] bg-white flex items-center gap-2 text-xs font-mono text-[#666666]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Consulting repository files and synthesizing evidence-grounded answer...</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded border border-[#fae29c] bg-[#fff9e6] text-xs text-[#7d5700] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Input box */}
      <div className="p-4 rounded border border-[#ebebeb] bg-white space-y-3">
        <textarea
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about the repository (e.g. How is routing handled?)..."
          rows={3}
          disabled={isLoading}
          className="w-full text-sm font-mono p-3 bg-white border border-[#ebebeb] rounded text-[#171717] placeholder-[#a8a8a8] focus:border-[#171717] focus:outline-none resize-none transition-colors"
        />
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-mono text-[#8f8f8f]">
            Press Enter to send, Shift+Enter for new line
          </span>
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputQuestion.trim()}
            className="px-4 py-2 bg-[#171717] text-white text-xs font-medium rounded hover:bg-[#000000] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3 h-3" />
            Send Question
          </button>
        </div>
      </div>
    </div>
  );
}

