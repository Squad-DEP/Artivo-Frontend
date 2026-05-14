"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Mic,
  MicOff,
  User,
  Briefcase,
  Banknote,
  Clock,
  MapPin,
  FileText,
  Check,
  Pencil,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store/onboardingStore";

type OnboardingPhase = "intro" | "recording" | "review";

interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  colSpan?: "full" | "half";
}

const FIELDS: FieldConfig[] = [
  { key: "fullName", label: "Full Name", placeholder: "Waiting for input...", icon: <User className="w-4 h-4" />, colSpan: "half" },
  { key: "skills", label: "Services Offered", placeholder: "Waiting for input...", icon: <Briefcase className="w-4 h-4" />, colSpan: "half" },
  { key: "avgPay", label: "Hourly/Daily Rate", placeholder: "Waiting for input...", icon: <Banknote className="w-4 h-4" />, colSpan: "half" },
  { key: "experience", label: "Experience", placeholder: "Waiting for input...", icon: <Clock className="w-4 h-4" />, colSpan: "half" },
  { key: "location", label: "Location", placeholder: "Waiting for input...", icon: <MapPin className="w-4 h-4" />, colSpan: "half" },
  { key: "bio", label: "About You", placeholder: "Waiting for input...", icon: <FileText className="w-4 h-4" />, colSpan: "full" },
];

