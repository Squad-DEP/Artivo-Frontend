"use client";

import { useState } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { FileUpload } from "@/components/uploads/FileUpload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, CheckCircle, Loader2, Pencil } from "lucide-react";
import { apiService } from "@/api/api-service";

interface ProfilePhotoUploadProps {
  photoUrl?: string | null;
  name: string;
  onUploaded?: (url: string) => void;
}

export function ProfilePhotoUpload({
  photoUrl,
  name,
  onUploaded,
}: ProfilePhotoUploadProps) {
  const { uploadDocument, isUploading, uploadProgress, error, clearError } =
    useDocumentStore();
  const [open, setOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [done, setDone] = useState(false);

  function handleOpen() {
    setPendingFile(null);
    setDone(false);
    clearError();
    setOpen(true);
  }

  async function handleUpload() {
    if (!pendingFile) return;
    clearError();
    setDone(false);

    const result = await uploadDocument({
      file: pendingFile,
      documentType: "profile_photo",
      fileName: pendingFile.name,
    });

    if (result) {
      try {
        await apiService.patch("/worker/profile/photo", {
          body: { photo_url: result.fileUrl },
        });
      } catch {
        // Non-critical
      }
      setDone(true);
      onUploaded?.(result.fileUrl);
    }
  }

  return (
    <>
      {/* Avatar — whole thing is clickable */}
      <div className="relative w-fit cursor-pointer group" onClick={handleOpen}>
        <div className="w-20 h-20 rounded-full overflow-hidden bg-[var(--orange)]/10 border-2 border-white shadow-sm flex items-center justify-center">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
          ) : (
            <Camera className="w-7 h-7 text-[var(--orange)]" />
          )}
        </div>
        <div
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center group-hover:bg-gray-50 transition-colors"
          title="Edit photo"
        >
          <Pencil className="w-3.5 h-3.5 text-gray-600" />
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!isUploading) setOpen(v); }}>
        <DialogContent className="sm:max-w-[50vw]">
          <DialogHeader>
            <DialogTitle>Profile Photo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Current photo — large display */}
            {photoUrl && !pendingFile && (
              <div className="flex justify-center">
                <img
                  src={photoUrl}
                  alt={name}
                  className="w-1/2 aspect-square rounded-2xl object-cover border border-border"
                />
              </div>
            )}

            <FileUpload
              accept="image/jpeg,image/png,image/webp"
              maxSizeMb={25}
              onFile={(f) => { setDone(false); setPendingFile(f); }}
              disabled={isUploading}
              preview
            />

            {error && <p className="text-xs text-destructive">{error}</p>}

            {done && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                Photo updated
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isUploading}
              >
                {done ? "Close" : "Cancel"}
              </Button>
              {!done && (
                <Button
                  onClick={handleUpload}
                  disabled={!pendingFile || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {uploadProgress}%
                    </>
                  ) : (
                    photoUrl ? "Upload new" : "Upload"
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
