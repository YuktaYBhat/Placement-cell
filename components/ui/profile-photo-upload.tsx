"use client"

import { AlertCircleIcon, ImageIcon, UploadIcon, XIcon } from "lucide-react"

import { useFileUpload } from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface ProfilePhotoUploadProps {
  onFileChange?: (file: File | null) => void
  maxSizeMB?: number
  label?: string
  required?: boolean
  error?: string
  initialFile?: File | null
  description?: string
}

export function ProfilePhotoUpload({
  onFileChange,
  maxSizeMB = 2,
  label,
  required = false,
  error,
  initialFile,
  description
}: ProfilePhotoUploadProps) {
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
    accept: "image/png,image/jpeg,image/jpg",
    maxSize,
    onFilesChange: (updatedFiles) => {
      const file = updatedFiles.length > 0 ? updatedFiles[0].file as File : null
      onFileChange?.(file)
    }
  })

  const previewUrl = files[0]?.preview || null
  const fileName = files[0]?.file.name || null

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div className="relative">
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          className={`border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-40 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors has-[input:focus]:ring-[3px] ${error ? "border-red-500" : ""}`}
        >
          <input
            {...getInputProps()}
            className="sr-only"
            aria-label={label || "Upload profile photo"}
          />
          {previewUrl ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <img
                src={previewUrl}
                alt={fileName || "Profile photo"}
                className="mx-auto max-h-full rounded-lg object-contain border"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
              <div
                className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
                aria-hidden="true"
              >
                <ImageIcon className="size-4 opacity-60" />
              </div>
              <p className="mb-1.5 text-sm font-medium">Drop your photo here</p>
              <p className="text-muted-foreground text-xs">
                JPG or PNG (max. {maxSizeMB}MB)
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={openFileDialog}
              >
                <UploadIcon
                  className="-ms-1 size-4 opacity-60"
                  aria-hidden="true"
                />
                Select photo
              </Button>
            </div>
          )}
        </div>

        {previewUrl && (
          <div className="absolute top-2 right-2">
            <button
              type="button"
              className="focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
              onClick={() => {
                removeFile(files[0]?.id)
                onFileChange?.(null)
              }}
              aria-label="Remove photo"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
          <UploadIcon className="h-4 w-4" />
          Photo selected: {fileName}
        </div>
      )}

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
