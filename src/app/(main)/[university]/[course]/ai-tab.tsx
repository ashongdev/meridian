"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useState, useRef, useEffect, type FormEvent } from "react";

type Props = {
  courseId:        string;
  courseCode:      string;
  isEnrolled:      boolean;
  initialMessages?: UIMessage[];
};

function getMessageText(m: UIMessage): string {
  return m.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");
}

export function AiTab({ courseId, courseCode, isEnrolled, initialMessages }: Props) {
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat", body: { courseId } }),
    messages: initialMessages?.length ? initialMessages : [
      {
        id:    "welcome",
        role:  "assistant",
        parts: [{ type: "text", text: `Hi! I'm your AI tutor for **${courseCode}**. Ask me anything about this course — past exam questions, concept explanations, problem walkthroughs. I'll answer based on your uploaded course materials.` }],
        metadata: {},
      } as UIMessage,
    ],
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage({ text: inputValue });
    setInputValue("");
  };

  if (!isEnrolled) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
          <span className="text-teal text-xl">◎</span>
        </div>
        <h3 className="font-display font-bold text-ink text-lg mb-2">Enroll to access AI Tutor</h3>
        <p className="font-body text-ink-2 text-sm">Join this course to get AI-powered answers grounded in your classmates&apos; uploaded materials.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "480px" }}>

      {/* ── Message list ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((m: UIMessage) => {
          const text = getMessageText(m);
          if (!text) return null;
          return (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-teal/15 border border-teal/30 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                  <span className="text-teal text-xs">◎</span>
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-body leading-relaxed ${
                m.role === "user"
                  ? "bg-teal text-paper rounded-tr-sm"
                  : "bg-surface-2 border border-border text-ink rounded-tl-sm"
              }`}>
                <MessageContent content={text} />
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-lg bg-teal/15 border border-teal/30 flex items-center justify-center mr-2 mt-0.5 shrink-0">
              <span className="text-teal text-xs">◎</span>
            </div>
            <div className="bg-surface-2 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <ThinkingDots />
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs font-body text-red-400 text-center py-2">
            {error.message?.includes("429")
              ? "AI limit reached — upgrade to Pro for unlimited tutoring."
              : "Something went wrong. Try again."}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t border-border">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about this course…"
          disabled={isLoading}
          className="flex-1 bg-surface border border-border text-ink text-sm font-body px-4 py-3 rounded-xl focus:outline-none focus:border-teal/60 placeholder:text-ink-3 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="bg-teal text-paper font-display font-bold text-sm px-5 py-3 rounded-xl hover:bg-teal-dim transition-colors disabled:opacity-40"
          style={{ boxShadow: "0 0 0 1px rgba(14,200,181,0.3)" }}
        >
          {isLoading ? "…" : "Ask"}
        </button>
      </form>
    </div>
  );
}

/* ── Markdown-lite renderer ──────────────────────────────────────────────── */
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <p className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="bg-surface-3 px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
        }
        return part;
      })}
    </p>
  );
}

function ThinkingDots() {
  return (
    <div className="flex gap-1 items-center h-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-teal/50 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}
