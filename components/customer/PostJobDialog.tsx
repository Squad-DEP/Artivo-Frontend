"use client";

import { useState, useEffect } from "react";
import { Briefcase, Loader2, MapPin, DollarSign, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiService } from "@/api/api-service";
import type { JobTypesResponse } from "@/api/types/marketplace-api";

interface PostJobDialogProps {
  trigger?: React.ReactNode;
  onPosted?: () => void;
}

interface FormState {
  title: string;
  description: string;
  job_type_id: string;
  location: string;
  budget: string;
}

const EMPTY: FormState = { title: "", description: "", job_type_id: "", location: "", budget: "" };

export function PostJobDialog({ trigger, onPosted }: PostJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [jobTypes, setJobTypes] = useState<JobTypesResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open && jobTypes.length === 0) {
      apiService.get<JobTypesResponse[]>("/matching/job-types").then(setJobTypes).catch(() => {});
    }
  }, [open, jobTypes.length]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.job_type_id) {
      setError("Title, description, and service type are required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiService.post("/customer/request-job", {
        body: {
          job_type_id: form.job_type_id,
          title: form.title.trim(),
          description: form.description.trim(),
          ...(form.location.trim() && { location: form.location.trim() }),
          ...(form.budget && { budget: parseFloat(form.budget) }),
        },
      });
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setForm(EMPTY);
        setSuccess(false);
        onPosted?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post job. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(EMPTY); setError(null); setSuccess(false); } }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Briefcase className="w-4 h-4" />
            Post a Job
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Post a Job</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <div className="text-4xl">✅</div>
            <p className="font-semibold text-foreground">Job posted!</p>
            <p className="text-sm text-muted-foreground">Artisans can now see and accept your job.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Service type */}
            <div className="space-y-1.5">
              <Label htmlFor="job_type">Service Type</Label>
              <div className="relative">
                <select
                  id="job_type"
                  value={form.job_type_id}
                  onChange={(e) => set("job_type_id", e.target.value)}
                  disabled={isLoading}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                >
                  <option value="">Select a service…</option>
                  {jobTypes.map((jt) => (
                    <option key={jt.id} value={jt.id}>{jt.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                placeholder="e.g. Fix leaking kitchen tap"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                disabled={isLoading}
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Describe what you need done, any special requirements, etc."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                disabled={isLoading}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 placeholder:text-muted-foreground"
              />
            </div>

            {/* Location + Budget row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g. Lekki"
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    disabled={isLoading}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="budget">Budget (₦)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    id="budget"
                    type="number"
                    min={0}
                    placeholder="Optional"
                    value={form.budget}
                    onChange={(e) => set("budget", e.target.value)}
                    disabled={isLoading}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 gap-2" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
                {isLoading ? "Posting…" : "Post Job"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
