"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Briefcase,
  FileText,
  MapPin,
  Banknote,
  Calendar,
  Layers,
  Check,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { SERVICE_CATEGORIES } from "@/lib/constants/categories";
import { useJobStore } from "@/store/jobStore";

// --- Zod Schema ---

const jobStageSchema = z.object({
  title: z.string().min(1, "Stage title is required"),
  description: z.string().min(1, "Stage description is required"),
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .min(0.01, "Stage amount must be at least 0.01"),
  due_date: z.string().optional(),
});

const createJobSchema = z
  .object({
    title: z
      .string()
      .min(5, "Title must be at least 5 characters")
      .max(100, "Title must be at most 100 characters"),
    description: z
      .string()
      .min(50, "Description must be at least 50 characters")
      .max(2000, "Description must be at most 2000 characters"),
    category_id: z.string().min(1, "Category is required"),
    budget_min: z.coerce
      .number({ invalid_type_error: "Budget minimum must be a number" })
      .min(0.01, "Budget minimum must be at least 0.01"),
    budget_max: z.coerce
      .number({ invalid_type_error: "Budget maximum must be a number" })
      .min(0.01, "Budget maximum must be at least 0.01"),
    location: z.object({
      city: z.string().min(1, "City is required"),
      state: z.string().min(1, "State is required"),
      country: z.string().min(1, "Country is required"),
    }),
    deadline: z.string().optional(),
    is_remote: z.boolean().optional(),
    stages: z
      .array(jobStageSchema)
      .max(20, "Maximum 20 stages allowed")
      .optional(),
  })
  .refine((data) => data.budget_max >= data.budget_min, {
    message: "Budget maximum must be greater than or equal to minimum",
    path: ["budget_max"],
  });

export type CreateJobFormValues = z.infer<typeof createJobSchema>;

// --- Step definitions ---

const STEPS = [
  { id: "basics", label: "Basics", icon: Briefcase },
  { id: "details", label: "Details", icon: FileText },
  { id: "budget", label: "Budget", icon: Banknote },
  { id: "stages", label: "Stages", icon: Layers },
  { id: "review", label: "Review", icon: Check },
] as const;

// --- Component ---

export default function CreateJobPage() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const router = useRouter();
  const { createJob, isLoading } = useJobStore();

  const form = useForm<CreateJobFormValues>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      title: "",
      description: "",
      category_id: "",
      budget_min: undefined,
      budget_max: undefined,
      location: { city: "", state: "", country: "" },
      deadline: undefined,
      is_remote: false,
      stages: [],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stages",
  });

  const onSubmit = async (data: CreateJobFormValues) => {
    const jobId = await createJob({
      title: data.title,
      description: data.description,
      category_id: data.category_id,
      budget_min: data.budget_min,
      budget_max: data.budget_max,
      location: data.location,
      deadline: data.deadline,
      is_remote: data.is_remote,
      stages: data.stages?.map((s) => ({
        title: s.title,
        description: s.description,
        amount: s.amount,
        due_date: s.due_date,
      })),
    });

    if (jobId) {
      router.push(`/dashboard/jobs/${jobId}`);
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create a New Job</h1>
        <p className="text-gray-500 mt-1">
          Fill in the details to post a job and find the right worker.
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 0 && <StepBasics form={form} />}
              {currentStep === 1 && <StepDetails form={form} />}
              {currentStep === 2 && <StepBudget form={form} />}
              {currentStep === 3 && (
                <StepStages
                  form={form}
                  fields={fields}
                  append={append}
                  remove={remove}
                />
              )}
              {currentStep === 4 && <StepReview form={form} />}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="gap-2 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading}
                className="gap-2 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create Job
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

// --- Step Indicator ---

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isCompleted
                    ? "bg-green-100 text-green-600"
                    : isActive
                      ? "bg-[var(--orange)]/10 text-[var(--orange)]"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-[var(--orange)]" : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  index < currentStep ? "bg-green-300" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// --- Step 1: Basics ---

function StepBasics({ form }: { form: ReturnType<typeof useForm<CreateJobFormValues>> }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Job Basics</h2>
        <p className="text-sm text-gray-500 mt-1">
          Start with the title and category for your job.
        </p>
      </div>

      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Job Title</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Fix leaking kitchen faucet"
                {...field}
              />
            </FormControl>
            <FormDescription>
              {field.value?.length || 0}/100 characters (min 5)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full h-12 rounded-[12px] sm:rounded-[19px] border-[#E4E4E4] bg-[#FBFBFB] px-4 sm:px-7">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {SERVICE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="is_remote"
        render={({ field }) => (
          <FormItem className="flex items-center gap-3">
            <FormControl>
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                className="w-4 h-4 rounded border-gray-300 text-[var(--orange)] focus:ring-[var(--orange)]"
              />
            </FormControl>
            <FormLabel className="!mt-0">This job can be done remotely</FormLabel>
          </FormItem>
        )}
      />
    </div>
  );
}

// --- Step 2: Details ---

function StepDetails({ form }: { form: ReturnType<typeof useForm<CreateJobFormValues>> }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Job Details</h2>
        <p className="text-sm text-gray-500 mt-1">
          Describe the job and provide location and deadline info.
        </p>
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <textarea
                placeholder="Describe the job in detail — what needs to be done, any specific requirements, materials needed, etc."
                rows={5}
                className="block w-full rounded-[12px] sm:rounded-[19px] border border-[#E4E4E4] bg-[#FBFBFB] placeholder:text-[#B4B4B4] px-4 sm:px-7 py-3 sm:py-4 text-[16px] focus:ring-0 focus-visible:border-[#FF6200] focus-visible:ring-[#FF6200]/30 focus-visible:ring-[3px] outline-none resize-none"
                {...field}
              />
            </FormControl>
            <FormDescription>
              {field.value?.length || 0}/2000 characters (min 50)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="location.city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Lagos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location.state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Lagos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location.country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Nigeria" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="deadline"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Deadline (optional)</FormLabel>
            <FormControl>
              <DatePicker
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) =>
                  field.onChange(date ? date.toISOString() : undefined)
                }
                placeholder="Select a deadline"
                fromDate={new Date()}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// --- Step 3: Budget ---

