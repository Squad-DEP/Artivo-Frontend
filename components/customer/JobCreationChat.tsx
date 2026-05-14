"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useJobCreationStore } from "@/store/jobCreationStore";
import type { ChatMessage } from "@/store/jobCreationStore";
import { Mic, Loader2, Check, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

function JobConfirmationCard() {
  const { extractedJob, updateField, confirmAndCreate, isProcessing } = useJobCreationStore();
  const [editMode, setEditMode] = useState(false);

  if (!extractedJob) return null;

  const handleConfirm = async () => {
    const success = await confirmAndCreate();
    if (success) {
      setEditMode(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Job Details</h4>
        <button
          onClick={() => setEditMode(!editMode)}
          className="text-xs text-[var(--orange)] hover:text-[var(--orange)]/80 flex items-center gap-1"
        >
          <Edit2 className="w-3 h-3" />
          {editMode ? "Done Editing" : "Edit"}
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-xs font-medium text-gray-600">Title</label>
          {editMode ? (
            <input
              type="text"
              value={extractedJob.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange)]/30"
            />
          ) : (
            <p className="text-sm text-gray-900 mt-1">{extractedJob.title}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">Description</label>
          {editMode ? (
            <textarea
              value={extractedJob.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange)]/30"
            />
          ) : (
            <p className="text-sm text-gray-900 mt-1">{extractedJob.description}</p>
          )}
        </div>

        {extractedJob.location && (
          <div>
            <label className="text-xs font-medium text-gray-600">Location</label>
            {editMode ? (
              <input
                type="text"
                value={extractedJob.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange)]/30"
              />
            ) : (
              <p className="text-sm text-gray-900 mt-1">{extractedJob.location}</p>
            )}
          </div>
        )}

        {extractedJob.budget !== undefined && extractedJob.budget > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-600">Budget (₦)</label>
            {editMode ? (
              <input
                type="number"
                value={extractedJob.budget}
                onChange={(e) => updateField("budget", parseFloat(e.target.value))}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange)]/30"
              />
            ) : (
              <p className="text-sm text-gray-900 mt-1">
                ₦{extractedJob.budget.toLocaleString("en-NG")}
              </p>
            )}
          </div>
        )}
      </div>

      <Button
        onClick={handleConfirm}
        disabled={isProcessing}
        className="w-full bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Job...
          </>
        ) : (
          <>
            <Check className="w-4 h-4 mr-2" />
            Confirm & Post Job
          </>
        )}
      </Button>
    </div>
  );
}

export default function JobCreationChat() {
  const { messages, isProcessing, extractedJob, submitText, isEditing } = useJobCreationStore();
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing, extractedJob]);

  // Focus input when processing completes
  useEffect(() => {
    if (!isProcessing && !isEditing) {
      inputRef.current?.focus();
    }
  }, [isProcessing, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isProcessing || isEditing) return;

    setInput("");
    await submitText(trimmed);
  };

  const handleVoiceRecord = () => {
    // TODO: Implement voice recording
    setIsRecording(!isRecording);
    // For now, just show a placeholder
    alert("Voice recording will be implemented with Web Audio API");
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-1 py-4 space-y-3">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isProcessing && <TypingIndicator />}
        {extractedJob && isEditing && <JobConfirmationCard />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - hide when showing confirmation card */}
      {!isEditing && (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-gray-200 pt-4 pb-2"
        >
          <button
            type="button"
            onClick={handleVoiceRecord}
            disabled={isProcessing}
            className={cn(
              "inline-flex items-center justify-center rounded-full w-10 h-10 sm:w-12 sm:h-12 border-2 transition-all",
              isRecording
                ? "border-red-500 bg-red-50 text-red-500"
                : "border-gray-300 bg-white text-gray-600 hover:border-[var(--orange)] hover:text-[var(--orange)]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            aria-label="Record voice message"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the job you need done..."
            disabled={isProcessing}
            className={cn(
              "flex-1 rounded-[12px] sm:rounded-[19px] border border-[#E4E4E4] bg-[#FBFBFB] placeholder:text-[#B4B4B4] px-4 sm:px-7 py-3 sm:py-4 text-[16px] outline-none transition-[color,box-shadow]",
              "focus-visible:border-[#FF6200] focus-visible:ring-[#FF6200]/30 focus-visible:ring-[3px]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            aria-label="Job description input"
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
      )}
    </div>
  );
}
