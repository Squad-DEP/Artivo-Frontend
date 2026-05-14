"use client";

import { useEffect, useState } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { FileUpload } from "@/components/uploads/FileUpload";
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
import { Award, Plus, Trash2, Loader2, FileText, ExternalLink } from "lucide-react";
import type { DocumentRecord } from "@/api/types/document";

const CERT_TYPES = ["certificate", "other"] as const;
type CertDocumentType = (typeof CERT_TYPES)[number];

const MAX_DESCRIPTION_WORDS = 50;

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export function CertificatesSection() {
  const {
    documents,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    clearError,
  } = useDocumentStore();

  const [open, setOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState("");
  const [description, setDescription] = useState("");
  const [docType, setDocType] = useState<CertDocumentType>("certificate");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const wordCount = countWords(description);
  const overLimit = wordCount > MAX_DESCRIPTION_WORDS;

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const certs = documents.filter((d) =>
    CERT_TYPES.includes(d.documentType as CertDocumentType)
  );

  function resetForm() {
    setPendingFile(null);
    setCustomName("");
    setDescription("");
    setDocType("certificate");
    clearError();
  }

  function handleDescriptionChange(value: string) {
    // Allow typing but block if already over limit and user is adding words
    const words = value.trim() === "" ? [] : value.trim().split(/\s+/);
    if (words.length <= MAX_DESCRIPTION_WORDS) {
      setDescription(value);
    } else {
      // Allow editing within existing text (backspace, etc.) but block new words past limit
      setDescription(value);
    }
  }

  async function handleUpload() {
    if (!pendingFile || overLimit) return;
    clearError();

    const result = await uploadDocument({
      file: pendingFile,
      documentType: docType,
      fileName: customName.trim() || pendingFile.name,
      description: description.trim() || undefined,
    });

    if (result) {
      setOpen(false);
      resetForm();
      fetchDocuments();
    }
  }

  async function handleDelete(doc: DocumentRecord) {
    setDeletingId(doc.id);
    await deleteDocument(doc.id);
    setDeletingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            Certificates & Proof of Work
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload certifications, licenses, or any proof of your skills.
          </p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              <Plus className="w-3.5 h-3.5" />
              Add
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="doc-name">Document Name</Label>
                <Input
                  id="doc-name"
                  placeholder="e.g. Welding Certificate 2024, Proof of Work – Adeola Project"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  maxLength={120}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to use the filename.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="doc-desc">
                  Description{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <textarea
                  id="doc-desc"
                  rows={3}
                  placeholder="Briefly describe what this document is for, what it proves, or which project it relates to…"
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  disabled={isUploading}
                  className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 disabled:opacity-50 transition-colors"
                />
                <p className={`text-xs text-right ${overLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {wordCount} / {MAX_DESCRIPTION_WORDS} words
                </p>
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <Label>Type</Label>
                <div className="flex gap-2">
                  {(["certificate", "other"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDocType(t)}
                      className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                        docType === t
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {t === "certificate" ? "Certificate / License" : "Proof of Work / Other"}
                    </button>
                  ))}
                </div>
              </div>

              {/* File */}
              <div className="space-y-1.5">
                <Label>File</Label>
                <FileUpload
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  maxSizeMb={25}
                  onFile={setPendingFile}
                  disabled={isUploading}
                  preview
                />
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!pendingFile || isUploading || overLimit}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading… {uploadProgress}%
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading documents…
        </div>
      ) : certs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
          <Award className="w-8 h-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No documents yet. Add your first certificate.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {certs.map((doc) => (
            <li
              key={doc.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3"
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {doc.fileName || "Untitled"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {doc.documentType === "other"
                    ? "Proof of work"
                    : doc.documentType.replace(/_/g, " ")}
                  {doc.fileSize
                    ? ` · ${(doc.fileSize / 1024 / 1024).toFixed(1)} MB`
                    : ""}
                </p>
                {doc.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {doc.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="View"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => handleDelete(doc)}
                  disabled={deletingId === doc.id}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
