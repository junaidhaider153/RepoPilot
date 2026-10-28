// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Dropdown } from "@/components/ui/Dropdown";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { ModelBadge } from "@/components/ui/ModelBadge";

describe("UI Primitives - Module 9", () => {
  describe("Button Component", () => {
    it("renders children and handles click events", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Run Analysis</Button>);

      const btn = screen.getByRole("button", { name: "Run Analysis" });
      expect(btn).toBeDefined();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("renders loading state with disabled button and spinner", () => {
      render(<Button isLoading>Generating</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveProperty("disabled", true);
      expect(screen.getByText("Generating")).toBeDefined();
    });

    it("applies correct variant classes", () => {
      const { container } = render(<Button variant="danger">Delete</Button>);
      expect(container.firstChild).toHaveProperty("className");
      const className = (container.firstChild as HTMLElement).className;
      expect(className).toContain("text-[#dc2626]");
    });
  });

  describe("Input Component", () => {
    it("renders label, placeholder, and helper text", () => {
      render(
        <Input
          id="repo-input"
          label="Repository URL"
          placeholder="https://github.com/org/repo"
          helperText="Public repositories only"
        />
      );

      expect(screen.getByLabelText("Repository URL")).toBeDefined();
      expect(screen.getByPlaceholderText("https://github.com/org/repo")).toBeDefined();
      expect(screen.getByText("Public repositories only")).toBeDefined();
    });

    it("renders error state with aria-describedby and role=alert", () => {
      render(
        <Input
          id="err-input"
          label="Email"
          error="Invalid email address"
        />
      );

      const errElement = screen.getByRole("alert");
      expect(errElement.textContent).toBe("Invalid email address");
      const input = screen.getByLabelText("Email");
      expect(input.getAttribute("aria-invalid")).toBe("true");
    });
  });

  describe("Modal Component", () => {
    it("renders when open and triggers onClose on Escape", () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Confirm Deletion">
          <p>Are you sure you want to delete this session?</p>
        </Modal>
      );

      expect(screen.getByRole("dialog")).toBeDefined();
      expect(screen.getByText("Confirm Deletion")).toBeDefined();
      expect(screen.getByText("Are you sure you want to delete this session?")).toBeDefined();

      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("does not render when isOpen is false", () => {
      render(
        <Modal isOpen={false} onClose={vi.fn()} title="Closed Modal">
          <p>Hidden Content</p>
        </Modal>
      );

      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  describe("Dropdown Component", () => {
    it("toggles menu and fires item action on click", () => {
      const handleAction = vi.fn();
      render(
        <Dropdown
          trigger={<button>Options</button>}
          items={[
            { id: "rename", label: "Rename Session", onClick: handleAction },
            { id: "delete", label: "Delete Session", onClick: vi.fn(), danger: true },
          ]}
        />
      );

      // Trigger button
      const triggerBtn = screen.getByRole("button", { name: "Options" });
      expect(screen.queryByRole("menu")).toBeNull();

      // Open dropdown
      fireEvent.click(triggerBtn);
      expect(screen.getByRole("menu")).toBeDefined();

      // Click item
      const item = screen.getByText("Rename Session");
      fireEvent.click(item);
      expect(handleAction).toHaveBeenCalledTimes(1);
      // Menu should close after action
      expect(screen.queryByRole("menu")).toBeNull();
    });
  });

  describe("Skeleton & Card Components", () => {
    it("renders skeleton placeholder with pulse animation", () => {
      const { container } = render(<Skeleton className="h-6 w-32" />);
      const el = container.firstChild as HTMLElement;
      expect(el.className).toContain("animate-pulse");
      expect(el.className).toContain("bg-[#ebebeb]");
    });

    it("renders card structure with header and content", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Session Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p>3 analysis modules loaded.</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText("Session Summary")).toBeDefined();
      expect(screen.getByText("3 analysis modules loaded.")).toBeDefined();
    });
  });

  describe("Tabs Component", () => {
    it("switches active tab on click", () => {
      const handleTabChange = vi.fn();
      const mockTabs = [
        { id: "overview", label: "01 / Overview" },
        { id: "chat", label: "02 / Chat" },
      ];

      render(
        <Tabs
          tabs={mockTabs}
          activeTab="overview"
          onChange={handleTabChange}
        />
      );

      expect(screen.getByText("01 / Overview")).toBeDefined();
      const chatTab = screen.getByRole("tab", { name: "02 / Chat" });
      fireEvent.click(chatTab);
      expect(handleTabChange).toHaveBeenCalledWith("chat");
    });
  });

  describe("ModelBadge Component", () => {
    it("renders active Gemma/Gemini badge accurately", () => {
      render(<ModelBadge modelName="gemini-flash-lite-latest" />);
      expect(screen.getByText("gemini-flash-lite-latest")).toBeDefined();
    });
  });
});
