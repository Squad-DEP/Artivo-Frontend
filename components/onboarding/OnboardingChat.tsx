"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store/onboardingStore";
import type { ChatMessage } from "@/store/onboardingStore";

function MessageBubble({ message }: { message: ChatMessage }) {
  const isSystem = message.role === "system";

  return (
    <div
      className={cn(
        "flex w-full",
        isSystem ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isSystem
            ? "bg-gray-100 text-gray-800 rounded-bl-sm"
            : "bg-[var(--orange)] text-white rounded-br-sm"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export default function OnboardingChat() {
  const { messages, isProcessing, submitResponse } = useOnboardingStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // Focus input when processing completes
  useEffect(() => {
    if (!isProcessing) {
      inputRef.current?.focus();
    }
  }, [isProcessing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;

    setInput("");
    await submitResponse(trimmed);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-1 py-4 space-y-3">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isProcessing && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-gray-200 pt-4 pb-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your response..."
          disabled={isProcessing}
          className={cn(
            "flex-1 rounded-[12px] sm:rounded-[19px] border border-[#E4E4E4] bg-[#FBFBFB] placeholder:text-[#B4B4B4] px-4 sm:px-7 py-3 sm:py-4 text-[16px] outline-none transition-[color,box-shadow]",
            "focus-visible:border-[#FF6200] focus-visible:ring-[#FF6200]/30 focus-visible:ring-[3px]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Chat message input"
        />
        <button
          type="submit"
          disabled={isProcessing || !input.trim()}
          className={cn(
            "inline-flex items-center justify-center rounded-full w-10 h-10 sm:w-12 sm:h-12 bg-[var(--orange)] text-white transition-all",
            "hover:bg-[var(--orange)]/90 disabled:opacity-50 disabled:cursor-not-allowed",
            "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#FF6200]/30"
          )}
          aria-label="Send message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22 11 13 2 9z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
