"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export interface FormSelectProps {
    label?: string
    error?: string
    helperText?: string
    required?: boolean
    placeholder?: string
    value?: string
    onValueChange?: (value: string) => void
    onBlurSave?: () => void
    options: { value: string; label: string }[]
    disabled?: boolean
    id?: string
}

const FormSelect = React.forwardRef<HTMLButtonElement, FormSelectProps>(
    ({ label, error, helperText, required, placeholder = "Select...", value, onValueChange, onBlurSave, options, disabled, id }, ref) => {
        const selectId = id || React.useId()

        return (
            <div className="space-y-2">
                {label && (
                    <Label
                        htmlFor={selectId}
                        className={cn(
                            "text-sm font-medium text-neutral-700 dark:text-neutral-300",
                            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
                        )}
                    >
                        {label}
                    </Label>
                )}
                <Select
                    value={value}
                    onValueChange={(val) => {
                        onValueChange?.(val)
                        onBlurSave?.()
                    }}
                    disabled={disabled}
                >
                    <SelectTrigger
                        id={selectId}
                        ref={ref}
                        className={cn(
                            "w-full transition-colors",
                            error
                                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                                : "border-neutral-300 dark:border-neutral-800 focus:border-neutral-500 dark:focus:border-neutral-500 focus:ring-neutral-500 dark:focus:ring-neutral-400"
                        )}
                        aria-invalid={error ? "true" : "false"}
                        aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
                    >
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {error && (
                    <p
                        id={`${selectId}-error`}
                        className="text-sm text-red-600 dark:text-red-400"
                        role="alert"
                    >
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p
                        id={`${selectId}-helper`}
                        className="text-xs text-neutral-500 dark:text-neutral-400"
                    >
                        {helperText}
                    </p>
                )}
            </div>
        )
    }
)

FormSelect.displayName = "FormSelect"

export { FormSelect }
