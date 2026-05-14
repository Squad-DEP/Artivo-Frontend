"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { UploadCloud, X, File } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  accept?: string;
  maxSizeMb?: number;
  onFile: (file: File) => void;
  disabled?: boolean;
  preview?: boolean; // show image preview for image files
  className?: string;
}

const MAX_DEFAULT_MB = 25;

export function FileUpload({
  accept = "image/*,application/pdf",
  maxSizeMb = MAX_DEFAULT_MB,
  onFile,
  disabled,
  preview = true,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validate(file: File): string | null {
    if (file.size > maxSizeMb * 1024 * 1024) {
      return `File is too large. Maximum size is ${maxSizeMb} MB.`;
    }
    return null;
  }

  function handleFile(file: File) {
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSelected(file);
    if (preview && file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
    onFile(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function clear() {
    setSelected(null);
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("space-y-2", className)}>
      {!selected ? (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors",
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <UploadCloud className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Drag & drop or{" "}
            <span className="text-primary underline underline-offset-2">
              browse
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Max {maxSizeMb} MB
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="preview"
              className="w-12 h-12 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <File className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selected.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selected.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clear}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}
