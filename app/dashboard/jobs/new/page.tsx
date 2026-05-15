"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Loader2, Check, ArrowLeft, ChevronDown } from "lucide-react";
import { useJobCreationStore } from "@/store/jobCreationStore";
import { apiService } from "@/api/api-service";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JobType {
  id: string;
  name: string;
  description: string;
}

const FIELD_INPUT =
  "w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange)]/30 bg-white";

export default function CreateJobPage() {
  const router = useRouter();
  const {
    isProcessing,
    extractedJob,
    jobCreated,
    error,
    submitVoice,
    submitText,
    updateField,
    confirmAndCreate,
    reset,
  } = useJobCreationStore();

  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [audioError, setAudioError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch job types for dropdown
  useEffect(() => {
    apiService.get<JobType[]>("/matching/job-types").then(setJobTypes).catch(() => {});
    reset();
  }, [reset]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const startRecording = async () => {
    setAudioError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("NotSupported");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType =
        ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"].find(
          (t) => MediaRecorder.isTypeSupported(t)
        ) ?? "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const actualType = recorder.mimeType || mimeType || "audio/webm";
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: actualType });
        const ext = actualType.includes("mp4") ? "mp4" : actualType.includes("ogg") ? "ogg" : "webm";
        const formData = new FormData();
        formData.append("audio", blob, `recording.${ext}`);
        await submitVoice(formData);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      const msg =
        err instanceof Error && err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow microphone access in your browser settings."
          : "Could not start recording on this device. Use the text option instead.";
      setAudioError(msg);
      setInputMode("text");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = textInput.trim();
    if (!trimmed || isProcessing) return;
    await submitText(trimmed);
  };

  const handleConfirm = async () => {
    const ok = await confirmAndCreate();
    if (ok) router.push("/dashboard/jobs");
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Success state ──────────────────────────────────────────────────
  if (jobCreated) {
    return (
      <div className="pt-10">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Posted!</h2>
            <p className="text-gray-500">Artisans will start sending proposals soon.</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push("/dashboard/jobs")}
              className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white">
              View My Jobs
            </Button>
            <Button variant="outline" onClick={() => { reset(); }}>
              Post Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main flow ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Post a Job</h1>
        <p className="text-gray-500 text-sm mt-1">
          Describe your job by voice or text — our AI fills in the details.
        </p>
      </div>

      {/* Only show input when no job extracted yet */}
      {!extractedJob && (
        <>
          {/* Hint card */}
          <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-orange-800">What to include in your message:</p>
            <div className="flex flex-col gap-2 text-xs text-orange-700">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-orange-400">●</span>
                <span><strong>Service type</strong> — e.g. plumbing, electrical, painting</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-orange-400">●</span>
                <span><strong>What needs doing</strong> — e.g. fix leaking pipe, repaint bedroom</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-orange-400">●</span>
                <span><strong>Location</strong> — your area, e.g. Yaba, Lagos</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-orange-400">●</span>
                <span><strong>Budget</strong> — optional, e.g. 10,000 naira</span>
              </div>
            </div>
            <p className="text-xs text-orange-600 italic border-t border-orange-100 pt-2">
              Example: <span className="not-italic font-medium">"I need a plumber to fix my leaking bathroom sink in Ikeja, Lagos. My budget is around 8,000 naira."</span>
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
            <button onClick={() => setInputMode("voice")}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                inputMode === "voice" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}>
              🎤 Voice
            </button>
            <button onClick={() => setInputMode("text")}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                inputMode === "text" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}>
              ✏️ Text
            </button>
          </div>

          {/* Voice input */}
          {inputMode === "voice" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center gap-5">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <Loader2 className="w-10 h-10 animate-spin text-[var(--orange)]" />
                  <p className="text-sm">Processing your voice message…</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      "w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg",
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 animate-pulse"
                        : "bg-[var(--orange)] hover:bg-[var(--orange)]/90"
                    )}
                  >
                    {isRecording
                      ? <MicOff className="w-10 h-10 text-white" />
                      : <Mic className="w-10 h-10 text-white" />
                    }
                  </button>
                  {isRecording ? (
                    <div className="text-center">
                      <p className="text-red-500 font-medium text-sm animate-pulse">Recording… {formatTime(recordingSeconds)}</p>
                      <p className="text-xs text-gray-400 mt-1">Tap to stop when done</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center">Tap the mic and describe your job</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Text input */}
          {inputMode === "text" && (
            <form onSubmit={handleTextSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              {audioError && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                  {audioError}
                </div>
              )}
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={5}
                placeholder="I need a plumber to fix my leaking bathroom sink in Ikeja, Lagos. Budget around 8,000 naira."
                disabled={isProcessing}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange)]/30 resize-none"
              />
              <Button type="submit" disabled={isProcessing || !textInput.trim()}
                className="w-full bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white">
                {isProcessing
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</>
                  : "Extract Job Details"}
              </Button>
            </form>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
          )}
        </>
      )}

      {/* Extracted fields — review & confirm */}
      {extractedJob && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Review Your Job</h2>
            <button onClick={() => { useJobCreationStore.setState({ extractedJob: null }); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline">
              Start over
            </button>
          </div>

          {/* Job Type */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Service Type <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={extractedJob.job_type_id ?? ""}
                onChange={(e) => updateField("job_type_id", e.target.value)}
                className={cn(FIELD_INPUT, "appearance-none pr-8")}
              >
                <option value="">Select a service type…</option>
                {jobTypes.map((jt) => (
                  <option key={jt.id} value={jt.id}>{jt.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Job Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={extractedJob.title ?? ""}
              onChange={(e) => updateField("title", e.target.value)}
              className={FIELD_INPUT}
              placeholder="e.g. Fix leaking bathroom sink"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={extractedJob.description ?? ""}
              onChange={(e) => updateField("description", e.target.value)}
              rows={4}
              className={cn(FIELD_INPUT, "resize-none")}
              placeholder="Describe what needs to be done…"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Location</label>
            <input
              type="text"
              value={extractedJob.location ?? ""}
              onChange={(e) => updateField("location", e.target.value)}
              className={FIELD_INPUT}
              placeholder="e.g. Ikeja, Lagos"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Budget (₦) — optional</label>
            <input
              type="number"
              min="0"
              value={extractedJob.budget ?? ""}
              onChange={(e) => updateField("budget", e.target.value ? parseFloat(e.target.value) : 0)}
              className={FIELD_INPUT}
              placeholder="Leave blank if negotiable"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button
            onClick={handleConfirm}
            disabled={isProcessing || !extractedJob.title || !extractedJob.description || !extractedJob.job_type_id}
            className="w-full bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white h-11"
          >
            {isProcessing
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Posting…</>
              : <><Check className="w-4 h-4 mr-2" />Post Job</>
            }
          </Button>
        </div>
      )}
    </div>
  );
}
