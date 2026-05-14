"use client";

import { useState } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { FileUpload } from "@/components/uploads/FileUpload";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle, Loader2 } from "lucide-react";

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  onUploaded?: (url: string) => void;
}

export function ProfilePhotoUpload({
  currentPhotoUrl,
  onUploaded,
}: ProfilePhotoUploadProps) {
  const { uploadDocument, isUploading, uploadProgress, error, clearError } =
    useDocumentStore();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [done, setDone] = useState(false);

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
      setDone(true);
      setPendingFile(null);
      onUploaded?.(result.fileUrl);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted border border-border shrink-0">
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-7 h-7 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Profile Photo</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            JPG, PNG or WebP. Goes to your public profile.
          </p>
        </div>
      </div>

      <FileUpload
        accept="image/jpeg,image/png,image/webp"
        maxSizeMb={25}
        onFile={setPendingFile}
        disabled={isUploading}
        preview
      />

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {done && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          Photo uploaded successfully
        </div>
      )}

      {pendingFile && !done && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full sm:w-auto"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading… {uploadProgress}%
            </>
          ) : (
            "Upload Photo"
          )}
        </Button>
      )}
    </div>
  );
}