export default function WorkerOnboardingPage() {
  const router = useRouter();
  const {
    confirmationFields,
    isProcessing,
    error,
    submitText,
    submitVoice,
    correctField,
    confirmAndSave,
    reset,
    initOnboarding,
  } = useOnboardingStore();

  const [phase, setPhase] = useState<OnboardingPhase>("intro");
  const [transcription, setTranscription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [useTextInput, setUseTextInput] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    initOnboarding("worker");
  }, [initOnboarding]);

  const hasFields = Object.keys(confirmationFields).length > 0;
  const allFieldsFilled = FIELDS.every(
    (f) => confirmationFields[f.key] && confirmationFields[f.key].trim() !== ""
  );

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          await submitVoice(base64);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscription("");
    } catch {
      setUseTextInput(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTextSubmit = async () => {
    const trimmed = transcription.trim();
    if (!trimmed || isProcessing) return;
    await submitText(trimmed, []);
  };

  // Field editing
  const startEditing = (key: string) => {
    setEditingField(key);
    setEditValue(confirmationFields[key] || "");
  };

  const saveEdit = () => {
    if (editingField) {
      correctField(editingField, editValue);
      setEditingField(null);
      setEditValue("");
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  // Final submit
  const handleConfirmAndSave = async () => {
    setSaveError(null);
    setSubmitted(true);
    const success = await confirmAndSave();
    if (success) {
      reset();
      router.push("/dashboard");
    } else {
      setSubmitted(false);
      setSaveError("Failed to save your profile. Please try again.");
    }
  };

  // --- INTRO PHASE ---
  if (phase === "intro") {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen w-full px-4 py-12">
        <div className="w-full max-w-[600px] flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--orange)]/20 bg-[var(--orange)]/5 mb-6">
            <Sparkles className="w-4 h-4 text-[var(--orange)]" />
            <span className="text-sm font-medium text-[var(--orange)]">AI-Powered Onboarding</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Tell us about yourself
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-foreground/60 max-w-lg mb-10">
            Just speak naturally. Our AI will listen and extract the key information from your words. You&apos;ll get to review and edit everything before saving.
          </p>

          {/* Example quote */}
          <div className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-6 mb-8">
            <p className="text-sm text-foreground/50 mb-2">Try saying something like:</p>
            <p className="text-base italic text-foreground/70 leading-relaxed">
              &quot;My name is Emeka Johnson, I&apos;m a barber with 5 years of experience based in Lagos. I charge 2000 naira per hour and I specialize in fades and beard grooming.&quot;
            </p>
          </div>

          {/* Get Started button */}
          <button
            onClick={() => setPhase("recording")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--orange)] text-white font-medium text-base hover:bg-[var(--orange-hover)] transition-all"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    );
  }

  // --- RECORDING PHASE ---
  if (phase === "recording") {
    return (
      <main className="flex flex-col min-h-screen w-full">
        {/* Top bar with logo */}
        <div className="flex items-center px-6 sm:px-10 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[var(--orange)] flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-foreground text-xl font-semibold tracking-tight">Artivo</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1">
          {/* Left column */}
          <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 py-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-72 h-72 bg-amber-100/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-56 h-56 bg-amber-50/60 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="max-w-md mx-auto w-full relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50 mb-4">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">Step 1 of 2</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                Tell us what you do, in your own words
              </h1>
              <p className="text-base text-foreground/60 mb-1">
                Your name, services, rate, experience, and location — all in one go.
              </p>
              <p className="text-sm text-foreground/40 mb-8 italic">We&apos;ll handle the rest.</p>

              {!useTextInput && (
                <div className="flex flex-col items-center mb-8">
                  <div className="relative">
                    <div className={cn(
                      "absolute -inset-4 rounded-full transition-all duration-1000",
                      isRecording ? "bg-red-400/15 animate-pulse" : "bg-amber-300/10 animate-[pulse_3s_ease-in-out_infinite]"
                    )} />
                    {isRecording && <div className="absolute -inset-2 rounded-full bg-red-400/20 animate-ping" />}
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isProcessing}
                      className={cn(
                        "relative w-28 h-28 rounded-full flex items-center justify-center transition-all border-2 shadow-xl",
                        isRecording
                          ? "bg-red-50 border-red-300 text-red-500 shadow-red-200/40 scale-105"
                          : "bg-white border-amber-200 text-amber-600 hover:border-amber-400 hover:text-amber-700 hover:shadow-amber-200/40 hover:scale-110"
                      )}
                      aria-label={isRecording ? "Stop recording" : "Tap to start speaking"}
                    >
                      {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
                    </button>
                  </div>
                  <p className="text-sm text-foreground/60 mt-5 font-medium">
                    {isRecording ? "Listening... tap to stop" : "Tap to start speaking"}
                  </p>
                  <button onClick={() => setUseTextInput(true)} className="text-xs text-amber-600 mt-2 hover:underline font-medium">
                    Or type instead
                  </button>
                </div>
              )}

              {useTextInput && (
                <div className="mb-8">
                  <textarea
                    value={transcription}
                    onChange={(e) => setTranscription(e.target.value)}
                    placeholder="e.g. My name is Emeka Johnson, I'm a barber with 5 years experience in Lagos. I charge ₦2000/hr and specialize in fades and beard grooming."
                    disabled={isProcessing}
                    rows={5}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-[15px] leading-relaxed resize-none outline-none transition-all shadow-sm placeholder:text-foreground/30 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 focus:shadow-md disabled:opacity-50"
                  />
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={() => setUseTextInput(false)} className="text-xs text-amber-600 hover:underline font-medium">Use voice instead</button>
                    <button
                      onClick={handleTextSubmit}
                      disabled={isProcessing || !transcription.trim()}
                      className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : "Submit"}
                    </button>
                  </div>
                </div>
              )}

              {!useTextInput && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className={cn("w-4 h-4", isRecording ? "text-amber-500 animate-pulse" : "text-amber-400")} />
                    <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Live Transcription</span>
                    {isRecording && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-red-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />Recording
                      </span>
                    )}
                  </div>
                  <p className={cn("text-sm leading-relaxed min-h-[60px]", transcription ? "text-foreground" : "text-foreground/30 italic")}>
                    {transcription || "Your words will appear here as you speak..."}
                  </p>
                </div>
              )}

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-4">{error}</p>}
            </div>
          </div>

          {/* Right column — Orange panel */}
          <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 py-10 bg-[var(--orange)]/90 relative overflow-hidden">
            <div className="absolute top-8 right-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute bottom-12 left-6 w-24 h-24 rounded-full bg-white/5 blur-xl pointer-events-none" />

            <div className="max-w-md mx-auto w-full relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <Sparkles className={cn("w-4 h-4 text-white", isProcessing && "animate-spin")} />
                </div>
                <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">AI Extracted Information</span>
                {isProcessing && (
                  <span className="ml-auto text-xs text-white/80 font-medium flex items-center gap-1.5">
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-white animate-bounce [animation-delay:0ms]" />
                      <span className="w-1 h-1 rounded-full bg-white animate-bounce [animation-delay:150ms]" />
                      <span className="w-1 h-1 rounded-full bg-white animate-bounce [animation-delay:300ms]" />
                    </span>
                    Analyzing
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FIELDS.map((field) => {
                  const value = confirmationFields[field.key] || "";
                  const isEditing = editingField === field.key;
                  return (
                    <div key={field.key} className={cn(
                      "rounded-xl p-4 transition-all duration-300",
                      field.colSpan === "full" && "sm:col-span-2",
                      isEditing ? "bg-white shadow-lg ring-2 ring-white/50"
                        : value ? "bg-white/95 shadow-md hover:shadow-lg hover:scale-[1.02] border border-white/40"
                        : "bg-white/25 border border-white/40 backdrop-blur-sm"
                    )}>
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--orange)]">{field.icon}</span>
                            <span className="text-sm font-medium text-foreground">{field.label}</span>
                          </div>
                          <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--orange)] focus:ring-1 focus:ring-[var(--orange)]/20"
                            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                          />
                          <div className="flex gap-2">
                            <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[var(--orange)] rounded-lg hover:bg-[var(--orange-hover)]"><Check className="w-3 h-3" /> Save</button>
                            <button onClick={cancelEdit} className="px-3 py-1.5 text-xs font-medium text-foreground/60 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="cursor-pointer group" onClick={() => value && startEditing(field.key)}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={cn("transition-colors", value ? "text-[var(--orange)]" : "text-white")}>{field.icon}</span>
                              <span className={cn("text-sm font-semibold", value ? "text-foreground" : "text-white")}>{field.label}</span>
                            </div>
                            {value && <Pencil className="w-3.5 h-3.5 text-foreground/20 group-hover:text-[var(--orange)] transition-colors" />}
                          </div>
                          <p className={cn("mt-1.5 text-sm pl-6", value ? "text-foreground/70" : "text-white/70 italic")}>{value || field.placeholder}</p>
                          {value && (
                            <div className="mt-2 pl-6 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide">AI Detected</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer navigation */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/20">
                <button onClick={() => setPhase("intro")} className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
                  <ArrowLeft className="w-4 h-4" />Back
                </button>
                <button onClick={() => setPhase("review")} disabled={!hasFields}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white text-[var(--orange)] hover:bg-white/90 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
                  Review Information<ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --- REVIEW PHASE ---
  return (
    <main className="flex flex-col items-center min-h-screen w-full px-4 py-8">
      <div className="w-full max-w-[700px]">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Review your information
          </h1>
          <p className="text-base text-foreground/60">
            Tap any field to make corrections, then submit your profile
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {FIELDS.map((field) => {
            const value = confirmationFields[field.key] || "";
            const isEditing = editingField === field.key;

            return (
              <div
                key={field.key}
                className={cn(
                  "rounded-xl border p-4 transition-all",
                  field.colSpan === "full" && "sm:col-span-2",
                  isEditing
                    ? "border-[var(--orange)] bg-[var(--orange)]/5 ring-1 ring-[var(--orange)]/20"
                    : "border-gray-200 bg-white hover:border-[var(--orange)]/30"
                )}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground/50">{field.icon}</span>
                      <span className="text-sm font-medium text-foreground">{field.label}</span>
                    </div>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--orange)] focus:ring-1 focus:ring-[var(--orange)]/20"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[var(--orange)] rounded-lg hover:bg-[var(--orange-hover)]"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1.5 text-xs font-medium text-foreground/60 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="cursor-pointer" onClick={() => startEditing(field.key)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground/50">{field.icon}</span>
                        <span className="text-sm font-medium text-foreground">{field.label}</span>
                      </div>
                      <Pencil className="w-3.5 h-3.5 text-foreground/30" />
                    </div>
                    <p className={cn(
                      "mt-1.5 text-sm pl-6",
                      value ? "text-foreground/80" : "text-foreground/30 italic"
                    )}>
                      {value || "Not provided"}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {saveError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            {saveError}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={() => setPhase("recording")}
            className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleConfirmAndSave}
            disabled={!allFieldsFilled || isProcessing || submitted}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all",
              "bg-[var(--orange)] hover:bg-[var(--orange-hover)]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isProcessing || submitted ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Submit Profile
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
