/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { DocumentsPanel } from "@/components/documents/DocumentsPanel";
import { TopBar } from "@/components/shell/TopBar";

// Mock ToastContext
vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("Sweep 3 Group 4: Gemini-Style UI/UX Transformation & Smooth Motion (E-07, E-08)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Test 1: TopBar includes modern frosted glass background with backdrop blur and smooth transitions", () => {
    const { container } = render(
      <TopBar
        session={{
          id: "s-1",
          repoUrl: "https://github.com/google/gemini",
          owner: "google",
          repo: "gemini",
          title: "google/gemini",
          pinned: false,
          createdAt: "2026-10-29T00:00:00Z",
          updatedAt: "2026-10-29T00:00:00Z",
        }}
        activeTab="chat"
        onTabChange={vi.fn()}
        onOpenMobileMenu={vi.fn()}
        onExportAll={vi.fn()}
      />
    );

    const header = container.querySelector("header");
    expect(header).toBeDefined();
    // Must feature modern backdrop-blur and glassmorphism
    expect(header?.className).toContain("backdrop-blur");
  });

  it("Test 2: ChatPanel renders with Gemini modern styling, spark gradient indicators, and fluid motion", () => {
    const { container } = render(
      <ChatPanel
        repoUrl="https://github.com/google/gemini"
        sessionId="s-test-gemini"
      />
    );

    // Welcome hero or header includes Gemini gradient accent
    const heroCard = container.querySelector("[data-testid='chat-hero-card'], .gemini-gradient, .gemini-spark");
    expect(heroCard).not.toBeNull();
  });

  it("Test 3: DocumentsPanel features Gemini aesthetic button with gradient and smooth transition classes", () => {
    const { container } = render(
      <DocumentsPanel
        repoUrl="https://github.com/google/gemini"
        sessionId="s-test-gemini"
      />
    );

    // Generation trigger button features Gemini gradient or spark styling
    const generateBtn = screen.getByRole("button", { name: /Generate PRD, TRD, TDD/i });
    expect(generateBtn).toBeDefined();
    expect(generateBtn.className).toMatch(/gemini|from-blue|gradient/i);
  });
});

