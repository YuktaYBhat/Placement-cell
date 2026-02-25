"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"

export interface FormInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helperText?: string
    required?: boolean
    onBlurSave?: () => void
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
    ({ className, label, error, helperText, required, onBlurSave, id, ...props }, ref) => {
        const inputId = id || React.useId()

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            props.onBlur?.(e)
            onBlurSave?.()
        }

        return (
            <div className="space-y-2">
                {label && (
                    <Label
                        htmlFor={inputId}
                        className={cn(
                            "text-sm font-medium text-neutral-700 dark:text-neutral-300",
                            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
                        )}
                    >
                        {label}
                    </Label>
                )}
                <div className="relative">
                    <input
                        id={inputId}
                        className={cn(
                            "flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors",
                            "bg-white dark:bg-neutral-950",
                            "text-neutral-900 dark:text-neutral-50",
                            "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
                            "ring-offset-white dark:ring-offset-neutral-950",
                            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-0",
                            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50 dark:disabled:bg-neutral-900",
                            error
                                ? "border-red-300 text-red-900 placeholder-red-300 focus-visible:border-red-500 focus-visible:ring-red-500"
                                : "border-neutral-300 dark:border-neutral-800 focus-visible:border-neutral-500 dark:focus-visible:border-neutral-500 focus-visible:ring-neutral-500 dark:focus-visible:ring-neutral-400",
                            className
                        )}
                        ref={ref}
                        onBlur={handleBlur}
                        aria-invalid={error ? "true" : "false"}
                        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                        {...props}
                    />
                    {error && (
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                        </div>
                    )}
                </div>
                {error && (
                    <p
                        id={`${inputId}-error`}
                        className="text-sm text-red-600 dark:text-red-400 flex items-start gap-1"
                        role="alert"
                    >
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p
                        id={`${inputId}-helper`}
                        className="text-xs text-neutral-500 dark:text-neutral-400"
                    >
                        {helperText}
                    </p>
                )}
            </div>
        )
    }
)

FormInput.displayName = "FormInput"

export { FormInput }
