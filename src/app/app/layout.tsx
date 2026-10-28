import React from "react";
import { Metadata } from "next";
import { SessionProvider } from "@/context/SessionContext";
import { AppShellContainer } from "@/components/shell/AppShellContainer";

export const metadata: Metadata = {
  title: "RepoPilot — Workspace",
  description: "Repository exploration and blueprint workspace",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AppShellContainer>{children}</AppShellContainer>
    </SessionProvider>
  );
}

