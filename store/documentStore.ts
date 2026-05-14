import { create } from "zustand";
import { apiService } from "@/api/api-service";
import type {
  DocumentRecord,
  DocumentType,
  InitiateUploadResponse,
} from "@/api/types/document";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export interface DocumentState {
  documents: DocumentRecord[];
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;

  fetchDocuments: (documentType?: DocumentType) => Promise<void>;
  uploadDocument: (params: {
    file: File;
    documentType: DocumentType;
    fileName?: string; // custom display name
  }) => Promise<DocumentRecord | null>;
  deleteDocument: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useDocumentStore = create<DocumentState>()((set, get) => ({
  documents: [],
  isLoading: false,
  isUploading: false,
  uploadProgress: 0,
  error: null,

  fetchDocuments: async (documentType?: DocumentType) => {
    set({ isLoading: true, error: null });
    try {
      const query = documentType ? { documentType } : undefined;
      const docs = await apiService.get<DocumentRecord[]>("/documents", {
        query,
      });
      set({ documents: docs, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load documents",
        isLoading: false,
      });
    }
  },

  uploadDocument: async ({ file, documentType, fileName }) => {
    if (file.size > MAX_FILE_SIZE) {
      set({ error: "File exceeds the 25 MB limit." });
      return null;
    }

    set({ isUploading: true, uploadProgress: 0, error: null });

    try {
      // 1. Create DB record + get presigned URL
      const { document, uploadUrl } =
        await apiService.post<InitiateUploadResponse>(
          "/storage/initiate-upload",
          {
            body: {
              fileName: fileName || file.name,
              contentType: file.type,
              documentType,
              fileSize: file.size,
            },
          }
        );

      set({ uploadProgress: 20 });

      // 2. PUT file directly to R2 — no auth header, presigned URL is self-contained
      const r2Response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!r2Response.ok) {
        // Mark as failed so the pending record is cleaned up
        await apiService.patch(`/documents/${document.id}/failed`);
        throw new Error("Upload to storage failed");
      }

      set({ uploadProgress: 80 });

      // 3. Confirm upload → server marks status = 'uploaded'
      const confirmed = await apiService.patch<DocumentRecord>(
        `/documents/${document.id}/confirm`
      );

      set({ uploadProgress: 100 });

      // Add to local state
      set((state) => ({
        documents: [confirmed, ...state.documents],
        isUploading: false,
        uploadProgress: 0,
      }));

      return confirmed;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Upload failed",
        isUploading: false,
        uploadProgress: 0,
      });
      return null;
    }
  },

  deleteDocument: async (id: string) => {
    try {
      await apiService.delete(`/documents/${id}`);
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete document",
      });
    }
  },

  clearError: () => set({ error: null }),
}));
