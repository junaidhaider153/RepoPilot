"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface CodeBlockProps {
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  }

  return (
    <div className="my-3 rounded border border-[#ebebeb] bg-[#fafafa] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#ebebeb] bg-[#f0f0f0] text-[11px] font-mono text-[#666666]">
        <span className="uppercase">{language || "text"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] text-[#666666] hover:text-[#171717] px-2 py-0.5 rounded transition-colors"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#16a34a]" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs font-mono leading-relaxed text-[#171717]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Safely parse inline styles: code, bold, italic, link
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Regex to match inline code, bold, italic, and safe links (supporting 1 level of nested parens in URLs)
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\((?:[^()]+|\([^()]*\))*\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      const inlineCode = token.slice(1, -1);
      parts.push(
        <code
          key={`code-${match.index}`}
          className="font-mono text-[11px] px-1 py-0.5 rounded bg-[#f5f5f5] border border-[#ebebeb] text-[#171717]"
        >
          {inlineCode}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-[#171717]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={`italic-${match.index}`} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\((.*)\)$/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const href = linkMatch[2];
        const isSafe = /^https?:\/\//i.test(href) || href.startsWith("/") || href.startsWith("#");
        if (isSafe) {
          parts.push(
            <a
              key={`link-${match.index}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#171717] underline decoration-[#8f8f8f] hover:decoration-[#171717] font-medium"
            >
              {linkText}
            </a>
          );
        } else {
          parts.push(linkText);
        }
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  if (!content) return null;

  // Split into blocks: code blocks vs text blocks
  const blocks: React.ReactNode[] = [];
  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check for fenced code block start
    if (line.trim().startsWith("```")) {
      const language = line.trim().replace(/^```/, "").trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push(
        <CodeBlock
          key={`codeblock-${i}`}
          language={language}
          code={codeLines.join("\n")}
        />
      );
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      blocks.push(
        <h4 key={`h4-${i}`} className="text-sm font-semibold text-[#171717] mt-3 mb-1">
          {renderInline(line.replace(/^###\s+/, ""))}
        </h4>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <h3 key={`h3-${i}`} className="text-sm font-bold text-[#171717] mt-4 mb-1.5">
          {renderInline(line.replace(/^##\s+/, ""))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(
        <h2 key={`h2-${i}`} className="text-base font-bold text-[#171717] mt-4 mb-2">
          {renderInline(line.replace(/^#\s+/, ""))}
        </h2>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      blocks.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-2 border-[#171717] pl-3 py-1 my-2 text-xs italic text-[#666666] bg-[#fafafa]"
        >
          {renderInline(line.replace(/^>\s+/, ""))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Unordered list item
    if (/^[-*]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={`ul-${i}`} className="list-disc list-outside pl-5 my-2 space-y-1 text-xs sm:text-sm">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list item
    if (/^\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={`ol-${i}`} className="list-decimal list-outside pl-5 my-2 space-y-1 text-xs sm:text-sm">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph or empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Accumulate consecutive paragraph lines
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("> ") &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }

    blocks.push(
      <p key={`p-${i}`} className="my-1.5 leading-relaxed text-xs sm:text-sm text-[#171717]">
        {renderInline(paragraphLines.join(" "))}
      </p>
    );
  }

  return <div className={cn("space-y-1", className)}>{blocks}</div>;
}