function StepBudget({ form }: { form: ReturnType<typeof useForm<CreateJobFormValues>> }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Budget</h2>
        <p className="text-sm text-gray-500 mt-1">
          Set the budget range for this job. Workers will propose amounts within
          this range.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="budget_min"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Budget (NGN)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 5000"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="budget_max"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Budget (NGN)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 20000"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-700">
          <strong>Tip:</strong> Setting a realistic budget range helps attract
          qualified workers. Workers will propose their own amount within your
          range when applying.
        </p>
      </div>
    </div>
  );
}

// --- Step 4: Stages ---

function StepStages({
  form,
  fields,
  append,
  remove,
}: {
  form: ReturnType<typeof useForm<CreateJobFormValues>>;
  fields: { id: string }[];
  append: (value: { title: string; description: string; amount: number; due_date?: string }) => void;
  remove: (index: number) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Stage Breakdown (Optional)
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Break the job into stages for milestone-based payments. If no stages
          are added, the job will be treated as a single deliverable.
        </p>
      </div>

      {fields.length > 0 && (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border border-gray-200 rounded-xl p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Stage {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  aria-label={`Remove stage ${index + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`stages.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Stage title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`stages.${index}.amount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (NGN)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="e.g. 5000"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name={`stages.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="What should be delivered in this stage?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>
          ))}
        </div>
      )}

      {fields.length < 20 && (
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({ title: "", description: "", amount: 0 })
          }
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Stage ({fields.length}/20)
        </Button>
      )}

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Layers className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            No stages added. The job will be treated as a single deliverable.
          </p>
        </div>
      )}
    </div>
  );
}

// --- Step 5: Review ---

function StepReview({ form }: { form: ReturnType<typeof useForm<CreateJobFormValues>> }) {
  const values = form.getValues();
  const category = SERVICE_CATEGORIES.find((c) => c.id === values.category_id);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review your job details before posting.
        </p>
      </div>

      <div className="space-y-4">
        <ReviewRow label="Title" value={values.title} />
        <ReviewRow label="Category" value={category?.name || values.category_id} />
        <ReviewRow
          label="Description"
          value={values.description}
          multiline
        />
        <ReviewRow
          label="Location"
          value={`${values.location.city}, ${values.location.state}, ${values.location.country}`}
        />
        <ReviewRow
          label="Budget"
          value={
            !values.budget_min && !values.budget_max
              ? "Negotiable"
              : `₦${values.budget_min?.toLocaleString("en-NG") ?? 0} – ₦${values.budget_max?.toLocaleString("en-NG") ?? 0}`
          }
        />
        {values.deadline && (
          <ReviewRow
            label="Deadline"
            value={new Date(values.deadline).toLocaleDateString("en-NG", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
        )}
        <ReviewRow
          label="Remote"
          value={values.is_remote ? "Yes" : "No"}
        />
        <ReviewRow
          label="Stages"
          value={
            values.stages && values.stages.length > 0
              ? `${values.stages.length} stage${values.stages.length > 1 ? "s" : ""}`
              : "Single deliverable (no stages)"
          }
        />

        {values.stages && values.stages.length > 0 && (
          <div className="mt-4 space-y-2">
            {values.stages.map((stage, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {i + 1}. {stage.title}
                  </p>
                  <p className="text-xs text-gray-500">{stage.description}</p>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  ₦{stage.amount?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {form.formState.errors.root && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-sm text-red-700">
            {form.formState.errors.root.message}
          </p>
        </div>
      )}
    </div>
  );
}

function ReviewRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-gray-50">
      <span className="text-sm font-medium text-gray-500 sm:w-32 shrink-0">
        {label}
      </span>
      <span
        className={`text-sm text-gray-900 ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

// --- Helpers ---

function getFieldsForStep(step: number): string[] {
  switch (step) {
    case 0:
      return ["title", "category_id"];
    case 1:
      return ["description", "location.city", "location.state", "location.country"];
    case 2:
      return ["budget_min", "budget_max"];
    case 3:
      return ["stages"];
    default:
      return [];
  }
}
