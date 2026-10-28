// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Composer } from "@/components/chat/Composer";
import { FileDrawer } from "@/components/chat/FileDrawer";
import { ProgressStepper, StepItem } from "@/components/chat/ProgressStepper";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ToastProvider } from "@/components/ui/Toast";

// Mock scrollIntoView for jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe("Module 13: Chat Upgrade Components", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe("Composer Component", () => {
    it("renders textarea, character counter, and send button", () => {
      const onSend = vi.fn();
      const onChange = vi.fn();

      render(
        <Composer
          value=""
          onChange={onChange}
          onSend={onSend}
          placeholder="Ask a question..."
        />
      );

      expect(screen.getByPlaceholderText("Ask a question...")).toBeDefined();
      expect(screen.getByText("1000 / 1000")).toBeDefined();
      const sendBtn = screen.getByRole("button", { name: "Send question" });
      expect(sendBtn.hasAttribute("disabled")).toBe(true);
    });

    it("enables send button when text is entered and limits at 1000 chars", () => {
      const onSend = vi.fn();
      const onChange = vi.fn();

      const { rerender } = render(
        <Composer value="Hello repo" onChange={onChange} onSend={onSend} />
      );

      expect(screen.getByText("990 / 1000")).toBeDefined();
      const sendBtn = screen.getByRole("button", { name: "Send question" });
      expect(sendBtn.hasAttribute("disabled")).toBe(false);

      fireEvent.click(sendBtn);
      expect(onSend).toHaveBeenCalledWith("Hello repo");

      // Test exceeding limit
      const longText = "a".repeat(1005);
      rerender(<Composer value={longText} onChange={onChange} onSend={onSend} />);
      expect(screen.getByText("-5 / 1000")).toBeDefined();
      const disabledSendBtn = screen.getByRole("button", { name: "Send question" });
      expect(disabledSendBtn.hasAttribute("disabled")).toBe(true);
    });

    it("triggers onSend on Enter (without Shift) and preserves Shift+Enter newline", () => {
      const onSend = vi.fn();
      const onChange = vi.fn();

      render(
        <Composer value="Analyze architecture" onChange={onChange} onSend={onSend} />
      );

      const textarea = screen.getByRole("textbox");

      // Shift+Enter should not send
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
      expect(onSend).not.toHaveBeenCalled();

      // Enter alone should send
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
      expect(onSend).toHaveBeenCalledWith("Analyze architecture");
    });

    it("renders stop button when loading and fires onStop", () => {
      const onStop = vi.fn();

      render(
        <Composer
          value="Wait for me"
          onChange={vi.fn()}
          onSend={vi.fn()}
          onStop={onStop}
          isLoading={true}
        />
      );

      const stopBtn = screen.getByRole("button", { name: "Stop generation" });
      expect(stopBtn).toBeDefined();
      fireEvent.click(stopBtn);
      expect(onStop).toHaveBeenCalledTimes(1);
    });

    it("preserves draft to sessionStorage per sessionId", () => {
      const onChange = vi.fn();

      render(
        <Composer
          value="My draft question"
          onChange={onChange}
          onSend={vi.fn()}
          sessionId="session-xyz"
        />
      );

      expect(window.sessionStorage.getItem("repopilot_draft_session-xyz")).toBe("My draft question");
    });
  });

  describe("FileDrawer Component", () => {
    const mockEvidence = {
      path: "src/server/auth.ts",
      reason: "Defines JWT session validation logic",
      excerpt: "export function verifySession(token: string) { return true; }",
    };

    it("renders file details, reason, excerpt, and GitHub link when open", () => {
      const onClose = vi.fn();

      render(
        <FileDrawer
          isOpen={true}
          onClose={onClose}
          evidence={mockEvidence}
          repoUrl="https://github.com/acme/project"
        />
      );

      expect(screen.getByText("src/server/auth.ts")).toBeDefined();
      expect(screen.getByText("Defines JWT session validation logic")).toBeDefined();
      expect(screen.getByText(/verifySession/)).toBeDefined();
      const link = screen.getByText("View on GitHub").closest("a");
      expect(link?.getAttribute("href")).toBe(
        "https://github.com/acme/project/blob/main/src/server/auth.ts"
      );
    });

    it("closes on close button click and escape key", () => {
      const onClose = vi.fn();

      const { rerender } = render(
        <FileDrawer
          isOpen={true}
          onClose={onClose}
          evidence={mockEvidence}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Close evidence inspector" }));
      expect(onClose).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(2);

      rerender(<FileDrawer isOpen={false} onClose={onClose} evidence={mockEvidence} />);
      expect(screen.queryByText("src/server/auth.ts")).toBeNull();
    });

    it("displays notice when file excerpt was not cached", () => {
      render(
        <FileDrawer
          isOpen={true}
          onClose={vi.fn()}
          evidence={{
            path: "package.json",
            reason: "Lists dependencies",
          }}
        />
      );

      expect(
        screen.getByText("Full file excerpt was not cached in the bounded context snapshot.")
      ).toBeDefined();
    });
  });

  describe("ProgressStepper Component", () => {
    const steps: StepItem[] = [
      { id: "1", label: "Check bounded context", status: "completed" },
      { id: "2", label: "Synthesize response with Gemma", status: "active" },
      { id: "3", label: "Validate output", status: "pending" },
    ];

    it("renders all steps with polite live announcement", () => {
      render(<ProgressStepper steps={steps} />);

      const statusRegion = screen.getByRole("status");
      expect(statusRegion.getAttribute("aria-live")).toBe("polite");

      expect(screen.getByText("Check bounded context")).toBeDefined();
      expect(screen.getByText("Synthesize response with Gemma")).toBeDefined();
      expect(screen.getByText("Validate output")).toBeDefined();
    });
  });

  describe("MarkdownRenderer Component", () => {
    it("renders headings, code blocks, lists, and inline styles safely", () => {
      const markdown = `
### Architecture Overview
This is **critical** and *verified*.
Here is \`inlineConfig\`.

\`\`\`typescript
const auth = true;
\`\`\`

- Item 1
- Item 2

[Repo Link](https://github.com/example)
`;

      render(<MarkdownRenderer content={markdown} />);

      const heading = screen.getByRole("heading", { level: 4 });
      expect(heading.textContent).toContain("Architecture Overview");
      expect(screen.getByText("critical")).toBeDefined();
      expect(screen.getByText("inlineConfig")).toBeDefined();
      expect(screen.getByText("const auth = true;")).toBeDefined();
      expect(screen.getByText("Item 1")).toBeDefined();
      const link = screen.getByRole("link", { name: "Repo Link" });
      expect(link.getAttribute("href")).toBe("https://github.com/example");
    });

    it("sanitizes unsafe javascript links", () => {
      const markdown = `[Malicious Link](javascript:alert(1))`;
      render(<MarkdownRenderer content={markdown} />);
      expect(screen.queryByRole("link")).toBeNull();
      expect(screen.getByText("Malicious Link")).toBeDefined();
    });
  });

  describe("ChatPanel Integration", () => {
    it("renders starter questions and dispatches query on click", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          answer: "The application uses Next.js app router.",
          evidence: [
            { path: "src/app/page.tsx", reason: "Home page entry point", excerpt: "export default function Page() {}" },
          ],
          confidence: "high",
          insufficientEvidence: false,
        }),
      });
      global.fetch = mockFetch;

      render(
        <ToastProvider>
          <ChatPanel repoUrl="https://github.com/test/repo" sessionId="sess-1" />
        </ToastProvider>
      );

      // Verify starter questions appear
      const starterBtn = screen.getByText(
        /How is the application structured and what are the main entry points\?/
      );
      expect(starterBtn).toBeDefined();

      fireEvent.click(starterBtn);

      await waitFor(() => {
        expect(screen.getByText("The application uses Next.js app router.")).toBeDefined();
      });

      expect(screen.getByText("Confidence: high")).toBeDefined();
      expect(screen.getByText("src/app/page.tsx")).toBeDefined();

      // Click evidence pill to open file drawer
      fireEvent.click(screen.getByText("src/app/page.tsx"));
      expect(screen.getByRole("dialog", { name: "Evidence File Inspector" })).toBeDefined();
      expect(screen.getByText("Home page entry point")).toBeDefined();
    });

    it("displays error with Retry button on server failure", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { message: "AI rate limit reached. Please wait 10s." },
        }),
      });
      global.fetch = mockFetch;

      render(
        <ToastProvider>
          <ChatPanel repoUrl="https://github.com/test/repo" />
        </ToastProvider>
      );

      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "Where is auth defined?" } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      await waitFor(() => {
        expect(screen.getAllByText("AI rate limit reached. Please wait 10s.")[0]).toBeDefined();
      });

      const retryBtn = screen.getByRole("button", { name: /Retry/i });
      expect(retryBtn).toBeDefined();
    });
  });
});
