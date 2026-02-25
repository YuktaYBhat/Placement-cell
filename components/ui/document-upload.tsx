"use client"

import {
  AlertCircleIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react"

import {
  formatBytes,
  useFileUpload,
} from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface DocumentUploadProps {
  onFileChange?: (file: File | null) => void
  accept?: string
  maxSizeMB?: number
  label?: string
  required?: boolean
  error?: string
  initialFile?: File | { url: string; name: string } | null
  description?: string
  placeholder?: string
}

const getFileIcon = (file: { file: File | { type: string; name: string } }) => {
  const fileType = file.file instanceof File ? file.file.type : file.file.type
  const fileName = file.file instanceof File ? file.file.name : file.file.name

  if (
    fileType.includes("pdf") ||
    fileName.endsWith(".pdf") ||
    fileType.includes("word") ||
    fileName.endsWith(".doc") ||
    fileName.endsWith(".docx")
  ) {
    return <FileTextIcon className="size-5 opacity-60" />
  }

  if (fileType.startsWith("image/")) {
    return <ImageIcon className="size-5 opacity-60" />
  }

  return <FileIcon className="size-5 opacity-60" />
}

const getFilePreview = (file: { file: File | { type: string; name: string; url?: string } }) => {
  const fileType = file.file instanceof File ? file.file.type : file.file.type
  const fileName = file.file instanceof File ? file.file.name : file.file.name

  const renderImage = (src: string) => (
    <img
      src={src}
      alt={fileName}
      className="size-full rounded-t-[inherit] object-cover"
    />
  )

  return (
    <div className="bg-accent flex aspect-square items-center justify-center overflow-hidden rounded-t-[inherit]">
      {fileType.startsWith("image/") ? (
        file.file instanceof File ? (
          (() => {
            const previewUrl = URL.createObjectURL(file.file)
            return renderImage(previewUrl)
          })()
        ) : file.file.url ? (
          renderImage(file.file.url)
        ) : (
          <ImageIcon className="size-5 opacity-60" />
        )
      ) : (
        getFileIcon(file)
      )}
    </div>
  )
}

export function DocumentUpload({
  onFileChange,
  accept = "application/pdf,image/jpeg,image/png",
  maxSizeMB = 10,
  label,
  required = false,
  error,
  initialFile,
  description,
  placeholder = "Drop your file here or click to select"
}: DocumentUploadProps) {
  const maxSize = maxSizeMB * 1024 * 1024

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    accept,
    maxSize,
    initialFiles: initialFile
      ? [
        initialFile instanceof File
          ? {
            name: initialFile.name,
            size: initialFile.size,
            type: initialFile.type,
            url: URL.createObjectURL(initialFile),
            id: 'initial'
          }
          : {
            name: initialFile.name,
            size: 0,
            type: 'application/pdf',
            url: initialFile.url,
            id: 'initial'
          }
      ]
      : [],
    onFilesChange: (updatedFiles) => {
      const file = updatedFiles.length > 0 ? (updatedFiles[0].file instanceof File ? updatedFiles[0].file : null) : null
      onFileChange?.(file)
    }
  })

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-dragging={isDragging || undefined}
        data-files={files.length > 0 || undefined}
        className={`border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-32 flex-col items-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors not-data-[files]:justify-center has-[input:focus]:ring-[3px] ${error ? "border-red-500" : ""}`}
      >
        <input
          {...getInputProps()}
          className="sr-only"
          aria-label={label || "Upload file"}
        />

        {files.length > 0 ? (
          <div className="flex w-full items-center gap-3">
            <div className="bg-background relative flex flex-col rounded-md border min-w-16">
              {getFilePreview(files[0])}
              <Button
                onClick={() => {
                  removeFile(files[0].id)
                  onFileChange?.(null)
                }}
                size="icon"
                className="border-background focus-visible:border-background absolute -top-2 -right-2 size-6 rounded-full border-2 shadow-none"
                aria-label="Remove file"
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">
                {files[0].file.name}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {formatBytes(files[0].file.size)}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded mt-2">
                <UploadIcon className="h-4 w-4" />
                File selected successfully
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
            <div
              className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <FileIcon className="size-4 opacity-60" />
            </div>
            <p className="mb-1.5 text-sm font-medium">{placeholder}</p>
            <p className="text-muted-foreground text-xs">
              Max {maxSizeMB}MB • PDF, JPG, PNG formats
            </p>
            <Button variant="outline" className="mt-4" onClick={openFileDialog}>
              <UploadIcon className="-ms-1 opacity-60" aria-hidden="true" />
              Select file
            </Button>
          </div>
        )}
      </div>

      {(errors.length > 0 || error) && (
        <div
          className="text-destructive flex items-center gap-1 text-xs"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{error || errors[0]}</span>
        </div>
      )}

      {description && (
        <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: description }} />
      )}
    </div>
  )
}
