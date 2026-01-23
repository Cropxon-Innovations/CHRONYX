/**
 * File Upload Utilities
 * Consistent file handling, validation, and progress tracking
 */

// ============= FILE TYPE CONFIGS =============
export const FILE_TYPES = {
  pdf: {
    extensions: [".pdf"],
    mimeTypes: ["application/pdf"],
    icon: "FileText",
    label: "PDF Document",
    color: "text-red-500",
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  image: {
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic"],
    mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic"],
    icon: "Image",
    label: "Image",
    color: "text-blue-500",
    maxSize: 20 * 1024 * 1024, // 20MB
  },
  document: {
    extensions: [".doc", ".docx"],
    mimeTypes: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    icon: "FileText",
    label: "Word Document",
    color: "text-blue-600",
    maxSize: 25 * 1024 * 1024,
  },
  spreadsheet: {
    extensions: [".xls", ".xlsx"],
    mimeTypes: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    icon: "Table",
    label: "Spreadsheet",
    color: "text-green-600",
    maxSize: 25 * 1024 * 1024,
  },
  presentation: {
    extensions: [".ppt", ".pptx"],
    mimeTypes: [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    icon: "Presentation",
    label: "Presentation",
    color: "text-orange-500",
    maxSize: 50 * 1024 * 1024,
  },
  text: {
    extensions: [".txt", ".md", ".rtf"],
    mimeTypes: ["text/plain", "text/markdown", "application/rtf"],
    icon: "FileText",
    label: "Text File",
    color: "text-gray-500",
    maxSize: 10 * 1024 * 1024,
  },
};

export type FileCategory = keyof typeof FILE_TYPES;

// ============= FILE INFO =============
export interface FileInfo {
  name: string;
  size: number;
  sizeFormatted: string;
  extension: string;
  type: string;
  category: FileCategory | "unknown";
  isValid: boolean;
  validationError?: string;
}

/**
 * Format file size to human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Get file extension from filename or mime type
 */
export const getFileExtension = (filename: string, mimeType?: string): string => {
  // Try from filename first
  const lastDot = filename.lastIndexOf(".");
  if (lastDot !== -1) {
    return filename.substring(lastDot).toLowerCase();
  }
  
  // Fallback to mime type
  if (mimeType) {
    const mimeMap: Record<string, string> = {
      "application/pdf": ".pdf",
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
      "application/vnd.ms-excel": ".xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
      "text/plain": ".txt",
    };
    return mimeMap[mimeType] || "";
  }
  
  return "";
};

/**
 * Detect file category from file
 */
export const detectFileCategory = (file: File): FileCategory | "unknown" => {
  const extension = getFileExtension(file.name, file.type);
  
  for (const [category, config] of Object.entries(FILE_TYPES)) {
    if (config.extensions.includes(extension) || config.mimeTypes.includes(file.type)) {
      return category as FileCategory;
    }
  }
  
  return "unknown";
};

/**
 * Validate file for upload
 */
export const validateFile = (
  file: File,
  allowedCategories?: FileCategory[],
  maxSizeOverride?: number
): FileInfo => {
  const extension = getFileExtension(file.name, file.type);
  const category = detectFileCategory(file);
  
  const info: FileInfo = {
    name: file.name,
    size: file.size,
    sizeFormatted: formatFileSize(file.size),
    extension,
    type: file.type,
    category,
    isValid: true,
  };
  
  // Check if category is allowed
  if (allowedCategories && !allowedCategories.includes(category as FileCategory)) {
    info.isValid = false;
    info.validationError = `File type not allowed. Allowed types: ${allowedCategories.join(", ")}`;
    return info;
  }
  
  // Check file size
  const maxSize = maxSizeOverride || 
    (category !== "unknown" ? FILE_TYPES[category].maxSize : 10 * 1024 * 1024);
  
  if (file.size > maxSize) {
    info.isValid = false;
    info.validationError = `File too large. Maximum size: ${formatFileSize(maxSize)}`;
    return info;
  }
  
  return info;
};

/**
 * Upload progress tracker
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: "preparing" | "uploading" | "processing" | "complete" | "error";
  message: string;
}

export const createUploadProgress = (): UploadProgress => ({
  loaded: 0,
  total: 0,
  percentage: 0,
  stage: "preparing",
  message: "Preparing upload...",
});

export const updateUploadProgress = (
  progress: UploadProgress,
  updates: Partial<UploadProgress>
): UploadProgress => ({
  ...progress,
  ...updates,
  percentage: updates.total 
    ? Math.round(((updates.loaded ?? progress.loaded) / updates.total) * 100)
    : progress.percentage,
});

/**
 * Read file as ArrayBuffer (for PDF processing)
 */
export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Read file as Data URL (for previews)
 */
export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

/**
 * Create object URL for file preview
 */
export const createFilePreviewURL = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Revoke object URL to free memory
 */
export const revokeFilePreviewURL = (url: string): void => {
  URL.revokeObjectURL(url);
};

/**
 * Check if file is a valid PDF
 */
export const isPDF = (file: File): boolean => {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
};

/**
 * Check if file is an image
 */
export const isImage = (file: File): boolean => {
  return file.type.startsWith("image/") || 
    FILE_TYPES.image.extensions.some(ext => file.name.toLowerCase().endsWith(ext));
};

/**
 * Get file icon name based on category
 */
export const getFileIcon = (category: FileCategory | "unknown"): string => {
  if (category === "unknown") return "File";
  return FILE_TYPES[category].icon;
};

/**
 * Get file color based on category
 */
export const getFileColor = (category: FileCategory | "unknown"): string => {
  if (category === "unknown") return "text-gray-400";
  return FILE_TYPES[category].color;
};
