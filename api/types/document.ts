export type DocumentType =
  | "profile_photo"
  | "certificate"
  | "business_card"
  | "generated_card"
  | "other";

export type UploadStatus = "pending" | "uploaded" | "failed";

export interface DocumentRecord {
  id: string;
  userId: string;
  documentType: DocumentType;
  fileKey: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  uploadStatus: UploadStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface InitiateUploadRequest {
  fileName: string;
  contentType: string;
  documentType: DocumentType;
  fileSize?: number;
}

export interface InitiateUploadResponse {
  document: DocumentRecord;
  uploadUrl: string;
}
